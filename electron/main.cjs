const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const PORT = 3847;
const HOST = '127.0.0.1';
const APP_URL = `http://${HOST}:${PORT}`;

let serverProcess = null;

/** When launched from Finder, PATH is minimal. Find node in common macOS locations. */
function getNodePath() {
  const pathEnv = process.env.PATH || '';
  const dirs = pathEnv.split(path.delimiter).filter(Boolean);
  const common = ['/opt/homebrew/bin', '/usr/local/bin'];
  for (const dir of [...dirs, ...common]) {
    const nodePath = path.join(dir, 'node');
    if (fs.existsSync(nodePath)) return nodePath;
  }
  return 'node'; // fallback for dev (terminal has PATH)
}

function loadEnv() {
  const candidates = [
    path.join(app.getAppPath(), '.env'),
    path.join(app.getPath('userData'), '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      return;
    }
  }
}

function getAppRoot() {
  const appPath = app.getAppPath();
  if (appPath.endsWith('.asar')) {
    return path.join(appPath.replace(/\.asar$/, '.asar.unpacked'));
  }
  return appPath;
}

function getServerPath() {
  return path.join(getAppRoot(), 'build', 'index.js');
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    if (!fs.existsSync(serverPath)) {
      reject(new Error('Build not found. Run: pnpm build'));
      return;
    }
    const env = {
      ...process.env,
      PORT: String(PORT),
      HOST,
      ORIGIN: APP_URL,
    };
    const cwd = getAppRoot();
    const nodePath = getNodePath();
    serverProcess = spawn(nodePath, [serverPath], {
      env,
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    serverProcess.stdout.on('data', (d) => process.stdout.write(d));
    serverProcess.stderr.on('data', (d) => process.stderr.write(d));
    serverProcess.on('error', reject);
    serverProcess.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        reject(new Error(`Server exited ${code}`));
      }
    });
    waitForServer(resolve, reject);
  });
}

function waitForServer(resolve, reject) {
  const start = Date.now();
  const timeout = 15000;
  function tryFetch() {
    fetch(APP_URL, { method: 'HEAD' }).then(() => resolve()).catch(() => {
      if (Date.now() - start > timeout) {
        reject(new Error('Server failed to start'));
        return;
      }
      setTimeout(tryFetch, 100);
    });
  }
  setTimeout(tryFetch, 200);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Playlistify',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadURL(APP_URL);
  win.on('closed', () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}

function showErrorAndQuit(title, message) {
  dialog.showMessageBoxSync({
    type: 'error',
    title: title || 'Playlistify',
    message: message || 'Something went wrong.',
  });
  app.quit();
}

app.whenReady().then(() => {
  loadEnv();
  startServer()
    .then(createWindow)
    .catch((err) => {
      const msg = err.message || String(err);
      if (msg.includes('ENOENT') || msg.includes('spawn')) {
        showErrorAndQuit(
          'Playlistify',
          'Node.js was not found. Install Node from https://nodejs.org or Homebrew (brew install node), then try again.'
        );
      } else if (msg.includes('Build not found')) {
        showErrorAndQuit('Playlistify', msg);
      } else {
        const hint = msg.includes('exited')
          ? '\n\nCheck that .env exists in ~/Library/Application Support/Playlistify/ with DATABASE_URL, SPOTIFY_*, and SESSION_SECRET.'
          : '';
        showErrorAndQuit('Playlistify', 'Server failed to start: ' + msg + hint);
      }
    });
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
