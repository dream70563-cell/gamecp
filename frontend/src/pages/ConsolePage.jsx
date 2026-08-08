import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Send, 
  Copy, 
  Trash2, 
  Search, 
  ArrowDown, 
  Check,
  Zap
} from 'lucide-react';
import Ansi from 'ansi-to-html';
import { Button } from '../components/common/Button';

const ansiConverter = new Ansi({
  fg: '#e5e7eb',
  bg: '#000000',
  newline: true,
  escapeXML: true,
  colors: {
    1: '#f87171', // red
    2: '#4ade80', // green
    3: '#facc15', // yellow
    4: '#60a5fa', // blue
    5: '#c084fc', // purple
    6: '#22d3ee', // cyan
  }
});

export function ConsolePage({ logs, status, sendCommand, clearLogs }) {
  const [inputCommand, setInputCommand] = useState('');
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

  const players = status?.players?.players || [];

  const playerQuery = inputCommand
    .split(" ")
    .pop()
    .toLowerCase();

  const filteredPlayers = playerQuery
    ? players.filter(player =>
        player.toLowerCase().includes(playerQuery)
      )
    : [];

  const terminalRef = useRef(null);

  // Auto scroll logic
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim();
    sendCommand(cmd);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputCommand('');
  };

  const handleKeyDown = (e) => {

    // Player suggestion navigation
    if (filteredPlayers.length > 0) {

      if (e.key === 'ArrowDown') {
        e.preventDefault();

        setSuggestionIndex(prev =>
          prev < filteredPlayers.length - 1 ? prev + 1 : 0
        );

        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();

        setSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : filteredPlayers.length - 1
        );

        return;
      }

      if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault();

        const player = filteredPlayers[suggestionIndex];

        const parts = inputCommand.trim().split(" ");
        parts[parts.length - 1] = player;

        setInputCommand(parts.join(" "));
        setSuggestionIndex(-1);

        return;
      }
    }


    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (commandHistory.length === 0) return;

      const nextIdx =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);

      setHistoryIndex(nextIdx);
      setInputCommand(commandHistory[nextIdx] || '');

    } else if (e.key === 'ArrowDown') {

      e.preventDefault();

      if (historyIndex === -1) return;

      const nextIdx = historyIndex + 1;

      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputCommand('');
      } else {
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistory[nextIdx]);
      }
    }

    if (e.key === 'Escape') {
      setSuggestionIndex(-1);
    }
  };

  const handleCopyLogs = () => {
    const fullText = logs.join('');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = filterText 
    ? logs.filter(line => line.toLowerCase().includes(filterText.toLowerCase()))
    : logs;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Live Server Console</h2>
            <p className="text-xs text-slate-400">WebSocket streamed terminal with Bedrock log parser & ANSI support.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          {/* Auto scroll lock */}
          <Button
            variant={autoScroll ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            icon={ArrowDown}
          >
            {autoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
          </Button>

          {/* Copy Logs */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLogs}
            icon={copied ? Check : Copy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          {/* Clear Logs */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            icon={Trash2}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Display Area */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-200 overflow-y-auto space-y-1 selection:bg-blue-600/40"
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((line, idx) => (
            <div 
              key={idx} 
              className="whitespace-pre-wrap leading-relaxed border-l-2 border-transparent hover:border-blue-500/80 pl-2 text-slate-300 font-mono"
              dangerouslySetInnerHTML={{ __html: ansiConverter.toHtml(line) }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <Terminal className="w-8 h-8 stroke-1 text-slate-700" />
            <p className="text-sm italic">Terminal ready. Waiting for output...</p>
          </div>
        )}
      </div>

      {/* Interactive Command Input Prompt */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
        <div className="px-3 py-2 text-xs font-mono font-semibold text-emerald-400 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-1.5 shrink-0">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          [server@bedrock ~]$
        </div>
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g., list, op PlayerName, say Hello, kick...)"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none"
        />
        
          {filteredPlayers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-2 right-2 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
              {filteredPlayers.map((player, index) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => {
                    const parts = inputCommand.trim().split(" ");
                    parts[parts.length - 1] = player;
                    setInputCommand(parts.join(" "));
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-mono ${
                      index === suggestionIndex
                        ? "bg-blue-600 text-white"
                        : "text-slate-200 hover:bg-slate-800"
                    }`}
                >
                  🟢 {player}
                </button>
              ))}
            </div>
          )}

<Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputCommand.trim()}
          icon={Send}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
