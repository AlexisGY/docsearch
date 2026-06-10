import React, { useState, useEffect } from 'react';
import { Search, Info, HelpCircle } from 'lucide-react';
import { BusquedaResult } from '../types';

interface BuscadorScreenProps {
  onSearch: (query: string) => Promise<void>;
  results: BusquedaResult[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searched: boolean;
  totalIndices: number;
}

export default function BuscadorScreen({
  onSearch,
  results,
  searchQuery,
  setSearchQuery,
  searched,
  totalIndices,
}: BuscadorScreenProps) {
  const [txt, setTxt] = useState(searchQuery);

  useEffect(() => {
    setTxt(searchQuery);
  }, [searchQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(txt);
    onSearch(txt);
  };

  // Safe highlighter function for the search term snippets
  const highlightSnippet = (text: string, words: string[]) => {
    if (!words || words.length === 0) return <span>{text}</span>;

    // Normalize both ways or escape regex
    const escapedWords = words
      .map((w) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .filter((w) => w.length > 0);

    if (escapedWords.length === 0) return <span>{text}</span>;

    // Split text securely by matching keywords case-insensitively
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const matched = words.some((w) => w.toLowerCase() === part.toLowerCase());
          return matched ? (
            <strong
              key={index}
              className="bg-[#FEFCBF] text-[#2c3e50] font-bold px-1 rounded border border-[#eec213]/20"
            >
              {part}
            </strong>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 flex flex-col gap-8 animate-fade-in">
      {/* Search Bar Widget Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold font-sans text-[#002045] tracking-tight">
          Búsqueda de Libros
        </h2>
        <p className="text-sm text-[#43474e] mt-1.5 max-w-xl mx-auto">
          Encuentre literatura indexada utilizando consultas rápidas sobre el índice invertido.
        </p>

        <form onSubmit={handleFormSubmit} className="relative mt-8 max-w-2xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#43474e]/60 group-focus-within:text-[#002045]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            placeholder="Buscar palabras clave (ej: algoritmo, datos, busqueda)..."
            required
            className="block w-full pl-12 pr-28 py-4 bg-white border border-[#c4c6cf]/80 rounded-full text-base text-[#121c2c] placeholder:text-[#43474e]/50 shadow-sm hover:shadow-md focus:shadow-md focus:border-[#002045] focus:ring-2 focus:ring-[#e7eeff] outline-none transition-all pr-32"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-6 bg-[#002045] text-white hover:bg-[#1a365d] active:scale-95 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
          >
            Buscar
          </button>
        </form>

        <p className="text-xs text-[#43474e] mt-3.5 flex items-center justify-center gap-1.5 font-medium">
          <Info className="w-4 h-4 text-[#002045]/80" />
          <span>Consulta realizada utilizando el Índice Invertido pre-procesado</span>
        </p>
      </div>

      {/* Results Content Area */}
      <div className="space-y-6 mt-2">
        {totalIndices === 0 && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3.5 text-left">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">El índice invertido está vacío</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Parece que aún no ha indexado los libros almacenados. Por favor, navegue a la pestaña{' '}
                <strong>Proceso Batch</strong> y haga clic en <strong>Ejecutar batch</strong> para iniciar la indexación inicial de términos.
              </p>
            </div>
          </div>
        )}

        {searched ? (
          <div>
            <div className="flex justify-between items-center px-2 mb-4">
              <span className="text-xs text-[#43474e] font-semibold uppercase tracking-wider">
                Resultados encontrados ({results.length})
              </span>
              {results.length > 0 && (
                <span className="text-[11px] font-mono-sm text-[#43474e]">
                  Búsqueda realizada en SQLite de forma instantánea
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-10 text-center shadow-xs">
                <HelpCircle className="w-10 h-10 text-[#43474e]/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#002045]">Sin coincidencias</h4>
                <p className="text-xs text-[#43474e] mt-1 max-w-sm mx-auto leading-relaxed">
                  No se encontraron términos coincidentes en el índice para su consulta "{searchQuery}". Pruebe utilizando palabras aisladas de los libros registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((res) => (
                  <div
                    key={res.id_libro}
                    className="bg-white border border-[#c4c6cf]/60 rounded-xl p-6 hover:shadow-md transition-all shadow-xs flex flex-col gap-3 group text-left"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#002045] font-sans group-hover:text-[#1a365d] transition-colors">
                          {res.titulo}
                        </h3>
                        <p className="text-xs text-[#43474e] font-medium mt-0.5">
                          {res.autor}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FFFA] text-[#047857] border border-[#a7f3d0]">
                          Puntaje: {res.puntaje.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f3ff] text-[#002045] border border-[#c4c6cf]/50">
                          Frecuencia: {res.frecuencia}
                        </span>
                      </div>
                    </div>

                    {/* Tag list of terms matched */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {res.palabras_encontradas.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-[#f0f3ff] text-[#002045] font-mono text-[11px] font-bold border border-[#c4c6cf]/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Highlighted text excerpt */}
                    <div className="mt-2 p-4 bg-[#f9f9ff] rounded-lg border border-[#c4c6cf]/40 leading-relaxed text-sm text-[#121c2c]">
                      <p className="font-sans">
                        {highlightSnippet(res.fragmento, res.palabras_encontradas)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#c4c6cf]/60 rounded-xl p-10 text-center shadow-xs">
            <Search className="w-8 h-8 text-[#002045]/40 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[#002045]">Inicie una búsqueda</h4>
            <p className="text-xs text-[#43474e] mt-1">
              Ingrese algún término en el buscador superior para recuperar e interrogar las ocurrencias indexadas de los libros.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
