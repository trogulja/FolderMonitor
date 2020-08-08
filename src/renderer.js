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
  },
  mounted() {
    ipcRenderer.send('start-watcher', 'init');
  },
});

// Set listeners for data change
ipcRenderer.on('update', function (event, arg) {
  ['input', 'output'].forEach(el => {
    ['local', 'remote'].forEach(el2 => {
      app[el][el2].value = Number(arg[el][el2]);
    })
  })
});
