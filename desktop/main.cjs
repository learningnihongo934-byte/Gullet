// Gullet desktop shell: serves web/ over an app:// scheme so ES modules and saves work offline.
// Co-op rooms still go through https://gullet.rennko.tech (see web/js/net.js).
const { app, BrowserWindow, protocol, net, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const WEB = path.join(__dirname, '..', 'web');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 640, minHeight: 400, fullscreen: !process.env.GULLET_SMOKE,
    backgroundColor: '#120408', title: 'Gullet', autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true },
  });
  win.once('ready-to-show', () => { if (!process.env.GULLET_SMOKE) win.show(); });
  // F11 toggles fullscreen on every platform (Esc is the game's pause key)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadURL('app://gullet/index.html');
  // GULLET_SMOKE=1: load hidden, check the game booted and the co-op server answers, print the result, quit.
  if (process.env.GULLET_SMOKE) {
    win.webContents.once('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, 1500));
      const out = await win.webContents.executeJavaScript(`(async () => { const r = await fetch('https://gullet.rennko.tech/api/room', { method: 'POST' }).then(r => r.json()).catch(e => ({ error: String(e) })); window.GULLET.startSolo(null, true); window.GULLET.step(120, { mx: 1, ax: 1 }); const g = window.GULLET.game; return JSON.stringify({ title: document.title, menu: [...document.querySelectorAll('#title .menu button i')].length, floor: g.fi, endless: g.endless, room: !!g.room, coopRoom: r.code || r.error }); })()`).catch(e => 'ERROR ' + e);
      console.log('GULLET_SMOKE', out);
      app.exit(0);
    });
  }
}

app.whenReady().then(() => {
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  protocol.handle('app', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(WEB, rel));
    if (!file.startsWith(WEB)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
