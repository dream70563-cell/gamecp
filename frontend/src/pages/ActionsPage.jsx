import { useState } from 'react';
import { 
  Save, 
  RotateCw, 
  Archive, 
  Download, 
  CheckCircle2, 
  Clock, 
  HardDrive
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { sendServerAction } from '../services/api';

export function ActionsPage() {
  const [backups, setBackups] = useState([
    { filename: 'backup-Dream70563_Server-2026-08-01.tar.gz', sizeMB: '42.5', createdAt: '2026-08-01 01:15:00' }
  ]);
  const [creating, setCreating] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleTriggerSaveHold = async () => {
    try {
      await sendServerAction('save-hold');
      setLastAction('World files locked (save hold)');
      setTimeout(() => setLastAction(null), 3000);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleTriggerSaveResume = async () => {
    try {
      await sendServerAction('save-resume');
      setLastAction('World save resumed');
      setTimeout(() => setLastAction(null), 3000);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await sendServerAction('backup');
      if (res.success && res.backup) {
        setBackups(prev => [
          {
            filename: res.backup.filename,
            sizeMB: res.backup.sizeMB,
            createdAt: new Date().toLocaleString()
          },
          ...prev
        ]);
        setLastAction(`Created backup ${res.backup.filename}`);
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Save className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">World Saves & Backups</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute world save holds, release locks, and create backup archives.
            </p>
          </div>
        </div>

        {lastAction && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            {lastAction}
          </div>
        )}
      </div>

      {/* Save Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Save Hold</h3>
            <p className="text-xs text-slate-400 mt-1">
              Locks level files and prepares world data for consistent backup copying.
            </p>
          </div>
          <Button variant="secondary" className="mt-4" onClick={handleTriggerSaveHold} icon={Save}>
            Execute Save Hold
          </Button>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Save Resume</h3>
            <p className="text-xs text-slate-400 mt-1">
              Releases file hold locks and resumes normal world writing operations.
            </p>
          </div>
          <Button variant="secondary" className="mt-4" onClick={handleTriggerSaveResume} icon={RotateCw}>
            Execute Save Resume
          </Button>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Create Backup</h3>
            <p className="text-xs text-slate-400 mt-1">
              Automates save hold, generates tar archive, and resumes save immediately.
            </p>
          </div>
          <Button variant="primary" className="mt-4" onClick={handleCreateBackup} disabled={creating} icon={Archive}>
            {creating ? 'Creating...' : 'Create Snapshot'}
          </Button>
        </div>
      </div>

      {/* Existing Backups List */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Archive className="w-4 h-4 text-emerald-400" />
          Backup Snapshots
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          {backups.map((item, idx) => (
            <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 font-mono text-xs">{item.filename}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{item.createdAt}</span>
                    <span>•</span>
                    <span>{item.sizeMB} MB</span>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="sm" icon={Download}>
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
