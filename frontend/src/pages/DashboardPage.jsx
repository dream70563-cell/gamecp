import { 
  Cpu, 
  HardDrive, 
  Users, 
  Globe, 
  Clock, 
  Activity, 
  Terminal, 
  Play, 
  Square, 
  RotateCw, 
  Save, 
  ArrowUpRight
} from 'lucide-react';
import { StatusBadge, TunnelBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export function DashboardPage({ status, sendPower, sendAction, logs, onNavigateConsole }) {
  const isOnline = status?.running ?? false;
  const cpu = status?.system?.cpu ?? 0;
  const ram = status?.system?.ramMB ?? 0;
  const totalRam = status?.system?.totalRamMB ?? 0;
  const ramPercent = status?.system?.ramPercent ?? 0;
  const uptimeSeconds = status?.uptime ?? 0;

  const formatUptime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const playersList = status?.players?.players || [];
  const onlinePlayers = status?.players?.online || 0;
  const maxPlayers = status?.players?.max || 10;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              Minecraft Bedrock Dedicated Server
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{status?.world || 'Dream70563_Server'}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Realtime WebSocket synchronized control panel. Single source of truth backend active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="success"
              disabled={isOnline}
              onClick={() => sendPower('start')}
              icon={Play}
            >
              Start Server
            </Button>
            <Button
              variant="danger"
              disabled={!isOnline}
              onClick={() => sendPower('stop')}
              icon={Square}
            >
              Stop
            </Button>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Utilization */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPU Usage</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-100">{cpu}%</div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(cpu, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RAM Usage</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-100">{ram} / {totalRam} MB</div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(ramPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Players Online */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Players Online</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-100">
              {onlinePlayers} <span className="text-sm font-normal text-slate-500">/ {maxPlayers}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {playersList.length > 0 ? playersList.join(', ') : 'No active players'}
            </p>
          </div>
        </div>

        {/* Uptime */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Uptime</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-100">{formatUptime(uptimeSeconds)}</div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge running={isOnline} />
              <span className="text-xs text-slate-500 font-mono">PID: {status?.pid || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Server Properties Overview & Playit Tunnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World & Server Specs */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              World & Server Configuration
            </h3>
            <span className="text-xs font-mono text-slate-400">BEDROCK EDITION</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">World Level</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{status?.world || 'Dream70563_Server'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">Gamemode</div>
              <div className="text-sm font-semibold text-slate-200 capitalize mt-0.5">{status?.gamemode || 'survival'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">Difficulty</div>
              <div className="text-sm font-semibold text-slate-200 capitalize mt-0.5">{status?.difficulty || 'easy'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">Port (IPv4 / IPv6)</div>
              <div className="text-sm font-semibold font-mono text-cyan-400 mt-0.5">19132 / 19133</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">Process ID (PID)</div>
              <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5">{status?.pid || 'Offline'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-500">Playit Tunnel</div>
              <div className="mt-0.5">
                <TunnelBadge running={status?.tunnel?.running} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Power Actions & World Commands */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Save className="w-4 h-4 text-emerald-400" />
              Quick Save & Backup
            </h3>
            <p className="text-xs text-slate-400 mt-3">
              Trigger instant level hold, resume file locks, or create compressed world backups.
            </p>

            <div className="space-y-2.5 mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => sendAction('save-hold')}
                icon={Save}
              >
                Save Hold (Lock World)
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => sendAction('save-resume')}
                icon={RotateCw}
              >
                Save Resume (Unlock)
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start"
                onClick={() => sendAction('backup')}
                icon={Save}
              >
                Create Backup Snapshot
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <span className="text-[11px] text-slate-500 font-mono">Single Source of Truth Agent</span>
          </div>
        </div>
      </div>

      {/* Terminal Preview Card */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Live Terminal Stream</h3>
          </div>
          <button
            onClick={onNavigateConsole}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open Full Console
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1.5 border border-slate-800/80 select-text">
          {logs && logs.length > 0 ? (
            logs.slice(-12).map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed border-l-2 border-transparent hover:border-blue-500 pl-2">
                {line}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic py-8 text-center">No terminal output yet...</div>
          )}
        </div>
      </div>
    </div>
  );
}
