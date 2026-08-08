import { Play,  Square, Cpu, HardDrive, Wifi } from 'lucide-react';
import { StatusBadge, TunnelBadge } from '../common/Badge';
import { Button } from '../common/Button';

export function Header({ status, sendPower }) {
  const isOnline = status?.running ?? false;
  const cpu = status?.system?.cpu ?? 0;
  const ram = status?.system?.ramMB ?? 0;
  const serverName = status?.world || 'Dream70563_Server';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Server Name & Status Badges */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">{serverName}</h1>
            <StatusBadge running={isOnline} />
            <TunnelBadge running={status?.tunnel?.running} />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1 font-mono">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              19132 (UDP)
            </span>
            <span>•</span>
            <span>
                Bedrock BDS {status?.bedrockVersion ? `v${status.bedrockVersion}` : ''}
              </span>
          </div>
        </div>
      </div>

      {/* Center: System Quick Metrics */}
      <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">CPU</div>
            <div className="text-sm font-semibold font-mono text-slate-200">{cpu}%</div>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-800"></div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Memory</div>
            <div className="text-sm font-semibold font-mono text-slate-200">{ram} MB</div>
          </div>
        </div>
      </div>

      {/* Right: Power Action Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="success"
          size="sm"
          disabled={isOnline}
          onClick={() => sendPower('start')}
          icon={Play}
        >
          Start
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!isOnline}
          onClick={() => sendPower('stop')}
          icon={Square}
        >
          Stop
        </Button>
      </div>
    </header>
  );
}
