import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Trash2, Radio, Send } from 'lucide-react';

export function WorldChatPage({
  worldChat = [],
  clearWorldChat,
  sendWorldChat,
  status,
}) {
  const bottomRef = useRef(null);
  const [message, setMessage] = useState('');

  const handleSend = (event) => {
    event.preventDefault();

    const text = message.trim();
    if (!text) return;

    const sent = sendWorldChat?.(text);

    if (sent !== false) {
      setMessage('');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [worldChat]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';

    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />

            <h1 className="text-xl font-bold text-slate-100">
              World Chat
            </h1>

            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Radio className="w-3 h-3" />
              LIVE
            </span>
          </div>

          <p className="text-sm text-slate-400 mt-1">
            {status?.world || 'Minecraft Server'}
          </p>
        </div>

        <button
          type="button"
          onClick={clearWorldChat}
          className="flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-slate-900 border border-slate-800
                     text-slate-400 hover:text-red-400
                     hover:border-red-500/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-3">
          {worldChat.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />

              <p className="text-slate-400 font-medium">
                No world chat yet
              </p>

              <p className="text-xs text-slate-600 mt-1">
                Messages from Minecraft will appear here in real time.
              </p>
            </div>
          ) : (
            worldChat.map((chat, index) => (
              <div
                key={`${chat.timestamp || 'chat'}-${index}`}
                className="rounded-lg bg-slate-900/70 border border-slate-800/80 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-sm font-semibold text-blue-400">
                    {chat.player || 'Unknown Player'}
                  </span>

                  <span className="text-[11px] font-mono text-slate-600">
                    {formatTime(chat.timestamp)}
                  </span>
                </div>

                <p className="text-sm text-slate-200 break-words whitespace-pre-wrap">
                  {chat.message}
                </p>
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="mt-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Send message to Minecraft..."
          autoComplete="off"
          className="flex-1 min-w-0 rounded-lg border border-slate-800
                     bg-slate-950 px-4 py-3 text-sm text-slate-100
                     placeholder:text-slate-600 outline-none
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
        />

        <button
          type="submit"
          disabled={!message.trim()}
          className="flex items-center justify-center gap-2 rounded-lg
                     bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                     hover:bg-blue-500 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      <div className="mt-2 text-xs text-slate-500">
        {worldChat.length} message{worldChat.length === 1 ? '' : 's'} received
      </div>
    </div>
  );
}
