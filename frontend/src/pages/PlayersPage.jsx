import { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  ShieldOff, 
  UserX, 
  Navigation, 
  Gamepad2, 
  Search, 
  Crown
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export function PlayersPage({ status, sendAction }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'tp' | 'gamemode' | 'kick'
  const [tpCoordinates, setTpCoordinates] = useState('0 100 0');
  const [selectedGamemode, setSelectedGamemode] = useState('creative');

  const playerNames = status?.players?.players || [];
  const onlineCount = status?.players?.online || 0;
  const maxPlayers = status?.players?.max || 10;

  const filteredPlayers = playerNames.filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExecuteKick = () => {
    if (selectedPlayer) {
      sendAction('kick', { player: selectedPlayer });
      setActionModalType(null);
      setSelectedPlayer(null);
    }
  };

  const handleExecuteOp = (player) => {
    sendAction('op', { player });
  };

  const handleExecuteDeop = (player) => {
    sendAction('deop', { player });
  };

  const handleExecuteTp = () => {
    if (selectedPlayer) {
      sendAction('tp', { player: selectedPlayer, target: tpCoordinates });
      setActionModalType(null);
      setSelectedPlayer(null);
    }
  };

  const handleExecuteGamemode = () => {
    if (selectedPlayer) {
      sendAction('gamemode', { player: selectedPlayer, mode: selectedGamemode });
      setActionModalType(null);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Player Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Realtime connected Bedrock player list with quick administrative actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gamertag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs font-semibold text-emerald-400">
            ONLINE: {onlineCount} / {maxPlayers}
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <div 
              key={player}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-600/20">
                    {player.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                      {player}
                      {player === 'Dream70563' && (
                        <Crown className="w-4 h-4 text-amber-400" title="Host Operator" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Ping: 24ms</span>
                    </div>
                  </div>
                </div>

                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExecuteOp(player)}
                  icon={Shield}
                >
                  Give OP
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExecuteDeop(player)}
                  icon={ShieldOff}
                >
                  De-OP
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedPlayer(player);
                    setActionModalType('tp');
                  }}
                  icon={Navigation}
                >
                  Teleport
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedPlayer(player);
                    setActionModalType('gamemode');
                  }}
                  icon={Gamepad2}
                >
                  Gamemode
                </Button>

                <div className="col-span-2 mt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedPlayer(player);
                      setActionModalType('kick');
                    }}
                    icon={UserX}
                  >
                    Kick Player
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto stroke-1 mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Players Online</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When players connect to your Bedrock Dedicated Server, they will appear here in real-time.
          </p>
        </div>
      )}

      {/* Action Modals */}
      {/* Kick Modal */}
      <Modal
        isOpen={actionModalType === 'kick'}
        onClose={() => setActionModalType(null)}
        title={`Kick Player: ${selectedPlayer}`}
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to disconnect <strong className="text-slate-100">{selectedPlayer}</strong> from the server?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setActionModalType(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleExecuteKick}>Kick Player</Button>
        </div>
      </Modal>

      {/* Teleport Modal */}
      <Modal
        isOpen={actionModalType === 'tp'}
        onClose={() => setActionModalType(null)}
        title={`Teleport Player: ${selectedPlayer}`}
      >
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Target Coordinates (X Y Z) or Player
          </label>
          <input
            type="text"
            value={tpCoordinates}
            onChange={(e) => setTpCoordinates(e.target.value)}
            placeholder="e.g. 0 100 0"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setActionModalType(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleExecuteTp}>Execute Teleport</Button>
        </div>
      </Modal>

      {/* Gamemode Modal */}
      <Modal
        isOpen={actionModalType === 'gamemode'}
        onClose={() => setActionModalType(null)}
        title={`Change Gamemode: ${selectedPlayer}`}
      >
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Gamemode
          </label>
          <select
            value={selectedGamemode}
            onChange={(e) => setSelectedGamemode(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="survival">Survival</option>
            <option value="creative">Creative</option>
            <option value="adventure">Adventure</option>
            <option value="spectator">Spectator</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setActionModalType(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleExecuteGamemode}>Set Gamemode</Button>
        </div>
      </Modal>
    </div>
  );
}
