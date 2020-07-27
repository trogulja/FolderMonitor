'use strict';

const { app, remote, BrowserWindow, Menu, ipcMain } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const fs = require('fs');
const fileWatcher = require('chokidar');
const Shell = require('node-powershell');
let environment = 'production';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// Auto SET ENV - when deployed, paths change somewhat
if (process.execPath.search('electron.exe') !== -1) environment = 'development';

const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        },
      },
    ],
  },
];
if (process.platform === 'darwin') mainMenuTemplate.unshift({});
if (environment === 'development') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [{ role: 'toggledevtools' }, { role: 'reload' }],
  });
}

let mainWindow;
const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 600,
    defaultHeight: 580,
  });

  const allowResize = environment === 'development' ? true : false;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: allowResize ? mainWindowState.width : 600,
    height: allowResize ? mainWindowState.height : 580,
    minWidth: 600,
    minHeight: 580,
    resizable: allowResize,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

/**
 * File watcher logic
 */

const ps = new Shell({ verbose: true, executionPolicy: 'Bypass', noProfile: true });

// -- these are testing folders... real ones will be hardcoded
// const folders = {
//   input: {
//     local: path.join('C:', 'folderTest', 'input', 'local'),
//     remote: path.join('C:', 'folderTest', 'input', 'remote'),
//   },
//   output: {
//     local: path.join('C:', 'folderTest', 'output', 'local'),
//     remote: path.join('C:', 'folderTest', 'output', 'remote'),
//   },
// };

const username = process.env.USERNAME ? process.env.USERNAME : 'nepoznatinetko';
const folders = {
  input: {
    local: path.join((app || remote.app).getPath('documents'), '_claro automatika'),
    remote: path.join('\\\\10.64.8.41\\ftp_claro', 'CRO', 'IN'),
  },
  output: {
    local: path.join('C:', 'LoginApp', 'Refresh News Media'),
    remote: path.join('\\\\10.64.8.41\\ftp_claro', 'CRO', 'OUT', username),
  },
};
let timer;
let timerDuration = 10000;
let timerStartMS = 0;

function timerStart() {
  if (timerStartMS !== 0) clearTimeout(timer);
  timerStartMS = new Date().getTime();
  timer = setTimeout(() => {
    invokeFileCopy();
  }, timerDuration);
}

function reportTimerDuration() {
  return timerStartMS ? timerDuration - new Date().getTime() - timerStartMS : 0;
}

function timerClear() {
  if (timerStartMS === 0) return false;
  console.log('There was some error, so timerClear() was invoked.');
  clearTimeout(timer);
  timerStartMS = 0;
}

function invokeFileCopy() {
  ps.invoke()
    .then((output) => {
      console.log(output);
    })
    .catch((err) => {
      timerClear();
      console.log(err);
      ps.dispose();
    });
}

function initFolderWatcher() {
  ['input', 'output'].forEach((el) => {
    ['local', 'remote'].forEach((el2) => {
      fs.access(folders[el][el2], fs.constants.W_OK, (err) => {
        console.log(`${folders[el][el2]} ${err ? 'does not exist' : 'exists'}`);
        if (err) return;

        StartWatcher(folders[el][el2], el2);
      });
    });
  });
}

function StartWatcher(folder, type) {
  const options = {
    persistent: true,
    ignored: /((^|[\/\\])\..|\.txt)/,
    ignoreInitial: false,
    usePolling: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  };
  if (type == 'remote') options.usePolling = true;
  const watcher = fileWatcher.watch(folder, {
    persistent: true,
    ignored: /((^|[\/\\])\..|.\.txt)/,
    ignoreInitial: false,
    usePolling: true,
  });

  function onWatcherReady() {
    console.log(`Watching folder: ${folder}`);
  }

  watcher
    .on('add', function (file) {
      console.log(`${path.basename(file)} seen!`);
    })
    .on('addDir', function (file) {
      console.log(`${file} - new directory created!`);
    })
    .on('change', function (file) {
      console.log(`${path.basename(file)} changed!`);
    })
    .on('unlink', function (file) {
      console.log(`${path.basename(file)} has been deleted!`);
    })
    .on('unlinkDir', function (file) {
      console.log(`${file} - directory deleted!`);
    })
    .on('error', function (file) {
      console.log('Error happened!', error);
    })
    .on('ready', onWatcherReady);
}

initFolderWatcher();

/**
 * InterProcess Communication
 */

ipcMain.on('open-folder', function (event, arg) {
  // mainWindow.webContents.send('update', { a: 'input', b: 'local', n: 15 });
  // arg == 'input.local'
  const tp = arg.split('.');
  const target = folders[tp[0]][tp[1]];
  if (!target) return 'error!';
  ps.addCommand('ii "' + target + '"');
  ps.invoke()
    .then((output) => {
      if (timerStartMS !== 0) {
        console.log(`PS invoke forced ${reportTimerDuration()} ms before regular cycle.`);
        timerStartMS = 0;
      } else {
        console.log(`PS invoke called manually (no file copy in queue)`);
      }
      console.log(output);
    })
    .catch((err) => {
      timerClear();
      console.log(err);
      ps.dispose();
    });
  console.log(arg);
});
