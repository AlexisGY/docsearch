import { Play, ArrowRight, Library, FileText, CheckCircle2, ListFilter, BarChart3, Database, Download } from 'lucide-react';
import { BatchLog, TemporalesMétricas } from '../types';

interface BatchScreenProps {
  logs: BatchLog[];
  metrics: TemporalesMétricas;
  totalLibros: number;
  totalIndices: number;
  onRunBatch: () => void;
  isBatchRunning: boolean;
}

export default function BatchScreen({
  logs,
  metrics,
  totalLibros,
  totalIndices,
  onRunBatch,
  isBatchRunning,
}: BatchScreenProps) {

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "docsearch_batch_log_bitacora.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-[#002045]">
            Reconstrucción del Índice Invertido
          </h2>
          <p className="text-sm text-[#43474e] mt-1 pr-6 leading-relaxed">
            Ejecuta el proceso batch para reconstruir el índice de búsqueda a partir de los libros registrados.
          </p>
        </div>
        <button
          onClick={onRunBatch}
          disabled={isBatchRunning}
          className="self-start md:self-center bg-[#002045] hover:bg-[#1a365d] text-white disabled:opacity-50 active:scale-95 px-6 py-3 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isBatchRunning ? 'Ejecutando batch...' : 'Ejecutar batch'}</span>
        </button>
      </div>

      {/* KPI Cards Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#43474e] tracking-wider uppercase">Libros Procesados</span>
            <p className="text-2xl font-bold text-[#002045] mt-1 font-sans">{totalLibros}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#e7eeff] text-[#002045]">
            <Library className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#43474e] tracking-wider uppercase">Términos Extraídos</span>
            <p className="text-2xl font-bold text-[#002045] mt-1 font-sans">
              {metrics.extraidos.toLocaleString('es-ES')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#e7eeff] text-[#002045]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#43474e] tracking-wider uppercase">Términos Normalizados</span>
            <p className="text-2xl font-bold text-[#002045] mt-1 font-sans">
              {metrics.normalizados.toLocaleString('es-ES')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#e7eeff] text-[#002045]">
            <ListFilter className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#43474e] tracking-wider uppercase">Registros en Índice</span>
            <p className="text-2xl font-bold text-[#002045] mt-1 font-sans">
              {totalIndices.toLocaleString('es-ES')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#e7eeff] text-[#002045]">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Flujo de proceso Card */}
      <section className="bg-white border border-[#c4c6cf]/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#002045] mb-6">
          Flujo del proceso
        </h3>
        <div className="w-full overflow-x-auto py-2">
          <div className="min-w-[700px] flex items-center justify-between px-4">
            {/* Step node 1 */}
            <div className="flex flex-col items-center gap-2 text-center w-28">
              <div className="w-12 h-12 rounded-xl bg-[#002045] text-white flex items-center justify-center shadow-xs">
                <Library className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase">Libro</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Tabla Base</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#c4c6cf]" />

            {/* Step node 2 */}
            <div className="flex flex-col items-center gap-2 text-center w-28">
              <div className="w-12 h-12 rounded-xl bg-[#dee8ff] text-[#002045] border border-[#adc7f7] flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase tracking-tighter">TMP_Termino_Extraido</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Palabras Tal Cual</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#c4c6cf]" />

            {/* Step node 3 */}
            <div className="flex flex-col items-center gap-2 text-center w-28">
              <div className="w-12 h-12 rounded-xl bg-[#dee8ff] text-[#002045] border border-[#adc7f7] flex items-center justify-center shadow-xs">
                <ListFilter className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase tracking-tighter">TMP_Termino_Normalizado</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Sin Tildes/Stop</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#c4c6cf]" />

            {/* Step node 4 */}
            <div className="flex flex-col items-center gap-2 text-center w-32">
              <div className="w-12 h-12 rounded-xl bg-[#dee8ff] text-[#002045] border border-[#adc7f7] flex items-center justify-center shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase tracking-tighter text-center">TMP_Frecuencia_Termino_Libro</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Consolidación</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#c4c6cf]" />

            {/* Step node 5 */}
            <div className="flex flex-col items-center gap-2 text-center w-28">
              <div className="w-12 h-12 rounded-xl bg-[#e7eeff] text-[#002045] border border-[#c4c6cf] flex items-center justify-center shadow-xsAlt">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase">Termino</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Vocabulario Único</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#c4c6cf]" />

            {/* Step node 6 */}
            <div className="flex flex-col items-center gap-2 text-center w-28">
              <div className="w-12 h-12 rounded-xl bg-[#002045] text-white flex items-center justify-center shadow-md">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#121c2c] uppercase">Indice_Invertido</span>
              <span className="text-[10px] text-[#43474e] font-mono-sm">Lista Invertida</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bitácora del batch card */}
      <section className="bg-white border border-[#c4c6cf]/60 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#c4c6cf]/30 flex justify-between items-center bg-[#f0f3ff]/40">
          <h3 className="text-base font-bold text-[#002045]">
            Bitácora del batch
          </h3>
          <button
            onClick={handleExportLogs}
            className="text-xs font-bold text-[#002045]/80 hover:text-[#002045] flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORTAR BITÁCORA</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f3ff]/60 border-b border-[#c4c6cf]/40">
                <th className="py-3 px-6 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[45%]">Paso</th>
                <th className="py-3 px-6 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[20%]">Estado</th>
                <th className="py-3 px-6 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[20%] text-right">Registros Procesados</th>
                <th className="py-3 px-6 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[15%] text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c6cf]/40">
              {logs.map((log) => (
                <tr key={log.id_log} className="hover:bg-[#f0f3ff]/5 transition-colors bg-white">
                  <td className="py-4 px-6 text-sm font-semibold text-[#121c2c]">
                    {log.paso}
                  </td>
                  <td className="py-4 px-6">
                    {log.estado === 'Completado' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#E6FFFA] text-[#047857] border border-[#a7f3d0]">
                        Completado
                      </span>
                    )}
                    {log.estado === 'Procesando' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping mr-1" />
                        Procesando
                      </span>
                    )}
                    {log.estado === 'Pendiente' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                        Pendiente
                      </span>
                    )}
                    {log.estado === 'Fallo' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right font-mono-sm font-semibold text-[#121c2c]">
                    {log.registros_procesados !== null ? log.registros_procesados.toLocaleString('es-ES') : '--'}
                  </td>
                  <td className="py-4 px-6 text-right font-mono-sm text-[#43474e]">
                    {log.hora || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
