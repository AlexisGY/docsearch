export interface Libro {
  id_libro: number;
  titulo: string;
  autor: string;
  contenido: string;
  fecha_registro: string;
  estado_indexado: 'Pendiente' | 'Indexado';
}

export interface BatchLog {
  id_log: number;
  paso: string;
  estado: 'Pendiente' | 'Procesando' | 'Completado' | 'Fallo';
  registros_procesados: number | null;
  hora: string;
}

export interface TemporalesMétricas {
  extraidos: number;
  normalizados: number;
  frecuencias: number;
}

export interface IndiceItem {
  termino: string;
  libros: string;
  frecuencia_total: number;
}

export interface BusquedaResult {
  id_libro: number;
  titulo: string;
  autor: string;
  frecuencia: number;
  puntaje: number;
  palabras_encontradas: string[];
  fragmento: string;
}

export interface AlertMessage {
  type: 'success' | 'info' | 'error';
  text: string;
}

export interface Notification {
  id_notification: number;
  mensaje: string;
  tipo: 'success' | 'info' | 'error';
  fecha: string;
  leido: number;
}

export interface HistorialBusqueda {
  id_historial: number;
  busqueda: string;
  fecha: string;
  resultados_count: number;
}

