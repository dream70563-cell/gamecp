// REST API Service for GameCP Backend
// The backend is the single source of truth. Do NOT mutate or alias JSON response fields.

const API_BASE = '/api';

async function fetchJSON(endpoint, options = {}) {
  const url = endpoint.startsWith(API_BASE) ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function getServerHealth() {
  return fetchJSON('/status');
}

export async function getConsoleLogs() {
  return fetchJSON('/console');
}

export async function sendServerPower(action) {
  // action: 'start' | 'stop' | 'restart'
  if (action === 'start') return fetchJSON('/start', { method: 'POST' });
  if (action === 'stop') return fetchJSON('/stop', { method: 'POST' });
  if (action === 'restart') return fetchJSON('/restart', { method: 'POST' });
  return fetchJSON('/action', { method: 'POST', body: JSON.stringify({ action }) });
}

export async function sendServerCommand(command) {
  return fetchJSON('/command', {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
}

export async function sendServerAction(action, extraData = {}) {
  return fetchJSON('/action', {
    method: 'POST',
    body: JSON.stringify({ action, ...extraData }),
  });
}

// File Explorer APIs
export async function getFileList(path = '') {
  return fetchJSON(`/files?path=${encodeURIComponent(path)}`);
}

export async function readFileContent(path) {
  return fetchJSON(`/files/read?path=${encodeURIComponent(path)}`);
}

export async function saveFileContent(path, content) {
  return fetchJSON('/files/save', {
    method: 'POST',
    body: JSON.stringify({ path, content }),
  });
}

export async function deleteFileItem(path) {
  return fetchJSON('/files/delete', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export async function renameFileItem(oldPath, newPath) {
  return fetchJSON('/files/rename', {
    method: 'POST',
    body: JSON.stringify({ oldPath, newPath }),
  });
}

export async function createFolderItem(path) {
  return fetchJSON('/files/folder', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

// Settings APIs
// Worlds APIs
// Worlds APIs
export async function getWorlds() {
  return fetchJSON("/worlds");
}

export async function activateWorld(world) {
  return fetchJSON("/worlds/activate", {
    method: "POST",
    body: JSON.stringify({ world }),
  });
}
export async function getServerSettings() {
  return fetchJSON('/settings');
}

export async function saveServerSettings(payload) {
  return fetchJSON('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function importWorld(file) {
  const formData = new FormData();
  formData.append('world', file);

  const res = await fetch('/api/worlds/import', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export async function importAddon(file) {
  const formData = new FormData();
  formData.append('addon', file);

  const res = await fetch('/api/addons/import', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export async function getAddons() {
  return fetchJSON('/addons');
}

export async function deleteAddon(uuid, type) {
  return fetchJSON('/addons/delete', {
    method: 'POST',
    body: JSON.stringify({ uuid, type }),
  });
}


export async function deleteWorld(world) {
  const response = await fetch(
    `/api/worlds/${encodeURIComponent(world)}`,
    {
      method: 'DELETE'
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Failed to delete world');
  }

  return data;
}
