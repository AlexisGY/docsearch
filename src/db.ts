import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDB(): Promise<Database> {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), 'docsearch.db');
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await initDB(dbInstance);
  }
  return dbInstance;
}

// Simple sleep helper to simulate real-world processing times
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function initDB(db: Database) {
  // Activa claves foráneas
  await db.run('PRAGMA foreign_keys = ON;');

  // 1. Tabla LIBRO
  await db.exec(`
    CREATE TABLE IF NOT EXISTS LIBRO (
      id_libro INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      contenido TEXT NOT NULL,
      fecha_registro TEXT NOT NULL,
      estado_indexado TEXT NOT NULL DEFAULT 'Pendiente'
    );
  `);

  // 2. Tabla TERMINO
  await db.exec(`
    CREATE TABLE IF NOT EXISTS TERMINO (
      id_termino INTEGER PRIMARY KEY AUTOINCREMENT,
      termino TEXT UNIQUE NOT NULL
    );
  `);

  // 3. Tabla INDICE_INVERTIDO
  await db.exec(`
    CREATE TABLE IF NOT EXISTS INDICE_INVERTIDO (
      id_termino INTEGER,
      id_libro INTEGER,
      frecuencia INTEGER,
      posiciones TEXT,
      PRIMARY KEY(id_termino, id_libro),
      FOREIGN KEY(id_termino) REFERENCES TERMINO(id_termino) ON DELETE CASCADE,
      FOREIGN KEY(id_libro) REFERENCES LIBRO(id_libro) ON DELETE CASCADE
    );
  `);

  // 4. Tablas temporales
  await db.exec(`
    CREATE TABLE IF NOT EXISTS TMP_TERMINO_EXTRAIDO (
      id_tmp INTEGER PRIMARY KEY AUTOINCREMENT,
      id_libro INTEGER,
      termino_original TEXT,
      posicion INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS TMP_TERMINO_NORMALIZADO (
      id_tmp INTEGER PRIMARY KEY AUTOINCREMENT,
      id_libro INTEGER,
      termino_normalizado TEXT,
      posicion INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS TMP_FRECUENCIA_TERMINO_LIBRO (
      termino_normalizado TEXT,
      id_libro INTEGER,
      frecuencia INTEGER,
      posiciones TEXT
    );
  `);

  // 5. Tabla BATCH_LOG
  await db.exec(`
    CREATE TABLE IF NOT EXISTS BATCH_LOG (
      id_log INTEGER PRIMARY KEY AUTOINCREMENT,
      paso TEXT NOT NULL,
      estado TEXT NOT NULL,
      registros_procesados INTEGER,
      hora TEXT
    );
  `);

  // 6. Tabla NOTIFICATION
  await db.exec(`
    CREATE TABLE IF NOT EXISTS NOTIFICATION (
      id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
      mensaje TEXT NOT NULL,
      tipo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      leido INTEGER DEFAULT 0
    );
  `);

  // 7. Tabla HISTORIAL_BUSQUEDA
  await db.exec(`
    CREATE TABLE IF NOT EXISTS HISTORIAL_BUSQUEDA (
      id_historial INTEGER PRIMARY KEY AUTOINCREMENT,
      busqueda TEXT NOT NULL,
      fecha TEXT NOT NULL,
      resultados_count INTEGER DEFAULT 0
    );
  `);

  // Semilla de libros si está vacío
  const booksCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM LIBRO;');
  if (booksCount && booksCount.count === 0) {
    const seedBooks = [
      {
        titulo: 'Introducción a los Algoritmos',
        autor: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
        contenido: 'Los algoritmos de búsqueda en árboles binarios proporcionan una eficiencia de tiempo O(log n) en el caso promedio, lo cual reduce drásticamente la complejidad computacional en grandes conjuntos de datos.',
        fecha_registro: '2026-06-01 10:45:00',
        estado_indexado: 'Pendiente'
      },
      {
        titulo: 'Estructuras de Datos Eficientes',
        autor: 'Mark Allen Weiss',
        contenido: 'Una búsqueda en profundidad (DFS) es útil para explorar topologías complejas, aunque no garantiza el camino más corto en grafos no ponderados.',
        fecha_registro: '2026-06-03 11:20:00',
        estado_indexado: 'Pendiente'
      },
      {
        titulo: 'Sistemas de Bases de Datos',
        autor: 'Ramez Elmasri, Shamkant B. Navathe',
        contenido: 'Un sistema de gestión de bases de datos almacena información estructurada y provee lenguajes de consulta eficientes para recuperar datos sin realizar búsquedas secuenciales costosas sobre el disco físico.',
        fecha_registro: '2026-06-05 14:15:00',
        estado_indexado: 'Pendiente'
      },
      {
        titulo: 'Minería de Texto Avanzada',
        autor: 'Charu C. Aggarwal',
        contenido: 'La minería de texto y la optimización de índices invertidos permiten construir motores de búsqueda rápidos y escalables para analizar literatura científica y encontrar términos relevantes en segundos.',
        fecha_registro: '2026-06-07 16:30:00',
        estado_indexado: 'Pendiente'
      }
    ];

    for (const book of seedBooks) {
      await db.run(
        'INSERT INTO LIBRO (titulo, autor, contenido, fecha_registro, estado_indexado) VALUES (?, ?, ?, ?, ?)',
        [book.titulo, book.autor, book.contenido, book.fecha_registro, book.estado_indexado]
      );
    }

    // Initialize clean batch log template as well
    await db.exec('DELETE FROM BATCH_LOG;');
    const initialLogs = [
      { paso: '1. Extracción de términos', estado: 'Pendiente', registros_procesados: null, hora: '--' },
      { paso: '2. Normalización y eliminación de palabras vacías', estado: 'Pendiente', registros_procesados: null, hora: '--' },
      { paso: '3. Cálculo de frecuencias', estado: 'Pendiente', registros_procesados: null, hora: '--' },
      { paso: '4. Actualización del índice invertido', estado: 'Pendiente', registros_procesados: null, hora: '--' }
    ];
    for (const log of initialLogs) {
      await db.run(
        'INSERT INTO BATCH_LOG (paso, estado, registros_procesados, hora) VALUES (?, ?, ?, ?)',
        [log.paso, log.estado, log.registros_procesados, log.hora]
      );
    }
  }
}

// Spanish Stop Words
export const STOP_WORDS = new Set([
  'y', 'e', 'o', 'u', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'como', 'sin', 'sobre',
  'tras', 'durante', 'mediante', 'desde', 'hasta', 'que', 'este', 'esta',
  'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos',
  'aquellas', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'me', 'te', 'se', 'nos', 'os',
  'lo', 'le', 'les', 'yo', 'tu', 'el', 'ella', 'nosotros', 'nosotras', 'vosotros',
  'vosotras', 'ellos', 'ellas', 'otro', 'otra', 'otros', 'otras', 'todo',
  'toda', 'todos', 'todas', 'cada', 'algun', 'alguna', 'algunos', 'algunas',
  'ningun', 'ninguna', 'ningunos', 'ningunas', 'no', 'si', 'pero', 'mas', 'muy',
  'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas', 'con'
]);

// Cleans a single token to match Spanish alphabetical rules
export function cleanToken(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove tildes and accents
    .replace(/[^a-z0-9ñ]/g, '');     // keep only alphanumeric and ñ
}
