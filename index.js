const {app, BrowserWindow} = require('electron')
const path = require('path')

// Auto updater
require('update-electron-app')()

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
    })
    win.on('closed', () => {
        win = null
    })
}
global.defaultMusicPath = app.getPath('music')
app.on('ready', createWindow)
