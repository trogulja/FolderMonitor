module.exports = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: ['win32'],
      config: {
        repository: {
          owner: 'trogulja',
          name: 'FolderMonitor'
        },
        prerelease: false
      }
    }
  ]
}