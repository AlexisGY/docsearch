import { BookOpen, Cpu, Search, Database, Zap, Settings, HelpCircle, Inbox } from 'lucide-react';

interface SidebarProps {
  activeTab: 'registro' | 'batch' | 'buscador' | 'indice';
  setActiveTab: (tab: 'registro' | 'batch' | 'buscador' | 'indice') => void;
  onOptimize: () => void;
  optimizing: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, onOptimize, optimizing }: SidebarProps) {
  const menuItems = [
    {
      id: 'registro' as const,
      label: 'Registro de Libros',
      icon: BookOpen,
    },
    {
      id: 'batch' as const,
      label: 'Proceso Batch',
      icon: Cpu,
    },
    {
      id: 'buscador' as const,
      label: 'Buscador',
      icon: Search,
    },
    {
      id: 'indice' as const,
      label: 'Índice Invertido',
      icon: Database,
    },
  ];

  return (
    <aside className="w-[260px] h-screen bg-[#e7eeff] border-r border-[#c4c6cf]/60 flex flex-col justify-between py-6 px-4 fixed left-0 top-0 z-50">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-lg bg-[#002045] flex items-center justify-center text-white shadow-md">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-[#002045] tracking-tight leading-tight">
              Buscador Documental
            </h1>
            <p className="text-[10px] text-[#43474e] font-medium uppercase tracking-wider">
              V1.0 - Índice Académico
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#d9e3f9] text-[#002045] font-bold shadow-[0_2px_4px_rgba(0,32,69,0.04)] scale-[0.98]'
                    : 'text-[#43474e] hover:bg-[#dee8ff] hover:text-[#002045]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#002045]' : 'text-[#43474e]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        {/* CTA Button */}
        <div className="px-1">
          <button
            onClick={onOptimize}
            disabled={optimizing}
            className="w-full bg-[#002045] text-white hover:bg-[#1a365d] active:scale-98 transition-all px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 fill-current ${optimizing ? 'animate-bounce' : ''}`} />
            <span>{optimizing ? 'Optimizando...' : 'Optimizar índice'}</span>
          </button>
        </div>

        {/* Footer Connections */}
        <div className="pt-4 border-t border-[#c4c6cf]/60 flex flex-col gap-0.5">
          <button
            onClick={() => alert('Parámetros del sistema: Configuración de stop words y paths SQLite correctos.')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#43474e] hover:bg-[#dee8ff]/60 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#43474e]" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => alert('Soporte técnico: yanpollgaray@gmail.com - DocSearch V1.0')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#43474e] hover:bg-[#dee8ff]/60 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#43474e]" />
            <span>Soporte</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
