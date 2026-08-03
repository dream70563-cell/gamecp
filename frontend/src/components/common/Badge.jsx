export function StatusBadge({ running }) {
  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 glow-online">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        ONLINE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 glow-offline">
      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
      OFFLINE
    </span>
  );
}

export function TunnelBadge({ running }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium ${
      running 
        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }`}>
      {running ? 'PLAYIT ACTIVE' : 'NO TUNNEL'}
    </span>
  );
}
