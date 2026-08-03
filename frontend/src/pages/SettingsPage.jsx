import { useState, useEffect, useCallback } from 'react';
import { 
  Sliders, 
  Save, 
  Check, 
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { getServerSettings, saveServerSettings } from '../services/api';
import { Button } from '../components/common/Button';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'raw' | 'allowlist' | 'permissions'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [properties, setProperties] = useState({});
  const [rawProperties, setRawProperties] = useState('');
  const [allowlist, setAllowlist] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // New item inputs
  const [newAllowlistName, setNewAllowlistName] = useState('');
  const [newPermissionXuid, setNewPermissionXuid] = useState('');
  const [newPermissionRole, setNewPermissionRole] = useState('operator');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getServerSettings();
      if (res.success && res.settings) {
        setProperties(res.settings.properties || {});
        setRawProperties(res.settings.rawProperties || '');
        setAllowlist(res.settings.allowlist || []);
        setPermissions(res.settings.permissions || []);
      }
    } catch (e) {
      alert(`Error loading settings: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    getServerSettings()
      .then(res => {
        if (isSubscribed && res.success && res.settings) {
          setProperties(res.settings.properties || {});
          setRawProperties(res.settings.rawProperties || '');
          setAllowlist(res.settings.allowlist || []);
          setPermissions(res.settings.permissions || []);
        }
      })
      .catch(e => {
        if (isSubscribed) alert(`Error loading settings: ${e.message}`);
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => { isSubscribed = false; };
  }, []);

  const handlePropertyChange = (key, val) => {
    setProperties(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        properties: activeTab === 'raw' ? undefined : properties,
        rawProperties: activeTab === 'raw' ? rawProperties : undefined,
        allowlist,
        permissions
      };
      await saveServerSettings(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      loadSettings();
    } catch (e) {
      alert(`Error saving settings: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllowlist = () => {
    if (!newAllowlistName.trim()) return;
    const item = {
      name: newAllowlistName.trim(),
      xuid: String(Date.now()),
      ignoresPlayerLimit: false
    };
    setAllowlist(prev => [...prev, item]);
    setNewAllowlistName('');
  };

  const handleRemoveAllowlist = (index) => {
    setAllowlist(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPermission = () => {
    if (!newPermissionXuid.trim()) return;
    const item = {
      xuid: newPermissionXuid.trim(),
      permission: newPermissionRole
    };
    setPermissions(prev => [...prev, item]);
    setNewPermissionXuid('');
  };

  const handleRemovePermission = (index) => {
    setPermissions(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading server settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Server Properties & Config</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit Bedrock server configurations, allowlist, and operator permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Check className="w-4 h-4" />
              Settings Saved
            </span>
          )}

          <Button variant="secondary" size="sm" onClick={loadSettings} icon={RefreshCw}>
            Reload
          </Button>

          <Button variant="primary" size="md" onClick={handleSaveAll} disabled={saving} icon={Save}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'properties' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Visual Properties Editor
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'raw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Raw server.properties
        </button>
        <button
          onClick={() => setActiveTab('allowlist')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'allowlist' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Allowlist (allowlist.json)
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Permissions (permissions.json)
        </button>
      </div>

      {/* Tab Contents */}
      {/* 1. Visual Properties Editor */}
      {activeTab === 'properties' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Server Name (level-name / server-name)
              </label>
              <input
                type="text"
                value={properties['server-name'] || ''}
                onChange={(e) => handlePropertyChange('server-name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Gamemode
              </label>
              <select
                value={properties['gamemode'] || 'survival'}
                onChange={(e) => handlePropertyChange('gamemode', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <select
                value={properties['difficulty'] || 'easy'}
                onChange={(e) => handlePropertyChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="peaceful">Peaceful</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Max Players
              </label>
              <input
                type="number"
                value={properties['max-players'] || '10'}
                onChange={(e) => handlePropertyChange('max-players', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Allow Cheats
              </label>
              <select
                value={properties['allow-cheats'] || 'true'}
                onChange={(e) => handlePropertyChange('allow-cheats', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="true">True (Commands Enabled)</option>
                <option value="false">False (Commands Disabled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                View Distance (Chunks)
              </label>
              <input
                type="number"
                value={properties['view-distance'] || '32'}
                onChange={(e) => handlePropertyChange('view-distance', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                IPv4 Port
              </label>
              <input
                type="text"
                value={properties['server-port'] || '19132'}
                onChange={(e) => handlePropertyChange('server-port', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Online Mode
              </label>
              <select
                value={properties['online-mode'] || 'true'}
                onChange={(e) => handlePropertyChange('online-mode', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="true">True (Xbox Live Auth)</option>
                <option value="false">False (Offline Mode)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. Raw Editor */}
      {activeTab === 'raw' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <textarea
            value={rawProperties}
            onChange={(e) => setRawProperties(e.target.value)}
            rows={20}
            className="w-full p-4 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 selection:bg-blue-600/40 leading-relaxed"
          />
        </div>
      )}

      {/* 3. Allowlist */}
      {activeTab === 'allowlist' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Gamertag..."
              value={newAllowlistName}
              onChange={(e) => setNewAllowlistName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <Button variant="primary" onClick={handleAddAllowlist} icon={Plus}>Add Player</Button>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            {allowlist.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold text-slate-200">{item.name}</div>
                  <div className="text-xs text-slate-500 font-mono">XUID: {item.xuid || 'N/A'}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveAllowlist(idx)} icon={Trash2}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Permissions */}
      {activeTab === 'permissions' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Enter XUID / Player..."
              value={newPermissionXuid}
              onChange={(e) => setNewPermissionXuid(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newPermissionRole}
              onChange={(e) => setNewPermissionRole(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
            >
              <option value="operator">Operator</option>
              <option value="member">Member</option>
              <option value="visitor">Visitor</option>
            </select>
            <Button variant="primary" onClick={handleAddPermission} icon={Plus}>Add Role</Button>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            {permissions.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold text-slate-200 font-mono">{item.xuid}</div>
                  <div className="text-xs text-blue-400 capitalize">Role: {item.permission}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemovePermission(idx)} icon={Trash2}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
