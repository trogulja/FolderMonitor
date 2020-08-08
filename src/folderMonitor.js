const path = require('path');
const fs = require('fs');
const Shell = require('node-powershell');
const watcher = require('chokidar');
const { debounce, set } = require('lodash');
const { EventEmitter } = require('events');
let ps, ps2;

// folder checker
let localTest = path.join(process.env.TEMP || process.env.TMP, 'test_folders');
let ftpClaro = '\\\\10.64.8.41\\ftp_claro';
let loginAppOld = path.join('C:', 'LoginApp');
let loginAppNew = path.join('C:', 'LoginAppNew');
let loginApp = fs.existsSync(loginAppOld)
  ? loginAppOld
  : fs.existsSync(loginAppNew)
  ? loginAppNew
  : false;

let testMode = true;

if (loginApp) if (fs.existsSync(ftpClaro)) testMode = false;

class FolderMonitor {
  static folders = {
    input: {
      local: {
        path: testMode
          ? path.join(localTest, 'input_local')
          : path.join(process.env.USERPROFILE, 'Documents', '_claro automatika'),
        watcher: null,
        watching: false,
        files: new Set(),
      },
      remote: {
        path: testMode
          ? path.join(localTest, 'input_remote')
          : path.join('\\\\10.64.8.41\\ftp_claro', 'CRO', 'IN'),
        watcher: null,
        watching: false,
        files: new Set(),
      },
    },
    output: {
      local: {
        path: testMode
          ? path.join(localTest, 'output_local')
          : path.join(loginApp, 'Refresh News Media'),
        watcher: null,
        watching: false,
        files: new Set(),
      },
      remote: {
        path: testMode
          ? path.join(localTest, 'output_remote')
          : path.join(
              '\\\\10.64.8.41\\ftp_claro',
              'CRO',
              'OUT',
              process.env.USERNAME ? process.env.USERNAME : 'nepoznatinetko'
            ),
        watcher: null,
        watching: false,
        files: new Set(),
      },
    },
  };

  static meta = {
    busyPS: true,
    optionsPS: {
      verbose: true,
      executionPolicy: 'Bypass',
      noProfile: false,
    },
  };

  static start() {
    this.preInitPS();
    ['input', 'output'].forEach((el) => {
      ['local', 'remote'].forEach((el2) => {
        fs.access(this.folders[el][el2].path, fs.constants.W_OK, (err) => {
          if (err) {
            fs.mkdir(this.folders[el][el2].path, { recursive: true }, (err2) => {
              if (err2) {
                // no idea what's wrong here - some weird edge case
                throw new Error(err2);
              } else {
                // we had to create a new directory before starting watcher
                this.startWatcher(this.folders[el][el2].path, el, el2);
              }
            });
          } else {
            // directory already exists, we can start watching
            this.startWatcher(this.folders[el][el2].path, el, el2);
          }
        });
      });
    });
  }

  static stop() {
    try {
      this.timerClear();
      ps.dispose();
      [('input', 'output')].forEach((el) => {
        ['local', 'remote'].forEach((el2) => {
          this.folders[el][el2].watcher.close();
        });
      });
      return false;
    } catch (error) {
      return error;
    }
  }

  static preInitPS() {
    ps = new Shell(FolderMonitor.meta.optionsPS);
    ps.addCommand(
      'Get-Content $profile | ForEach-Object { if ($_ -match "chcp 65001") { Write-Host "fixed" } }'
    ); // UTF-8 HAX!
    ps.invoke()
      .then((output) => {
        if (/fixed/.test(output)) {
          // UTF-8 is active, we don't need to call init
          FolderMonitor.meta.busyPS = false;
          debouncedReport();
        } else {
          ps.addCommand("Add-Content $profile ''");
          ps.addCommand("Add-Content $profile 'chcp 65001 >$null'");
          ps.invoke()
            .then((output) => {
              // This should be fixed now, restart PS and init
              ps.dispose()
                .then(() => {
                  FolderMonitor.initPS();
                })
                .catch((error) => {
                  // dispose should not fail
                  throw new Error(error);
                });
            })
            .catch((error) => {
              // 2nd invoke should not fail (possibly we can't write to $profile)
              throw new Error(error);
            });
        }
      })
      .catch((error) => {
        // 1st invoke should not fail (possibly we can't read our $profile)
        throw new Error(error);
      });
  }

  static initPS() {
    ps = new Shell(FolderMonitor.meta.optionsPS);
    FolderMonitor.meta.busyPS = false;
    debouncedReport();
  }

  static processPSlocal() {
    if (FolderMonitor.meta.busyPS) return false;

    let limit = 10;
    FolderMonitor.folders.input.local.files.forEach((file) => {
      if (limit > 0) {
        ps.addCommand(
          `Move-Item -Path "${file}" -Destination "${path.join(
            FolderMonitor.folders.input.remote.path,
            path.basename(file)
          )}" -Force`
        );
        limit--;
      }
    });

    if (FolderMonitor.folders.input.local.files.size) FolderMonitor.invokePS();
  }

  static processPSremote() {
    if (FolderMonitor.meta.busyPS) return false;

    let limit = 10;
    FolderMonitor.folders.output.remote.files.forEach((file) => {
      if (limit > 0) {
        ps.addCommand(
          `Move-Item -Path "${file}" -Destination "${path.join(
            FolderMonitor.folders.output.local.path,
            path.basename(file)
          )}" -Force`
        );
        limit--;
      }
    });

    if (FolderMonitor.folders.output.remote.files.size) FolderMonitor.invokePS();
  }

  static invokePS() {
    FolderMonitor.meta.busyPS = true;
    ps.invoke()
      .then((output) => {
        FolderMonitor.meta.busyPS = false;
        console.log(output);
        debouncedReport();
      })
      .catch((err) => {
        FolderMonitor.meta.busyPS = false;
        console.log('Error occured while invoking PS!');
        console.log(err);
        debouncedReport();
      });
  }

  static startWatcher(folder, el, el2) {
    const options = {
      persistent: true,
      ignoreInitial: false,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 500,
      },
    };
    if (el2 === 'remote') options.usePolling = true;

    try {
      this.folders[el][el2].watcher = watcher.watch(folder, options);
    } catch (error) {
      console.log('we got an error!');
      console.log(error);
    }
    this.folders[el][el2].watcher
      .on('add', function (file) {
        // Will add files before ready
        // console.log('add', file);
        FolderMonitor.addFile({ el, el2, file });
      })
      .on('addDir', function (file) {
        if (FolderMonitor.folders[el][el2].watching) {
          console.log('addDir event');
          console.log(file);
        }
      })
      .on('change', function (file) {
        if (FolderMonitor.folders[el][el2].watching) {
          console.log('change event');
          console.log(el, el2, path.basename(file));
        }
      })
      .on('unlink', function (file) {
        console.log('unlink', file);
        if (FolderMonitor.folders[el][el2].watching) FolderMonitor.delFile({ el, el2, file });
      })
      .on('unlinkDir', function (file) {
        if (FolderMonitor.folders[el][el2].watching) {
          console.log('unlinkDir event');
          console.log(file);
        }
      })
      .on('error', function (file) {
        console.log('error event');
        console.log(file);
      })
      .on('ready', function () {
        FolderMonitor.folders[el][el2].watching = true;
      });
  }

  static addFile({ el, el2, file }) {
    this.folders[el][el2].files.add(file);
    debouncedReport();
    if (el === 'input' && el2 === 'local') debouncedLocal();
    if (el === 'output' && el2 === 'remote') debouncedRemote();
  }

  static delFile({ el, el2, file }) {
    this.folders[el][el2].files.delete(file);
    debouncedReport();
  }

  static openFolder({ el, el2 }) {
    if (FolderMonitor.meta.busyPS) return false;

    ps.addCommand(`ii "${FolderMonitor.folders[el][el2].path}"`);
    FolderMonitor.invokePS();
  }

  static reportFiles() {
    let report = {};
    ['input', 'output'].forEach((el) => {
      ['local', 'remote'].forEach((el2) => {
        set(report, `${el}.${el2}`, FolderMonitor.folders[el][el2].files.size);
      });
    });
    if (report.input.local) debouncedLocal();
    if (report.output.remote) debouncedRemote();
    FolderMonitor.events.emit('report', report);
    console.log(report);
  }

  static events = new EventEmitter();
}

// debounce reports
const debouncedReport = debounce(FolderMonitor.reportFiles, 2500);
const debouncedLocal = debounce(FolderMonitor.processPSlocal, 3000);
const debouncedRemote = debounce(FolderMonitor.processPSremote, 3000);

module.exports = FolderMonitor;