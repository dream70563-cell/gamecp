import { useEffect, useState } from 'react';

import {
  Globe,
  HardDrive,
  FolderOpen,
  Upload,
  Download,
  Package,
  Trash2,
  RefreshCw
} from 'lucide-react';

import { Button } from '../components/common/Button';

import {
  getWorlds,
  activateWorld,
  importWorld,
  importAddon,
  getAddons,
  deleteAddon,
  deleteWorld
} from '../services/api';


export function WorldsPage() {

  const [worlds, setWorlds] = useState([]);
  const [addons, setAddons] = useState([]);

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [addonUploading, setAddonUploading] = useState(false);
  const [addonMessage, setAddonMessage] = useState('');
  const [deletingAddon, setDeletingAddon] = useState(null);
  const [deletingWorld, setDeletingWorld] = useState(null);
  const [worldMessage, setWorldMessage] = useState('');


  async function loadWorlds() {
    setLoading(true);

    try {
      const result = await getWorlds();
      setWorlds(result.worlds || []);
    } catch (err) {
      console.error('LOAD WORLDS ERROR:', err);
    } finally {
      setLoading(false);
    }
  }


  async function loadAddons() {
    try {
      const result = await getAddons();
      setAddons(result.addons || []);
    } catch (err) {
      console.error('LOAD ADDONS ERROR:', err);
    }
  }


  async function refreshAll() {
    await Promise.all([
      loadWorlds(),
      loadAddons()
    ]);
  }


  async function handleActivate(world) {
    setActivating(world);

    try {
      await activateWorld(world);

      await new Promise(resolve =>
        setTimeout(resolve, 3000)
      );

      await refreshAll();

    } catch (err) {
      console.error('ACTIVATE WORLD ERROR:', err);
    } finally {
      setActivating(null);
    }
  }


  async function handleDeleteWorld(world) {
    if (
      !window.confirm(
        `Delete world "${world}" permanently? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingWorld(world);
    setWorldMessage('');

    try {
      await deleteWorld(world);

      setWorldMessage(
        `World "${world}" deleted successfully.`
      );

      await loadWorlds();

    } catch (err) {
      setWorldMessage(
        `Delete failed: ${err.message}`
      );
    } finally {
      setDeletingWorld(null);
    }
  }


  async function handleWorldUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setUploadMessage(`Uploading ${file.name}...`);

    try {
      const result = await importWorld(file);

      setUploadMessage(
        `World "${result.world}" imported successfully.`
      );

      await loadWorlds();

    } catch (err) {
      setUploadMessage(
        `Import failed: ${err.message}`
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }


  async function handleAddonUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setAddonUploading(true);
    setAddonMessage(`Importing ${file.name}...`);

    try {
      const result = await importAddon(file);

      const names = (result.installed || [])
        .map(pack => `${pack.name} (${pack.type})`)
        .join(', ');

      setAddonMessage(
        names
          ? `Addon installed: ${names}`
          : 'Addon installed successfully.'
      );

      await loadAddons();

    } catch (err) {
      setAddonMessage(
        `Import failed: ${err.message}`
      );
    } finally {
      setAddonUploading(false);
      event.target.value = '';
    }
  }


  async function handleDeleteAddon(addon) {
    if (
      !window.confirm(
        `Delete addon "${addon.name}" from active world?`
      )
    ) {
      return;
    }

    setDeletingAddon(addon.uuid);

    try {
      await deleteAddon(
        addon.uuid,
        addon.type
      );

      setAddonMessage(
        `Addon "${addon.name}" deleted successfully.`
      );

      await loadAddons();

    } catch (err) {
      setAddonMessage(
        `Delete failed: ${err.message}`
      );
    } finally {
      setDeletingAddon(null);
    }
  }


  useEffect(() => {
    refreshAll();
  }, []);


  const activeWorld =
    worlds.find(world => world.active)?.name;


  return (
    <div className="space-y-6">

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Globe className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Minecraft Worlds
              </h2>

              <p className="text-sm text-slate-400">
                Manage worlds, exports and addons.
              </p>
            </div>

          </div>


          <Button
            variant="primary"
            onClick={refreshAll}
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />

              {loading ? 'Loading...' : 'Refresh'}
            </span>
          </Button>

        </div>


        {/* ACTION CARDS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <HardDrive className="mb-3 h-6 w-6 text-emerald-400" />

            <h3 className="font-semibold text-slate-100">
              Active World
            </h3>

            <p className="mt-2 truncate text-sm text-slate-400">
              {activeWorld || 'No active world'}
            </p>
          </div>


          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
            <FolderOpen className="mb-3 h-6 w-6 text-blue-400" />

            <h3 className="font-semibold text-slate-100">
              Worlds
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {worlds.length} worlds loaded.
            </p>
          </div>


          <label className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-amber-500/50">

            <Upload className="mb-3 h-6 w-6 text-amber-400" />

            <h3 className="font-semibold text-slate-100">
              {uploading
                ? 'Uploading...'
                : 'Import World'}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              .mcworld or .zip
            </p>

            <input
              type="file"
              accept=".mcworld,.zip"
              className="hidden"
              disabled={uploading}
              onChange={handleWorldUpload}
            />

          </label>


          <a
            href="/api/backups/download"
            className="block rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-purple-500/50"
          >
            <Download className="mb-3 h-6 w-6 text-purple-400" />

            <h3 className="font-semibold text-slate-100">
              Export World
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Download .mcworld
            </p>
          </a>


          <label className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-cyan-500/50">

            <Package className="mb-3 h-6 w-6 text-cyan-400" />

            <h3 className="font-semibold text-slate-100">
              {addonUploading
                ? 'Importing...'
                : 'Import Addon'}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              .mcpack or .mcaddon
            </p>

            <input
              type="file"
              accept=".mcpack,.mcaddon,.zip"
              className="hidden"
              disabled={addonUploading}
              onChange={handleAddonUpload}
            />

          </label>

        </div>


        {/* MESSAGES */}

        {uploadMessage && (
          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            {uploadMessage}
          </div>
        )}

        {worldMessage && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            {worldMessage}
          </div>
        )}

        {addonMessage && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            {addonMessage}
          </div>
        )}


        {/* INSTALLED ADDONS */}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-slate-100">
                Installed Addons
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Addons attached to {activeWorld || 'active world'}
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {addons.length}
            </span>

          </div>


          {addons.length === 0 ? (

            <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center">
              <Package className="mx-auto mb-2 h-6 w-6 text-slate-600" />

              <p className="text-sm text-slate-400">
                No addons installed on active world.
              </p>
            </div>

          ) : (

            <div className="space-y-3">

              {addons.map(addon => (

                <div
                  key={`${addon.type}-${addon.uuid}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 p-4"
                >

                  <div className="min-w-0">

                    <p className="truncate font-medium text-slate-100">
                      {addon.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {addon.type === 'resource'
                        ? 'Resource Pack'
                        : 'Behavior Pack'}
                      {' • '}
                      v{Array.isArray(addon.version)
                        ? addon.version.join('.')
                        : addon.version}
                    </p>

                  </div>


                  <button
                    type="button"
                    disabled={
                      deletingAddon === addon.uuid
                    }
                    onClick={() =>
                      handleDeleteAddon(addon)
                    }
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />

                    {deletingAddon === addon.uuid
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* AVAILABLE WORLDS */}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

          <div className="mb-4 flex items-center justify-between">

            <h3 className="font-semibold text-slate-100">
              Available Worlds
            </h3>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {worlds.length}
            </span>

          </div>


          {worlds.length === 0 ? (

            <p className="text-sm text-slate-400">
              No worlds found.
            </p>

          ) : (

            <div className="space-y-3">

              {worlds.map(world => (

                <div
                  key={world.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 p-4"
                >

                  <div className="min-w-0">

                    <p className="truncate font-medium text-slate-100">
                      {world.name}
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        world.active
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {world.active
                        ? 'Active'
                        : 'Inactive'}
                    </p>

                  </div>


                  {!world.active && (

                    <div className="flex shrink-0 items-center gap-2">

                      <Button
                        variant="primary"
                        disabled={
                          activating === world.name ||
                          deletingWorld === world.name
                        }
                        onClick={() =>
                          handleActivate(world.name)
                        }
                      >
                        {activating === world.name
                          ? 'Activating...'
                          : 'Activate'}
                      </Button>

                      <button
                        type="button"
                        disabled={
                          deletingWorld === world.name ||
                          activating === world.name
                        }
                        onClick={() =>
                          handleDeleteWorld(world.name)
                        }
                        className="flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />

                        {deletingWorld === world.name
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
