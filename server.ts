import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDB, delay, cleanToken, STOP_WORDS } from './src/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB once at startup
  const db = await getDB();
  console.log('Base de datos SQLite inicializada.');

  // Is batch running?
  let isBatchRunning = false;

  // ==================== ENDPOINTS DE API ====================

  // GET /api/libros - Listar libros registrados
  app.get('/api/libros', async (req, res) => {
    try {
      const libros = await db.all('SELECT * FROM LIBRO ORDER BY id_libro DESC');
      res.json(libros);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al listar libros: ' + error.message });
    }
  });

  // POST /api/libros - Registrar un nuevo libro
  app.post('/api/libros', async (req, res) => {
    const { titulo, autor, contenido } = req.body;
    if (!titulo || !autor || !contenido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: titulo, autor o contenido.' });
    }

    try {
      const fecha = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const result = await db.run(
        'INSERT INTO LIBRO (titulo, autor, contenido, fecha_registro, estado_indexado) VALUES (?, ?, ?, ?, ?)',
        [titulo, autor, contenido, fecha, 'Pendiente']
      );
      const nuevoLibro = await db.get('SELECT * FROM LIBRO WHERE id_libro = ?', [result.lastID]);
      
      // Crear notificación automática
      await db.run(
        "INSERT INTO NOTIFICATION (mensaje, tipo, fecha, leido) VALUES (?, 'success', ?, 0)",
        [`Se registró el libro "${titulo}" (Pendiente de Indexar).`, fecha]
      );

      res.status(201).json(nuevoLibro);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al registrar libro: ' + error.message });
    }
  });

  // GET /api/batch/logs - Obtener logs del batch
  app.get('/api/batch/logs', async (req, res) => {
    try {
      const logs = await db.all('SELECT * FROM BATCH_LOG ORDER BY id_log ASC');
      res.json({ logs, isBatchRunning });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al consultar logs: ' + error.message });
    }
  });

  // POST /api/batch/reconstruir-indice - Proceso batch
  app.post('/api/batch/reconstruir-indice', async (req, res) => {
    if (isBatchRunning) {
      return res.status(429).json({ error: 'El proceso batch ya está en ejecución.' });
    }

    isBatchRunning = true;

    // Run batch asynchronously so the user can query progress
    (async () => {
      try {
        const now = () => {
          const d = new Date();
          return d.toTimeString().split(' ')[0]; // HH:MM:SS
        };

        // Reset logs to Pendiente at start
        await db.run("UPDATE BATCH_LOG SET estado = 'Pendiente', registros_procesados = NULL, hora = '--'");

        // Step 1: Extracción de términos
        await db.run("UPDATE BATCH_LOG SET estado = 'Procesando', hora = ? WHERE paso LIKE '1.%'", [now()]);
        await delay(1200); // aesthetic delaying for real dashboard feel

        // Clean tables
        await db.exec('DELETE FROM TMP_TERMINO_EXTRAIDO;');
        await db.exec('DELETE FROM TMP_TERMINO_NORMALIZADO;');
        await db.exec('DELETE FROM TMP_FRECUENCIA_TERMINO_LIBRO;');

        const libros = await db.all('SELECT id_libro, contenido FROM LIBRO;');
        let totalPalabrasExtraidas = 0;

        for (const libro of libros) {
          const regex = /[a-zA-Z0-9ñáéíóúÁÉÍÓÚüÜ]+/g;
          let match;
          let pos = 1;
          while ((match = regex.exec(libro.contenido)) !== null) {
            const palabraOriginal = match[0];
            await db.run(
              'INSERT INTO TMP_TERMINO_EXTRAIDO (id_libro, termino_original, posicion) VALUES (?, ?, ?)',
              [libro.id_libro, palabraOriginal, pos]
            );
            pos++;
            totalPalabrasExtraidas++;
          }
        }

        await db.run("UPDATE BATCH_LOG SET estado = 'Completado', registros_procesados = ?, hora = ? WHERE paso LIKE '1.%'", [
          totalPalabrasExtraidas, now()
        ]);

        // Step 2: Normalización y eliminación de palabras vacías
        await db.run("UPDATE BATCH_LOG SET estado = 'Procesando', hora = ? WHERE paso LIKE '2.%'", [now()]);
        await delay(1200);

        const extraidos = await db.all('SELECT id_libro, termino_original, posicion FROM TMP_TERMINO_EXTRAIDO;');
        let totalNormalizados = 0;

        for (const item of extraidos) {
          const normalizado = cleanToken(item.termino_original);
          if (normalizado && !STOP_WORDS.has(normalizado)) {
            await db.run(
              'INSERT INTO TMP_TERMINO_NORMALIZADO (id_libro, termino_normalizado, posicion) VALUES (?, ?, ?)',
              [item.id_libro, normalizado, item.posicion]
            );
            totalNormalizados++;
          }
        }

        await db.run("UPDATE BATCH_LOG SET estado = 'Completado', registros_procesados = ?, hora = ? WHERE paso LIKE '2.%'", [
          totalNormalizados, now()
        ]);

        // Step 3: Cálculo de frecuencias
        await db.run("UPDATE BATCH_LOG SET estado = 'Procesando', hora = ? WHERE paso LIKE '3.%'", [now()]);
        await delay(1200);

        const normalizados = await db.all('SELECT id_libro, termino_normalizado, posicion FROM TMP_TERMINO_NORMALIZADO ORDER BY id_libro, termino_normalizado, posicion;');
        
        interface Group {
          id_libro: number;
          termino_normalizado: string;
          posiciones: number[];
        }
        const groups: { [key: string]: Group } = {};

        for (const item of normalizados) {
          const key = `${item.id_libro}_${item.termino_normalizado}`;
          if (!groups[key]) {
            groups[key] = {
              id_libro: item.id_libro,
              termino_normalizado: item.termino_normalizado,
              posiciones: []
            };
          }
          groups[key].posiciones.push(item.posicion);
        }

        let totalFrecuencias = 0;
        for (const key in groups) {
          const g = groups[key];
          const posStr = g.posiciones.join(', ');
          await db.run(
            'INSERT INTO TMP_FRECUENCIA_TERMINO_LIBRO (termino_normalizado, id_libro, frecuencia, posiciones) VALUES (?, ?, ?, ?)',
            [g.termino_normalizado, g.id_libro, g.posiciones.length, posStr]
          );
          totalFrecuencias++;
        }

        await db.run("UPDATE BATCH_LOG SET estado = 'Completado', registros_procesados = ?, hora = ? WHERE paso LIKE '3.%'", [
          totalFrecuencias, now()
        ]);

        // Step 4: Actualización del índice invertido
        await db.run("UPDATE BATCH_LOG SET estado = 'Procesando', hora = ? WHERE paso LIKE '4.%'", [now()]);
        await delay(1500);

        // Clear and rebuild INDICE_INVERTIDO and TERMINO
        await db.exec('DELETE FROM INDICE_INVERTIDO;');
        await db.exec('DELETE FROM TERMINO;');

        // Retrieve and insert all unique terms
        const uniqueTerms = await db.all('SELECT DISTINCT termino_normalizado FROM TMP_FRECUENCIA_TERMINO_LIBRO;');
        for (const row of uniqueTerms) {
          await db.run('INSERT OR IGNORE INTO TERMINO (termino) VALUES (?);', [row.termino_normalizado]);
        }

        // Fill INDICE_INVERTIDO
        const frecuencias = await db.all('SELECT termino_normalizado, id_libro, frecuencia, posiciones FROM TMP_FRECUENCIA_TERMINO_LIBRO;');
        let totalIndices = 0;

        for (const f of frecuencias) {
          const termRow = await db.get<{ id_termino: number }>('SELECT id_termino FROM TERMINO WHERE termino = ?;', [f.termino_normalizado]);
          if (termRow) {
            await db.run(
              'INSERT OR REPLACE INTO INDICE_INVERTIDO (id_termino, id_libro, frecuencia, posiciones) VALUES (?, ?, ?, ?)',
              [termRow.id_termino, f.id_libro, f.frecuencia, f.posiciones]
            );
            totalIndices++;
          }
        }

        // Mark books as indexed
        await db.run("UPDATE LIBRO SET estado_indexado = 'Indexado';");

        await db.run("UPDATE BATCH_LOG SET estado = 'Completado', registros_procesados = ?, hora = ? WHERE paso LIKE '4.%'", [
          totalIndices, now()
        ]);

        // Crear notificación automática de éxito
        const finishDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
        await db.run(
          "INSERT INTO NOTIFICATION (mensaje, tipo, fecha, leido) VALUES (?, 'success', ?, 0)",
          [`Índice invertido reconstruido con éxito. Se indexaron ${totalIndices} términos.`, finishDate]
        );

      } catch (err: any) {
        console.error('Proceso batch fallido:', err);
        const failDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
        await db.run(
          "INSERT INTO NOTIFICATION (mensaje, tipo, fecha, leido) VALUES (?, 'error', ?, 0)",
          [`Fallo al ejecutar el proceso batch: ${err.message || err}`, failDate]
        );
      } finally {
        isBatchRunning = false;
      }
    })();

    res.json({ message: 'Procesamiento batch iniciado.', status: 'pending' });
  });

  // GET /api/temporales - Obtener métricas y registros de tablas temporales
  app.get('/api/temporales', async (req, res) => {
    try {
      const extraidosCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM TMP_TERMINO_EXTRAIDO');
      const normalizadosCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM TMP_TERMINO_NORMALIZADO');
      const frecuenciasCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM TMP_FRECUENCIA_TERMINO_LIBRO');

      const extraidos = await db.all('SELECT * FROM TMP_TERMINO_EXTRAIDO ORDER BY id_tmp DESC LIMIT 20');
      const normalizados = await db.all('SELECT * FROM TMP_TERMINO_NORMALIZADO ORDER BY id_tmp DESC LIMIT 20');
      const frecuencias = await db.all('SELECT * FROM TMP_FRECUENCIA_TERMINO_LIBRO LIMIT 20');

      res.json({
        metrics: {
          extraidos: extraidosCount?.count || 0,
          normalizados: normalizadosCount?.count || 0,
          frecuencias: frecuenciasCount?.count || 0,
        },
        sample: {
          extraidos,
          normalizados,
          frecuencias
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al consultar temporales: ' + error.message });
    }
  });

  // GET /api/indice - Visualizar el índice invertido generado
  app.get('/api/indice', async (req, res) => {
    try {
      const q = req.query.filtrar?.toString() || '';
      let rows;
      if (q) {
        const cleanFilter = cleanToken(q);
        rows = await db.all(
          `SELECT t.termino, GROUP_CONCAT(l.id_libro || ' [' || l.titulo || ']') as libros, SUM(ii.frecuencia) as frecuencia_total
           FROM INDICE_INVERTIDO ii
           JOIN TERMINO t ON ii.id_termino = t.id_termino
           JOIN LIBRO l ON ii.id_libro = l.id_libro
           WHERE t.termino LIKE ?
           GROUP BY t.id_termino
           ORDER BY t.termino ASC`,
          [`%${cleanFilter}%`]
        );
      } else {
        rows = await db.all(
          `SELECT t.termino, GROUP_CONCAT('DOC-' || l.id_libro) as libros, SUM(ii.frecuencia) as frecuencia_total
           FROM INDICE_INVERTIDO ii
           JOIN TERMINO t ON ii.id_termino = t.id_termino
           JOIN LIBRO l ON ii.id_libro = l.id_libro
           GROUP BY t.id_termino
           ORDER BY t.termino ASC`
        );
      }

      // Compute total metrics for overview
      const terminosCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM TERMINO');
      const librosCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM LIBRO WHERE estado_indexado = "Indexado"');
      const indicesCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM INDICE_INVERTIDO');

      res.json({
        indice: rows.map(r => ({
          termino: r.termino,
          libros: r.libros,
          frecuencia_total: r.frecuencia_total
        })),
        metrics: {
          terminos_unicos: terminosCount?.count || 0,
          libros_indexados: librosCount?.count || 0,
          indices: indicesCount?.count || 0,
          tamano_disco_desc: '0.24 MB'
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al consultar índice: ' + error.message });
    }
  });

  // GET /api/buscar?q=palabras - Búsqueda crítica utilizando el índice invertido
  app.get('/api/buscar', async (req, res) => {
    const q = req.query.q?.toString() || '';
    if (!q || !q.trim()) {
      return res.json([]);
    }

    try {
      // 1. Tokenize query
      const queryTokens = q.split(/\s+/).map(t => cleanToken(t)).filter(t => t.length > 0);
      if (queryTokens.length === 0) {
        return res.json([]);
      }

      // Filter stop words if we have other words, so we search intelligently
      let searchTokens = queryTokens.filter(t => !STOP_WORDS.has(t));
      if (searchTokens.length === 0) {
        searchTokens = queryTokens; // use stop words if strictly searched
      }

      // Placeholders for DB query
      const placeHolders = searchTokens.map(() => '?').join(',');

      // 2. Query Term IDs
      const termRows = await db.all(
        `SELECT id_termino, termino FROM TERMINO WHERE termino IN (${placeHolders})`,
        searchTokens
      );

      if (termRows.length === 0) {
        return res.json([]);
      }

      const termIds = termRows.map(tr => tr.id_termino);
      const matchedTermMap = new Map<number, string>();
      termRows.forEach(tr => matchedTermMap.set(tr.id_termino, tr.termino));

      const termIdsPlaceholders = termIds.map(() => '?').join(',');

      // 3. Query Inverted Index
      const indexRows = await db.all(
        `SELECT ii.id_termino, ii.id_libro, ii.frecuencia, ii.posiciones, l.titulo, l.autor, l.contenido
         FROM INDICE_INVERTIDO ii
         JOIN LIBRO l ON ii.id_libro = l.id_libro
         WHERE ii.id_termino IN (${termIdsPlaceholders})`,
        termIds
      );

      // 4. Group results by book in memory
      interface BookResult {
        id_libro: number;
        titulo: string;
        autor: string;
        contenido: string;
        terminosEncontrados: { termino: string; posiciones: string; frecuencia: number }[];
        frecuenciaTotal: number;
      }
      const groupedResults = new Map<number, BookResult>();

      for (const row of indexRows) {
        if (!groupedResults.has(row.id_libro)) {
          groupedResults.set(row.id_libro, {
            id_libro: row.id_libro,
            titulo: row.titulo,
            autor: row.autor,
            contenido: row.contenido,
            terminosEncontrados: [],
            frecuenciaTotal: 0
          });
        }

        const bookRes = groupedResults.get(row.id_libro)!;
        const terminoNombre = matchedTermMap.get(row.id_termino) || '';
        bookRes.terminosEncontrados.push({
          termino: terminoNombre,
          posiciones: row.posiciones,
          frecuencia: row.frecuencia
        });
        bookRes.frecuenciaTotal += row.frecuencia;
      }

      // 5. Structure search results with scores and abstracts
      const resultsList = Array.from(groupedResults.values()).map(book => {
        const matchingQueryTermCount = book.terminosEncontrados.length;
        const totalQueryTermCount = searchTokens.length;

        // Custom normalized academic-style score formula from 0.0 to 1.0
        // Matching terms has high impact (70%), frequency gives bonus (30%) up to 30.
        const matchesRatio = matchingQueryTermCount / totalQueryTermCount;
        const frequencyComponent = Math.min(book.frecuenciaTotal, 30) / 30.0;
        const calculatedScore = matchesRatio * 0.7 + frequencyComponent * 0.3;

        // Snippet excerpt around first matched term
        let snippet = book.contenido;
        const matchedNames = book.terminosEncontrados.map(te => te.termino);
        
        let firstIndex = -1;
        let matchedNameWord = '';
        for (const word of matchedNames) {
          const index = book.contenido.toLowerCase().indexOf(word);
          if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
            firstIndex = index;
            matchedNameWord = word;
          }
        }

        if (firstIndex !== -1) {
          const start = Math.max(0, firstIndex - 60);
          const end = Math.min(book.contenido.length, firstIndex + 140);
          snippet = book.contenido.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < book.contenido.length) snippet = snippet + '...';
        } else {
          snippet = book.contenido.substring(0, 180) + '...';
        }

        return {
          id_libro: book.id_libro,
          titulo: book.titulo,
          autor: book.autor,
          frecuencia: book.frecuenciaTotal,
          puntaje: parseFloat(calculatedScore.toFixed(2)),
          palabras_encontradas: matchedNames,
          fragmento: snippet,
          originalContenido: book.contenido
        };
      });

      // Sort by score descending, then by frequency descending
      resultsList.sort((a, b) => b.puntaje - a.puntaje || b.frecuencia - a.frecuencia);

      // Guardar consulta en el historial de búsqueda
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await db.run(
        'INSERT INTO HISTORIAL_BUSQUEDA (busqueda, fecha, resultados_count) VALUES (?, ?, ?)',
        [q, nowStr, resultsList.length]
      );

      res.json(resultsList);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al ejecutar búsqueda: ' + error.message });
    }
  });

  // POST /api/batch/optimizar - Optimizar base de datos
  app.post('/api/batch/optimizar', async (req, res) => {
    try {
      await db.exec('VACUUM;');
      await db.exec('ANALYZE;');

      // Crear notificación automática
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await db.run(
        "INSERT INTO NOTIFICATION (mensaje, tipo, fecha, leido) VALUES (?, 'success', ?, 0)",
        ['Base de datos optimizada exitosamente (VACUUM y ANALYZE ejecutados).', nowStr]
      );

      res.json({ message: 'Base de datos optimizada exitosamente. Índices actualizados y espacio liberado.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al optimizar base de datos: ' + error.message });
    }
  });

  // ==================== ENDPOINTS DE NOTIFICACIONES E HISTORIAL ====================

  // GET /api/notifications - Listar notificaciones
  app.get('/api/notifications', async (req, res) => {
    try {
      const notifications = await db.all('SELECT * FROM NOTIFICATION ORDER BY id_notification DESC');
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al listar notificaciones: ' + error.message });
    }
  });

  // POST /api/notifications/read - Marcar notificaciones como leídas
  app.post('/api/notifications/read', async (req, res) => {
    try {
      await db.run('UPDATE NOTIFICATION SET leido = 1');
      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al marcar notificaciones como leídas: ' + error.message });
    }
  });

  // DELETE /api/notifications - Vaciar notificaciones
  app.delete('/api/notifications', async (req, res) => {
    try {
      await db.exec('DELETE FROM NOTIFICATION');
      res.json({ success: true, message: 'Notificaciones eliminadas.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al vaciar notificaciones: ' + error.message });
    }
  });

  // GET /api/historial - Obtener historial de búsqueda
  app.get('/api/historial', async (req, res) => {
    try {
      const historial = await db.all('SELECT * FROM HISTORIAL_BUSQUEDA ORDER BY id_historial DESC LIMIT 50');
      res.json(historial);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al obtener historial de búsqueda: ' + error.message });
    }
  });

  // DELETE /api/historial/:id - Eliminar un item específico del historial
  app.delete('/api/historial/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.run('DELETE FROM HISTORIAL_BUSQUEDA WHERE id_historial = ?', [id]);
      res.json({ success: true, message: 'Elemento del historial eliminado.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al eliminar elemento del historial: ' + error.message });
    }
  });

  // DELETE /api/historial - Vaciar historial completo
  app.delete('/api/historial', async (req, res) => {
    try {
      await db.exec('DELETE FROM HISTORIAL_BUSQUEDA');
      res.json({ success: true, message: 'Historial de búsqueda vaciado.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al vaciar historial de búsqueda: ' + error.message });
    }
  });


  // ==================== VITE MIDDLEWARE / STATIC SERVING ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Buscador Documental (DocSearch) backend local iniciado en http://localhost:${PORT}`);
  });
}

startServer();
