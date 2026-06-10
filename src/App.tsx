import { useState, useEffect, useRef } from 'react';
import { Libro, BatchLog, TemporalesMétricas, IndiceItem, BusquedaResult, AlertMessage, Notification, HistorialBusqueda } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LibrosScreen from './components/LibrosScreen';
import BatchScreen from './components/BatchScreen';
import BuscadorScreen from './components/BuscadorScreen';
import IndiceScreen from './components/IndiceScreen';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'registro' | 'batch' | 'buscador' | 'indice'>('buscador');
  const [libros, setLibros] = useState<Libro[]>([]);
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [metrics, setMetrics] = useState<TemporalesMétricas>({ extraidos: 0, normalizados: 0, frecuencias: 0 });
  const [indice, setIndice] = useState<IndiceItem[]>([]);
  const [indiceMetrics, setIndiceMetrics] = useState({ terminos_unicos: 0, libros_indexados: 0, indices: 0, tamano_disco_desc: '0.24 MB' });
  const [searchResults, setSearchResults] = useState<BusquedaResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  
  // Custom Toast Alerts
  const [alert, setAlert] = useState<AlertMessage | null>(null);

  // Notifications and search history states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useState<HistorialBusqueda[]>([]);

  // Poll Ref for cleanup on unmount
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setAlert({ text, type });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // 1. Fetch Libros
  const fetchLibros = async () => {
    try {
      const res = await fetch('/api/libros');
      if (res.ok) {
        const data = await res.json();
        setLibros(data);
      }
    } catch (err) {
      console.error('Error al listar libros:', err);
    }
  };

  // 2. Fetch Logs and IsBatch status
  const fetchLogsAndStatus = async () => {
    try {
      const res = await fetch('/api/batch/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setIsBatchRunning(data.isBatchRunning);
        return data.isBatchRunning;
      }
    } catch (err) {
      console.error('Error al consultar logs:', err);
    }
    return false;
  };

  // 3. Fetch Temporales
  const fetchTemporales = async () => {
    try {
      const res = await fetch('/api/temporales');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error al consultar temporales:', err);
    }
  };

  // 4. Fetch Indice
  const fetchIndice = async (filterArg = '') => {
    try {
      const url = filterArg ? `/api/indice?filtrar=${encodeURIComponent(filterArg)}` : '/api/indice';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIndice(data.indice);
        setIndiceMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error al consultar índice:', err);
    }
  };

  // 4b. Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error al listar notificaciones:', err);
    }
  };

  // 4c. Fetch History
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/historial');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error al listar historial:', err);
    }
  };

  // 5. Fetch search results
  const executeSearch = async (queryStr: string) => {
    if (!queryStr || !queryStr.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    setGlobalLoading(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setSearched(true);
        // Actualizar historial de búsquedas
        fetchHistory();
      } else {
        showAlert('No se pudo completar la búsqueda en el índice', 'error');
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      showAlert('Fallo de conexión al buscar', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Run full catalog load at startup
  useEffect(() => {
    fetchLibros();
    fetchLogsAndStatus();
    fetchTemporales();
    fetchIndice();
    fetchNotifications();
    fetchHistory();
  }, []);

  // Set up polling logic when `isBatchRunning` changes
  useEffect(() => {
    if (isBatchRunning) {
      // Create polling interval to fetch progress in real-time
      pollIntervalRef.current = setInterval(async () => {
        const active = await fetchLogsAndStatus();
        fetchTemporales();
        fetchLibros();
        fetchIndice();
        
        if (!active) {
          // Batch completed!
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          showAlert('Proceso batch de reconstrucción completado con éxito.', 'success');
          // Actualizar notificaciones al finalizar el proceso batch
          fetchNotifications();
          // Refresh search if active to show new indexes matches
          if (searchQuery) {
            executeSearch(searchQuery);
          }
        }
      }, 1000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isBatchRunning]);

  // Actions
  const handleAddLibro = async (titulo: string, autor: string, contenido: string) => {
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/libros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ titulo, autor, contenido }),
      });
      if (res.ok) {
        showAlert(`Libro "${titulo}" registrado exitosamente. (Pendiente de Indexar)`, 'success');
        fetchLibros();
        fetchNotifications();
      } else {
        const errData = await res.json();
        showAlert(errData.error || 'Error al persistir libro', 'error');
      }
    } catch (err) {
      showAlert('Error de red al guardar el libro', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRunBatch = async () => {
    if (isBatchRunning) return;
    try {
      const res = await fetch('/api/batch/reconstruir-indice', {
        method: 'POST',
      });
      if (res.ok) {
        setIsBatchRunning(true);
        showAlert('Ejecutando proceso batch de indexación invertida...', 'info');
      } else {
        const errData = await res.json();
        showAlert(errData.error || 'No se pudo iniciar el batch', 'error');
      }
    } catch (err) {
      showAlert('Error de red al desencadenar el batch', 'error');
    }
  };

  const handleDatabaseOptimization = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/batch/optimizar', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        showAlert(data.message, 'success');
        fetchIndice();
        fetchNotifications();
      } else {
        showAlert('No se pudo optimizar la base de datos', 'error');
      }
    } catch (err) {
      showAlert('Error de conexión con el optimizador', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error al marcar notificaciones leídas:', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error al vaciar notificaciones:', err);
    }
  };

  const handleDeleteHistoryItem = async (id: number) => {
    try {
      const res = await fetch(`/api/historial/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Error al borrar elemento del historial:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/historial', { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error('Error al vaciar historial:', err);
    }
  };

  const handleSelectHistoryItem = (query: string) => {
    setSearchQuery(query);
    setActiveTab('buscador');
    executeSearch(query);
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] text-[#121c2c] flex font-sans">
      
      {/* Toast Alert Popup */}
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-5 py-3.5 bg-white border border-[#c4c6cf]/80 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-sm">
          {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {alert.type === 'info' && <RotateCcw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
          <span className="text-xs font-semibold text-[#121c2c] leading-snug">{alert.text}</span>
        </div>
      )}

      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOptimize={handleDatabaseOptimization}
        optimizing={optimizing}
      />

      {/* Main Container Scrollable Canvas */}
      <div className="flex-1 pl-[260px] flex flex-col min-h-screen relative">
        {/* Top Header navbar */}
        <Header
          title={
            activeTab === 'registro'
              ? 'Registro de Libros'
              : activeTab === 'batch'
              ? 'Módulo Batch'
              : activeTab === 'buscador'
              ? 'Buscador Académico'
              : 'Verificación del Índice Invertido'
          }
          notifications={notifications}
          history={history}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onClearNotifications={handleClearNotifications}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onSelectHistoryItem={handleSelectHistoryItem}
        />

        {/* View content panel */}
        <main className="flex-grow p-8 bg-[#F7FAFC]">
          {activeTab === 'registro' && (
            <LibrosScreen libros={libros} onAddLibro={handleAddLibro} loading={globalLoading} />
          )}

          {activeTab === 'batch' && (
            <BatchScreen
              logs={logs}
              metrics={metrics}
              totalLibros={libros.length}
              totalIndices={indiceMetrics.indices}
              onRunBatch={handleRunBatch}
              isBatchRunning={isBatchRunning}
            />
          )}

          {activeTab === 'buscador' && (
            <BuscadorScreen
              onSearch={executeSearch}
              results={searchResults}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searched={searched}
              totalIndices={indiceMetrics.indices}
            />
          )}

          {activeTab === 'indice' && (
            <IndiceScreen indice={indice} metrics={indiceMetrics} onFilter={fetchIndice} />
          )}
        </main>
      </div>
    </div>
  );
}
