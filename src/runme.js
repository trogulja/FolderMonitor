const FolderMonitor = require('./folderMonitor');

FolderMonitor.start()

FolderMonitor.events.on('report', function(report) {
  console.log('I received a report from FolderMonitor!')
  console.log(report)
})