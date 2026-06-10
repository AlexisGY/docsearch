import React, { useState, useEffect } from 'react';
import { Search, Info, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { IndiceItem } from '../types';

interface IndiceScreenProps {
  indice: IndiceItem[];
  metrics: {
    terminos_unicos: number;
    libros_indexados: number;
    indices: number;
    tamano_disco_desc: string;
  };
  onFilter: (query: string) => void;
}

export default function IndiceScreen({ indice, metrics, onFilter }: IndiceScreenProps) {
  const [filterStr, setFilterStr] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filterStr);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(indice.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIndice = indice.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    // Reset page if data length changes
    setCurrentPage(1);
  }, [indice.length]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-[#002045]">
          Índice Invertido
        </h2>
        <p className="text-sm text-[#43474e] mt-1 pr-6 leading-relaxed">
          Relación entre términos y libros asociados para reducir el recorrido secuencial de documentos en cada consulta.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Data Table (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          
          {/* Sub Filter Input widget */}
          <form
            onSubmit={handleFilterSubmit}
            className="bg-white border border-[#c4c6cf]/60 rounded-xl p-3 flex items-center gap-3 focus-within:border-[#002045] focus-within:shadow-[0_4px_12px_rgba(0,32,69,0.06)] transition-all"
          >
            <Search className="w-5 h-5 text-[#43474e]/60" />
            <input
              type="text"
              value={filterStr}
              onChange={(e) => setFilterStr(e.target.value)}
              placeholder="Filtrar indexaciones por palabra clave..."
              className="flex-1 bg-transparent border-none text-sm text-[#121c2c] placeholder:text-[#43474e]/50 outline-none"
            />
            <button
              type="submit"
              className="bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              Filtrar
            </button>
          </form>

          {/* Table list */}
          <div className="bg-white border border-[#c4c6cf]/60 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#002045] text-white border-b border-[#1a365d] text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 w-1/4">Término</th>
                    <th className="py-3 px-5 w-2/4">Libros asociados (DocID)</th>
                    <th className="py-3 px-5 w-1/4 text-right">Frecuencia total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]/40 font-mono text-xs">
                  {indice.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-sm font-medium text-[#43474e]/50 font-sans">
                        No se encontraron términos indexados en el catálogo. ¿Ejecutó ya el proceso batch?
                      </td>
                    </tr>
                  ) : (
                    paginatedIndice.map((row, idx) => (
                      <tr
                        key={row.termino}
                        className={`hover:bg-[#f0f3ff]/10 transition-colors ${
                          idx % 2 === 1 ? 'bg-[#f9f9ff]' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-5 font-bold text-[#002045] text-[13px] font-sans">
                          {row.termino}
                        </td>
                        <td className="py-3 px-5 text-[#43474e] font-sans tracking-wide">
                          {/* Formatting associated books like [DOC-0001, DOC-0002] */}
                          <span className="font-mono text-[#002045] bg-[#e7eeff] px-2 py-0.5 rounded border border-[#c4c6cf]/30 font-semibold">
                            {row.libros ? `[${row.libros}]` : '[]'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-[#121c2c]">
                          {row.frecuencia_total.toLocaleString('es-ES')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {indice.length > 0 && (
              <div className="bg-[#f0f3ff]/40 p-4 flex justify-between items-center border-t border-[#c4c6cf]/40 text-xs font-bold text-[#43474e] font-sans">
                <span>
                  Mostrando {startIndex + 1}-{Math.min(indice.length, startIndex + itemsPerPage)} de{' '}
                  {indice.length.toLocaleString('es-ES')} términos
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 px-2 border border-[#c4c6cf]/50 rounded-md bg-white hover:bg-[#e7eeff] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#002045]" />
                  </button>
                  <span className="px-2 py-1 bg-white border border-[#c4c6cf]/50 rounded-md text-[#002045]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 px-2 border border-[#c4c6cf]/50 rounded-md bg-white hover:bg-[#e7eeff] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-[#002045]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Explanation text box */}
          <div className="bg-[#f0f3ff]/70 border border-[#c4c6cf]/60 rounded-xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#002045]">
              <Info className="w-5 h-5" />
              <h3 className="font-sans font-bold text-[#002045] h-6 flex items-center">
                Estructura del índice
              </h3>
            </div>
            <p className="text-xs text-[#43474e] leading-relaxed">
              La lista invertida mapea de forma anticipada cada término normalizado obtenido del vocabulario a los documentos o libros donde aparece.
            </p>
            <p className="text-xs text-[#43474e] leading-relaxed">
              Al consultar un término en el portal del buscador, el procesador online de búsquedas accede directamente a esta colección auxiliar, recuperando los DocIDs indexados sin necesidad de escanear linealmente la tabla de libros.
            </p>
          </div>

          {/* Metric cards summary */}
          <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="text-xs font-bold text-[#43474e] uppercase tracking-wider border-b border-[#c4c6cf]/30 pb-2">
              Métricas del Índice
            </div>
            <ul className="flex flex-col gap-3 text-xs font-mono font-medium text-[#121c2c]">
              <li className="flex justify-between items-center border-b border-[#c4c6cf]/20 pb-1.5">
                <span className="font-sans text-[#43474e] font-semibold">Términos únicos:</span>
                <strong className="text-sm font-bold text-[#002045]">
                  {metrics.terminos_unicos.toLocaleString('es-ES')}
                </strong>
              </li>
              <li className="flex justify-between items-center border-b border-[#c4c6cf]/20 pb-1.5">
                <span className="font-sans text-[#43474e] font-semibold">Libros indexados:</span>
                <strong className="text-sm font-bold text-[#002045]">{metrics.libros_indexados}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-[#c4c6cf]/20 pb-1.5">
                <span className="font-sans text-[#43474e] font-semibold">Relaciones índice:</span>
                <strong className="text-sm font-bold text-[#002045]">
                  {metrics.indices.toLocaleString('es-ES')}
                </strong>
              </li>
              <li className="flex justify-between items-center">
                <span className="font-sans text-[#43474e] font-semibold">Tamaño en disco:</span>
                <strong className="text-sm font-bold text-[#002045]">
                  {metrics.tamano_disco_desc}
                </strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
