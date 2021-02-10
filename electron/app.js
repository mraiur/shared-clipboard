const {ipcMain, app, BrowserWindow, ipcRenderer} = require('electron')

const path = require('path')
const { fork, spawn } = require('child_process')

let server;
let mainWindow;

// Attach listener in the main process with the given ID
ipcMain.on('connect-app', (event, arg) => {

	server = fork(`${__dirname}/../src/server.js`, [`--httpPort=${arg.httpPort}`, `--wsPort=${arg.socketPort}`])

	setTimeout(() => {
		mainWindow.webContents.loadURL(`http://localhost:${arg.httpPort}/`)
	}, 1000);
});

ipcMain.on('disconnect-app', (event, arg) => {
	console.log('disconnect')
});

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			//nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	//mainWindow.loadURL('http://localhost:8080')
	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, 'index.html'))


	// Open the DevTools.
	mainWindow.webContents.openDevTools()

	mainWindow.webContents.on("did-fail-load", function(e) {
		console.log("load fail", e)
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		if(server){
			console.log("cleanup")
			server.kill('SIGKILL');
		}
		app.quit()
	}
})

app.on('before-quit', function(){
	if(server){
		server.kill()
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
