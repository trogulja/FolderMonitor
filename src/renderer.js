/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import './css/bootstrap.min.css';
import Vue from './js/vue.min.js';
import { ipcRenderer } from 'electron';

// console.log('👋 This message is being logged by "renderer.js", included via webpack');

var app = new Vue({
  el: '#app',
  data: {
    input: {
      title: 'Slanje u Claro',
      local: {
        name: 'dti export',
        value: 0,
      },
      remote: {
        name: 'claro in',
        value: 0,
      },
    },
    output: {
      title: 'Vraćanje iz Clara u DTI',
      local: {
        name: 'dti refresh',
        value: 0,
      },
      remote: {
        name: 'claro out',
        value: 0,
      },
    },
  },
  methods: {
    open: function (folder) {
      if (!folder) return false;
      ipcRenderer.send('open-folder', folder);
    },
    stopwatching: function () {
      ipcRenderer.send('stop-watcher', 'init');
    },
    startwatching: function () {
      ipcRenderer.send('start-watcher', 'init');
    },
  },
  mounted() {
    ipcRenderer.send('start-watcher', 'init');
    setInterval(() => {
      ipcRenderer.send('status-update', 'init');
    }, 15000);
  },
});

// Set listeners for data change
ipcRenderer.on('update', function (event, arg) {
  app[arg.a][arg.b].value = Number(arg.n);
});

ipcRenderer.on('update-all', function (event, arg) {
  app.input.local.value = Number(arg.il);
  app.input.remote.value = Number(arg.ir);
  app.output.local.value = Number(arg.ol);
  app.output.remote.value = Number(arg.or);
  console.log('Updated all values', arg);
});

ipcRenderer.on('status', function (event, arg) {
  // arg = { a: 'input', b: 'local', m: 'watching' }
  // arg = { a: 'output', b: 'remote', m: 'stopped' }
  console.log(arg);
});

ipcRenderer.on('info', function (event, arg) {
  // arg = string we need to display
  console.log(arg);
});

ipcRenderer.on('warning', function (event, arg) {
  console.log(arg);
});

ipcRenderer.on('error', function (event, arg) {
  console.log(arg);
});

ipcRenderer.on('critical', function (event, arg) {
  console.log(arg);
});
