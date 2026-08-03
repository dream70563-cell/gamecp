import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  Users,
  Globe,
  FolderTree,
  Sliders,
  Save,
  Box,
  ShieldCheck
} from 'lucide-react';

export function Sidebar({ status }) {
  const isOnline = status?.running ?? false;
  const playerCount = status?.players?.online ?? 0;
  const maxPlayers = status?.players?.max ?? 10;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/console', label: 'Console', icon: Terminal },
    { to: '/players', label: 'Players', icon: Users, badge: isOnline ? `${playerCount}/${maxPlayers}` : null },
    { to: '/worlds', label: 'Worlds', icon: Globe },
    { to: '/files', label: 'File Manager', icon: FolderTree },
    { to: '/settings', label: 'Server Settings', icon: Sliders },
    { to: '/actions', label: 'Backups & Saves', icon: Save },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 leading-none">GameCP</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Bedrock Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Pterodactyl Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Single source of truth REST & WebSocket backend.
        </p>
      </div>
    </aside>
  );
}
