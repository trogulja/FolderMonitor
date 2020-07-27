'use strict';

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const fs = require('fs');
const fileWatcher = require('chokidar');
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

ipcMain.on('open-folder', function (event, arg) {
  mainWindow.webContents.send('update', { a: 'input', b: 'local', n: 15 });
  console.log(arg);
});

/**
 * File watcher logic
 */

const folders = {
  input: {
    local: path.join('C:', 'folderTest', 'input', 'local'),
    remote: path.join('C:', 'folderTest', 'input', 'remote'),
  },
  output: {
    local: path.join('C:', 'folderTest', 'output', 'local'),
    remote: path.join('C:', 'folderTest', 'output', 'remote'),
  },
};

function initFolderWatcher() {
  ['input', 'output'].forEach((el) => {
    // fs.access
  });
}

function StartWatcher() {
  const watcher = fileWatcher.watch(directory, { ignored: /(^|[\/\\])\../, persistent: true });
  
}
