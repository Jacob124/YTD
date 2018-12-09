const {app, BrowserWindow} = require('electron')
const path = require('path')
const { autoUpdater } = require("electron-updater")

autoUpdater.checkForUpdatesAndNotify()


function createWindow () {
    win = new BrowserWindow({
        width: 600, 
        height: 430, 
        frame: false,
        show: false,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png')
    })

    win.loadFile('index.html')

    win.webContents.on('did-finish-load', () => {
        win.show()
        win.webContents.openDevTools();
    })
    win.on('closed', () => {
        win = null
    })
}

global.defaultMusicPath = app.getPath('music')
global.ffmpeg = path.resolve(__dirname, "./bin/ffmpeg.exe")
global.downloads = path.resolve(__dirname, "./downloads")
app.on('ready', createWindow)
