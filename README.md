# FolderMonitor v1.0.4

Electron app that automates asset roundtrip between two systems (DTI and Claro) and their hotfolders. Tailor made for Obrada Fotografija department in Styria Hrvatska (hardcoded folder paths).

# Instructions
- README in [Croatian](./README.hr.md)

# Caveats

## Diacritics caused powershell failures
Powershell by default uses codepage 852 - that is visible via `chcp` command in powershell. Chokidar and all other javascript uses utf-8. That causes problems when some special characters (diacritics) appear in path or filenames. Way to go around it is to make powershell use codepage 65001 (that's utf-8) - via command `chcp 65001`. More on the issue over on [superuser.com](https://superuser.com/questions/269818/change-default-code-page-of-windows-console-to-utf-8).

Because of the way node-powershell works, in order to set codepage on the fly and use it, only way I found was to set it in the $profile:
1. read $profile and check for 'chcp 65001'
2. if it's not there, add `chcp 65001 >$null` to $profile
3. restart powershell for changes to take effect