/**
 * 整个程序的入口函数
 * 过程介绍
 * 1. 初始化Electron主框架
 * 2. 创建主窗口
 * 3. 添加渲染线程监听器
 */
const { TC_DEBUG, TEST, TEACHER } = require('./env.js');
const Const = require('./config/const.js');
const Hotkey = require('./config/hotkey.js');
const StaticServ = require("./staticserv")
const SystemInfo = require("systeminformation")
// 初始化主框架
const { session, app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// console.log("platform",fs.readFileSync(logpath,"utf8"))
let updateWindow, mainWindow,
    loaded,
    mainWindowHotkeyListener,
    rationalMaximize = false,
    screenSize,
    closeWarning,
    mainWindowSize = { width: 1200, height: 600 },
    hotkeyTickTimer;

//register hotkey for mainwindow
mainWindowHotkeyListener = {
    mainWindow: null,
    tick: function () {
        // 处理从输入框激活状态直接切出,
        // app不响应`browser-window-blur`的问题
        hotkeyTickTimer = setInterval(() => {
            try {
                this.mainWindow && !this.mainWindow.webContents.isFocused() && this.unregister();
            } catch(e) {
                console.log("window has been destroy.")
            }
        }, 2000);
    },
    send: function (key) {
        if (!this.mainWindow) return;
        this.mainWindow.webContents && this.mainWindow.webContents.send('hotkey', key);
    },
    register: function () {
        for (let _keyName in Hotkey) {
            globalShortcut.register(Hotkey[_keyName].code, () => {
                this.send(_keyName);
            })
        }
    },
    unregister: function () {
        for (let _keyName in Hotkey) {
            if (Hotkey[_keyName].windowFocusNeeded) {
                globalShortcut.unregister(Hotkey[_keyName].code);
            }
        }
    },

}

function sendStatusToWindow(status, data) {
    if (!loaded) {
        updateWindow.webContents.on('did-finish-load', () => {
            loaded = true
            if (updateWindow) {
                log.info("send message", status);
                updateWindow.webContents.send('message', status, data);
            }
        })
    } else {
        if (updateWindow) {
            log.info("send message", status);
            updateWindow.webContents.send('message', status, data);
        }
    }
}

function createUpdateWindow() {
    updateWindow = new BrowserWindow({
        width: 600, height: 300,
        resizable: false,
        center: true,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            webSecurity: true,
            javascript: true,
            plugins: true
        }
    });
    if (TC_DEBUG) {
        // updateWindow.webContents.openDevTools();
    }
    updateWindow.on('closed', () => {
        updateWindow = null;
    });
    updateWindow.loadURL(`file://${__dirname}/dist/version.html#v${app.getVersion()}`);
}
autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow(Const.UPDATE.CHECKING);
})
autoUpdater.on('update-available', () => {
    sendStatusToWindow(Const.UPDATE.AVAILABLE);
})
autoUpdater.on('update-not-available', () => {
    sendStatusToWindow(Const.UPDATE.LASTEST);
    createMainWindow()
    updateWindow.close()
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow(Const.UPDATE.ERROR);
    setTimeout(() => {
        createMainWindow()
        updateWindow.close()
    }, 2000)
})
autoUpdater.on('download-progress', (progress) => {
    sendStatusToWindow(Const.UPDATE.DOWNLOADING, progress);
})
autoUpdater.on('update-downloaded', () => {
    sendStatusToWindow(Const.UPDATE.DOWNLOADED);
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 3000)
});
app.on('ready', function () {
    const shouldQuit = app.makeSingleInstance(() => {
        let existWindow = updateWindow || mainWindow
        if (existWindow) {
            if (existWindow.isMinimized()) {
                existWindow.restore()
            }
            existWindow.focus()
        }
    })
    if (shouldQuit) {
        app.quit()
        return
    }
    // createUpdateWindow();
    createMainWindow()
    autoUpdater.checkForUpdates();

    if (!TC_DEBUG) {
        if (process.platform === 'darwin') {
            const template = [
                {
                    label: '课件部署助手-测试环境',
                    submenu: [
                        { label: `当前版本 ${app.getVersion()}` },
                        { type: "separator" },
                        { label: "退出", accelerator: "Command+Q", click: function () { app.quit(); } }
                    ]
                },
                {
                    label: '编辑',
                    submenu: [
                        { label: "复制", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                        { label: "粘贴", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                        { label: "全选", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
                    ]
                },
                {
                    label: '帮助',
                    submenu: [
                        { label: "关于课件部署助手-测试环境", click() { require('electron').shell.openExternal('https://mingxi.cn') } }
                    ]
                },
            ]
            const menu = Menu.buildFromTemplate(template)
            Menu.setApplicationMenu(menu)
        }
    }
    screenSize = require('electron').screen.getPrimaryDisplay().size;
});

function createMainWindow() {
    process.env.APP_PATH = app.getAppPath();
    console.log("app path", process.env.APP_PATH)

    if (screenSize && rationalMaximize) {
        let maxRatio = Math.min(screenSize.width / mainWindowSize.width, screenSize.height / mainWindowSize.height);
        mainWindowSize.width *= maxRatio;
        mainWindowSize.height *= maxRatio;
    }

    let $main = new BrowserWindow({
        width: mainWindowSize.width | 0, height: mainWindowSize.height | 0,
        resizable: TC_DEBUG,
        center: true,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            webSecurity: false,
            javascript: true,
            plugins: true
        }
    })
    let userAgent = $main.webContents.getUserAgent()
    $main.webContents.setUserAgent(userAgent + ' KCPC');
    $main.loadURL(`file://${__dirname}/dist/index.html`)
    if (TC_DEBUG || TEST) {
        // $main.webContents.openDevTools();
    }
    $main.webContents.on('did-finish-load', () => {
        $main.webContents.send('configure', {
            __dirname, __apppath: app.getAppPath(),
            version: app.getVersion()
        });
        if (TEACHER) {
            mainWindowHotkeyListener.mainWindow = $main;
            mainWindowHotkeyListener.tick();
        }
        
		SystemInfo.getStaticData((info)=>{
            $main.webContents.send('configure', {
               systeminfo: info
            });
		})
    })
    $main.webContents.on('will-navigate', (ev, url) => {
        ev.preventDefault();
    });
    $main.on('closed', function (event) {
        mainWindow = null
        clearInterval(hotkeyTickTimer)
    })
    $main.on('close', function (event) {
        clearInterval(hotkeyTickTimer)
        if (closeWarning) {
            dialog.showMessageBox(null, {
                type: 'question',
                buttons: ['取消', '确认'],
                title: '',
                message: closeWarning.toString()
            }, function (code) {
                if (code == 0) {
                    event.preventDefault();
                }
            });
        }
    })
    $main.on('crashed', function (event) {
        log.error("main window crashed", event);
        createMainWindow()
        $main.destroy()
    })
    // $main.setAlwaysOnTop(true)
    new StaticServ($main)
    mainWindow = $main
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('browser-window-focus', function () {
    if (TEACHER) {
        mainWindowHotkeyListener.register();
    }
});

app.on('browser-window-blur', function () {
    if (TEACHER) {
        mainWindowHotkeyListener.unregister();
    }
});

process.on('uncaughtException', function (err) {
    log.error("uncaughtException", err);
});

ipcMain.on('off-hotkey', function () {
    TEACHER && mainWindowHotkeyListener.unregister();
});

ipcMain.on('on-hotkey', function () {
    TEACHER && mainWindowHotkeyListener.register();
});

ipcMain.on('on-closewarning', function (warningMsg) {
    TEACHER && (closeWarning = warningMsg);
});

ipcMain.on('off-closewarning', function () {
    TEACHER && (closeWarning = warningMsg);
});

ipcMain.on('open-directory-dialog', function (event,p,index){
    console.log('open-directory-dialog:',p,index)
    dialog.showOpenDialog({
        properties: [p]
    },function (files) {
        if (files){
            event.sender.send('selectedItem', files[0], index)
        }
    })
});