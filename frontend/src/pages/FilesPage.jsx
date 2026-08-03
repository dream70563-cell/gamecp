import { useState, useEffect, useCallback } from 'react';
import { 
  FolderTree, 
  Folder, 
  FileCode, 
  Trash2, 
  Edit, 
  FolderPlus, 
  RefreshCw,
  Save,
  ArrowLeft
} from 'lucide-react';
import { getFileList, readFileContent, saveFileContent, deleteFileItem, createFolderItem } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export function FilesPage() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editor modal state
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);

  // Create folder/file state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFiles = useCallback(async (path = currentPath) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFileList(path);
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    let isSubscribed = true;
    getFileList(currentPath)
      .then(res => {
        if (isSubscribed && res.success) {
          setFiles(res.files || []);
          setError(null);
        }
      })
      .catch(e => {
        if (isSubscribed) setError(e.message);
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => { isSubscribed = false; };
  }, [currentPath]);

  const handleOpenFile = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      return;
    }

    try {
      const res = await readFileContent(file.path);
      if (res.success) {
        setEditingFile(file.path);
        setFileContent(res.content);
      }
    } catch (e) {
      alert(`Error reading file: ${e.message}`);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSavingFile(true);
    try {
      await saveFileContent(editingFile, fileContent);
      alert('File saved successfully!');
      setEditingFile(null);
      loadFiles();
    } catch (e) {
      alert(`Error saving file: ${e.message}`);
    } finally {
      setSavingFile(false);
    }
  };

  const handleDeleteItem = async (path) => {
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      await deleteFileItem(path);
      loadFiles();
    } catch (e) {
      alert(`Error deleting item: ${e.message}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
    try {
      await createFolderItem(folderPath);
      setIsFolderModalOpen(false);
      setNewFolderName('');
      loadFiles();
    } catch (e) {
      alert(`Error creating folder: ${e.message}`);
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">File Manager</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              /root/bedrock-1.26.33.2{currentPath ? `/${currentPath}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentPath && (
            <Button variant="secondary" size="sm" onClick={handleNavigateUp} icon={ArrowLeft}>
              Back
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={() => loadFiles()} icon={RefreshCw}>
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={() => setIsFolderModalOpen(true)} icon={FolderPlus}>
            New Folder
          </Button>
        </div>
      </div>

      {/* File Explorer Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span className="w-1/2">Name</span>
          <span className="w-1/4">Size</span>
          <span className="w-1/4 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading directory items...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400 text-sm">Error: {error}</div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm italic">Directory is empty.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {files.map((file) => (
              <div
                key={file.name}
                className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-800/40 transition-colors"
              >
                {/* File Icon & Name */}
                <div 
                  className="w-1/2 flex items-center gap-3 cursor-pointer group"
                  onClick={() => handleOpenFile(file)}
                >
                  {file.isDirectory ? (
                    <Folder className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <FileCode className="w-5 h-5 text-blue-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                    {file.name}
                  </span>
                </div>

                {/* Size */}
                <div className="w-1/4 font-mono text-xs text-slate-400">
                  {file.isDirectory ? 'Directory' : `${(file.size / 1024).toFixed(1)} KB`}
                </div>

                {/* Actions */}
                <div className="w-1/4 flex items-center justify-end gap-2">
                  {!file.isDirectory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenFile(file)}
                      icon={Edit}
                    >
                      Edit
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(file.path)}
                    icon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor Modal */}
      <Modal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title={`Editing: ${editingFile}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            rows={20}
            className="w-full p-4 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 selection:bg-blue-600/40 leading-relaxed"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditingFile(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveFile} disabled={savingFile} icon={Save}>
              Save File
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Folder Name
          </label>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g. resource_packs"
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateFolder}>Create Folder</Button>
        </div>
      </Modal>
    </div>
  );
}
