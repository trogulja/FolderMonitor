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

// Set autoupdate functionality
require('update-electron-app')();

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

let ps;

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
    local: {
      path: path.join((app || remote.app).getPath('documents'), '_claro automatika'),
      watcher: null,
      status: 0,
    },
    remote: {
      path: path.join('\\\\10.64.8.41\\ftp_claro', 'CRO', 'IN'),
      watcher: null,
      status: 0,
    },
  },
  output: {
    local: {
      path: path.join('C:', 'LoginApp', 'Refresh News Media'),
      watcher: null,
      status: 0,
    },
    remote: {
      path: path.join('\\\\10.64.8.41\\ftp_claro', 'CRO', 'OUT', username),
      watcher: null,
      status: 0,
    },
  },
};
let timer;
let timerDuration = 10000;
let timerStartMS = 0;

function timerStart() {
  if (timerStartMS !== 0) clearTimeout(timer);
  timerStartMS = new Date().getTime();
  timer = setTimeout(() => {
    invokePS();
  }, timerDuration);
}

function timerClear() {
  if (timerStartMS === 0) return false;
  mainWindow.webContents.send('error', 'timerClear() called due to an error with PS.');
  clearTimeout(timer);
  timerStartMS = 0;
}

function invokePS() {
  ps.invoke()
    .then((output) => {
      clearTimeout(timer);
      timerStartMS = 0;
      // console.log(output);
      ['input', 'output'].forEach((el) => {
        ['local', 'remote'].forEach((el2) => {
          fs.readdir(folders[el][el2].path, (err, files) => {
            if (err) {
              console.log('This error means we should reinit the app!');
              disposeFolderWatcher();
              setTimeout(() => {
                initFolderWatcher();
              }, 2000);
              return false;
            }
            // TODO - at this point, output remote and input local should be empty!
            if (
              (el === 'input' && el2 === 'local' && files.length) ||
              (el === 'output' && el2 === 'remote' && files.length)
            ) {
              console.log('this should be 0, but it is not!');
              disposeFolderWatcher();
              setTimeout(() => {
                initFolderWatcher();
              }, 2000);
            }
            folders[el][el2].status = files.length;
            mainWindow.webContents.send('update', { a: el, b: el2, n: files.length });
          });
        });
      });
    })
    .catch((err) => {
      mainWindow.webContents.send('critical', err);
      disposeFolderWatcher();
      // TODO - pause / play option in the GUI!
    });
}

function disposeFolderWatcher() {
  timerClear();
  ps.dispose();
  ['input', 'output'].forEach((el) => {
    ['local', 'remote'].forEach((el2) => {
      folders[el][el2].watcher.close();
      console.log(el, el2, 'closed');
      mainWindow.webContents.send('status', { a: el, b: el2, m: 'stopped' });
    });
  });
}

function initFolderWatcher() {
  ps = new Shell({ verbose: true, executionPolicy: 'Bypass', noProfile: true });
  ['input', 'output'].forEach((el) => {
    ['local', 'remote'].forEach((el2) => {
      fs.access(folders[el][el2].path, fs.constants.W_OK, (err) => {
        if (err) {
          fs.mkdir(folders[el][el2].path, { recursive: false }, (err2) => {
            if (err2) {
              if (el === 'output' && el2 === 'local') {
                const newRefresh = path.join('C:', 'LoginAppNew', 'Refresh News Media');
                fs.access(newRefresh, fs.constants.W_OK, (err) => {
                  if (err) {
                    throw new Error(err);
                  } else {
                    folders[el][el2].path = newRefresh;
                    StartWatcher(newRefresh, el, el2);
                  }
                });
              } else {
                console.log(`Unable to create ${folders[el][el2].path} because of error.`, err2);
                throw new Error(err2);
              }
            } else {
              StartWatcher(folders[el][el2].path, el, el2);
            }
          });
        } else {
          StartWatcher(folders[el][el2].path, el, el2);
        }
        // TODO: display interproc communication in vue frontend
      });
    });
  });
}

function StartWatcher(folder, el, el2) {
  const options = {
    persistent: true,
    ignored: /((^|[\/\\])\..|.\.txt)/,
    ignoreInitial: false,
    usePolling: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  };
  if (el2 == 'remote') options.usePolling = true;
  // console.log(folder, options);
  folders[el][el2].watcher = fileWatcher.watch(folder, options);

  folders[el][el2].watcher
    .on('add', function (file) {
      if (el === 'input' && el2 === 'local') {
        ps.addCommand(
          `Move-Item -Path "${file}" -Destination "${path.join(
            folders.input.remote.path,
            path.basename(file)
          )}" -Force`
        );
        timerStart();
      } else if (el === 'output' && el2 === 'remote') {
        ps.addCommand(
          `Move-Item -Path "${file}" -Destination "${path.join(
            folders.output.local.path,
            path.basename(file)
          )}" -Force`
        );
        timerStart();
      }
      folders[el][el2].status += 1;
      mainWindow.webContents.send('update', { a: el, b: el2, n: folders[el][el2].status });
    })
    .on('addDir', function (file) {
      // mainWindow.webContents.send('warning', `${file} - new directory created!`);
    })
    .on('change', function (file) {
      // mainWindow.webContents.send('warning', `${path.basename(file)} changed!`);
    })
    .on('unlink', function (file) {
      folders[el][el2].status += -1;
      mainWindow.webContents.send('update', { a: el, b: el2, n: folders[el][el2].status });
    })
    .on('unlinkDir', function (file) {
      // mainWindow.webContents.send('warning', `${file} - directory deleted!`);
    })
    .on('error', function (file) {
      mainWindow.webContents.send('error', error);
    })
    .on('ready', function () {
      mainWindow.webContents.send('info', { a: el, b: el2, m: 'watching' });
    });
  // .on('raw', function (event, directory, details) {
  //   // This event should be triggered everytime something happens.
  //   // console.log('Raw event info:', event, directory, details);
  // });
}

/**
 * InterProcess Communication
 */

ipcMain.on('open-folder', function (event, arg) {
  // mainWindow.webContents.send('update', { a: 'input', b: 'local', n: 15 });
  // arg == 'input.local'
  const tp = arg.split('.');
  const target = folders[tp[0]][tp[1]].path;
  if (!target) return 'error!';
  ps.addCommand('ii "' + target + '"');
  invokePS();
});

ipcMain.on('start-watcher', function (event, arg) {
  initFolderWatcher();
});

ipcMain.on('stop-watcher', function(event, arg) {
  disposeFolderWatcher();
})