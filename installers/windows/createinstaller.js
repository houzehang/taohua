const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
     console.error(error.message || error)
     process.exit(1)
 })

function getInstallerConfig () {
    console.log('creating windows installer')
	var __dir = path.join(__dirname, "../../");
    return Promise.resolve({
       appDirectory: path.resolve(__dir, 'wechathelper-win32-x64'),
       authors: 'owen wang',
       noMsi: true,
       outputDirectory: path.resolve(__dir, 'windows-installer'),
       exe: 'wechathelper.exe',
       setupExe: 'wechathelper.exe',
       setupIcon: path.resolve(__dir, 'dist/win-icon.ico')
   })
}