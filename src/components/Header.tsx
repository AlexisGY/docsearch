import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  History, 
  Trash2, 
  CheckCheck, 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock 
} from 'lucide-react';
import { Notification, HistorialBusqueda } from '../types';

interface HeaderProps {
  title: string;
  notifications: Notification[];
  history: HistorialBusqueda[];
  onMarkNotificationsRead: () => void;
  onClearNotifications: () => void;
  onDeleteHistoryItem: (id: number) => void;
  onClearHistory: () => void;
  onSelectHistoryItem: (query: string) => void;
}

export default function Header({
  title,
  notifications,
  history,
  onMarkNotificationsRead,
  onClearNotifications,
  onDeleteHistoryItem,
  onClearHistory,
  onSelectHistoryItem,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.leido === 0).length;

  return (
    <header className="h-[64px] sticky top-0 z-40 bg-white border-b border-[#c4c6cf]/50 flex items-center justify-between px-8">
      <div className="flex-1">
        <h2 className="hidden md:block font-sans font-medium text-[#002045]/70 text-sm tracking-wide uppercase">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHistory(false);
            }}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[#121c2c] hover:bg-[#e7eeff] hover:text-[#002045] transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              showNotifications ? 'bg-[#e7eeff] text-[#002045]' : ''
            }`}
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-[360px] bg-white border border-[#c4c6cf]/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 animate-fade-in flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-[#F9F9FF] border-b border-[#c4c6cf]/40 flex items-center justify-between">
                <span className="text-xs font-bold text-[#002045] uppercase tracking-wider">
                  Notificaciones
                </span>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onMarkNotificationsRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-blue-100 shadow-xs"
                      title="Marcar todas como leídas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Leer todo</span>
                    </button>
                    <button
                      onClick={onClearNotifications}
                      className="p-1 rounded text-[#43474e] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-[#c4c6cf]/30 bg-white"
                      title="Limpiar todas las notificaciones"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-[#c4c6cf]/30">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#43474e]/60 flex flex-col items-center justify-center gap-2">
                    <Bell className="w-8 h-8 text-[#c4c6cf]" />
                    <p className="text-xs font-medium">No tienes notificaciones</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = notif.leido === 0;
                    return (
                      <div
                        key={notif.id_notification}
                        className={`p-3.5 text-left flex gap-3 transition-colors ${
                          isUnread ? 'bg-[#f4f7ff] border-l-4 border-blue-600 pl-2.5' : 'pl-3.5'
                        }`}
                      >
                        {notif.tipo === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {notif.tipo === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        {notif.tipo === 'info' && (
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs text-[#121c2c] leading-normal font-sans ${isUnread ? 'font-semibold' : ''}`}>
                            {notif.mensaje}
                          </p>
                          <span className="text-[10px] text-[#43474e]/70 mt-1 block">
                            {notif.fecha}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search History Dropdown Container */}
        <div className="relative" ref={historyRef}>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowNotifications(false);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-[#121c2c] hover:bg-[#e7eeff] hover:text-[#002045] transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              showHistory ? 'bg-[#e7eeff] text-[#002045]' : ''
            }`}
            title="Historial de búsquedas"
          >
            <History className="w-5 h-5" />
          </button>

          {/* History Dropdown Panel */}
          {showHistory && (
            <div className="absolute right-0 top-12 w-[320px] bg-white border border-[#c4c6cf]/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 animate-fade-in flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-[#F9F9FF] border-b border-[#c4c6cf]/40 flex items-center justify-between">
                <span className="text-xs font-bold text-[#002045] uppercase tracking-wider">
                  Historial de Búsqueda
                </span>
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-red-100 shadow-xs"
                    title="Vaciar todo el historial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-[#c4c6cf]/30">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-[#43474e]/60 flex flex-col items-center justify-center gap-2">
                    <History className="w-8 h-8 text-[#c4c6cf]" />
                    <p className="text-xs font-medium">El historial está vacío</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id_historial}
                      onClick={() => {
                        onSelectHistoryItem(item.busqueda);
                        setShowHistory(false);
                      }}
                      className="p-3 text-left flex items-center justify-between hover:bg-[#f9f9ff] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Search className="w-3.5 h-3.5 text-[#43474e]/50 group-hover:text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#121c2c] truncate">
                            {item.busqueda}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[#43474e]/70">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{item.fecha}</span>
                            <span>•</span>
                            <span className="font-mono text-[#002045]">
                              {item.resultados_count} res.
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id_historial);
                        }}
                        className="p-1 rounded-full text-[#43474e]/40 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                        title="Eliminar esta búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-[#c4c6cf]/60 mx-2" />

        <div className="flex items-center gap-3 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#d9e3f9] overflow-hidden border border-[#c4c6cf]/80 flex items-center justify-center font-bold text-xs text-[#002045]">
            <img
              alt="Researcher profile portrait"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120"
            />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-[#121c2c]">Yanpoll</p>
            <p className="text-[10px] text-[#43474e]">Investigador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
