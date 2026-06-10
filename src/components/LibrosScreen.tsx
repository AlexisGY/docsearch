import React, { useState } from 'react';
import { Save, Filter, CheckCircle, Clock } from 'lucide-react';
import { Libro } from '../types';

interface LibrosScreenProps {
  libros: Libro[];
  onAddLibro: (titulo: string, autor: string, contenido: string) => Promise<void>;
  loading: boolean;
}

export default function LibrosScreen({ libros, onAddLibro, loading }: LibrosScreenProps) {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [contenido, setContenido] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'Indexado' | 'Pendiente'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim() || !contenido.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }
    await onAddLibro(titulo, autor, contenido);
    setTitulo('');
    setAutor('');
    setContenido('');
  };

  const filteredLibros = filterState === 'all'
    ? libros
    : libros.filter((l) => l.estado_indexado === filterState);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold font-sans text-[#002045]">
          Registro de Nuevos Libros
        </h2>
        <p className="text-sm text-[#43474e] mt-1 pr-6 leading-relaxed">
          Ingrese los metadatos y el contenido del libro para su posterior procesamiento en el índice invertido.
        </p>
      </div>

      {/* Formulario de Registro Card */}
      <section className="bg-white border border-[#c4c6cf]/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#002045] mb-5 border-b border-[#c4c6cf]/30 pb-3">
          Formulario de Registro
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Título */}
            <div className="flex flex-col gap-2">
              <label htmlFor="titulo" className="text-xs font-bold text-[#121c2c] uppercase tracking-wider">
                Título del Libro *
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Principios de Recuperación de Información"
                required
                className="w-full border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#121c2c] bg-[#f9f9ff] focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none transition-all placeholder:text-[#43474e]/50"
              />
            </div>
            {/* Autor */}
            <div className="flex flex-col gap-2">
              <label htmlFor="autor" className="text-xs font-bold text-[#121c2c] uppercase tracking-wider">
                Autor(es) *
              </label>
              <input
                id="autor"
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ej. Salton, G."
                required
                className="w-full border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#121c2c] bg-[#f9f9ff] focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none transition-all placeholder:text-[#43474e]/50"
              />
            </div>
          </div>
          {/* Contenido / Resumen */}
          <div className="flex flex-col gap-2">
            <label htmlFor="contenido" className="text-xs font-bold text-[#121c2c] uppercase tracking-wider">
              Contenido / Resumen *
            </label>
            <textarea
              id="contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Ingrese el texto del libro o documento que será indexado..."
              rows={5}
              required
              className="w-full border border-[#c4c6cf] rounded-lg p-3 text-sm text-[#121c2c] bg-[#f9f9ff] focus:border-[#002045] focus:ring-1 focus:ring-[#002045] outline-none font-mono-sm resize-y transition-all placeholder:text-[#43474e]/50"
            />
          </div>
          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#002045] text-white hover:bg-[#1a365d] disabled:opacity-50 active:scale-95 px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar libro'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Libros Registrados Table Card */}
      <section className="bg-white border border-[#c4c6cf]/60 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#c4c6cf]/30 flex justify-between items-center bg-[#f0f3ff]/40">
          <h3 className="text-base font-bold text-[#002045]">
            Libros Registrados
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#43474e] font-semibold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar:</span>
            </span>
            <div className="flex bg-[#e7eeff] border border-[#c4c6cf]/50 p-0.5 rounded-lg">
              <button
                onClick={() => setFilterState('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  filterState === 'all' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterState('Indexado')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  filterState === 'Indexado' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                Indexados
              </button>
              <button
                onClick={() => setFilterState('Pendiente')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  filterState === 'Pendiente' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f3ff]/60 border-b border-[#c4c6cf]/40">
                <th className="py-3 px-5 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[12%]">ID</th>
                <th className="py-3 px-5 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[35%]">Título</th>
                <th className="py-3 px-5 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[23%]">Autor</th>
                <th className="py-3 px-5 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[18%]">Estado Indexado</th>
                <th className="py-3 px-5 text-xs font-bold text-[#43474e] uppercase tracking-wider w-[12%]">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c6cf]/40">
              {filteredLibros.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm font-medium text-[#43474e]/60 font-sans">
                    No se encontraron libros con este filtro.
                  </td>
                </tr>
              ) : (
                filteredLibros.map((libro, i) => (
                  <tr
                    key={libro.id_libro}
                    className={`hover:bg-[#f0f3ff]/10 transition-colors ${
                      i % 2 === 1 ? 'bg-[#f9f9ff]' : 'bg-white'
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#43474e]">
                      DOC-{libro.id_libro.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-[#002045] font-sans">
                      {libro.titulo}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-medium text-[#43474e]">
                      {libro.autor}
                    </td>
                    <td className="py-3.5 px-5">
                      {libro.estado_indexado === 'Indexado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FFFA] text-[#047857] border border-[#a7f3d0]">
                          <CheckCircle className="w-3 h-3" />
                          <span>Indexado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f3ff] text-[#43474e] border border-[#c4c6cf]">
                          <Clock className="w-3 h-3" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-[#43474e]/80">
                      {libro.fecha_registro.split(' ')[0]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
