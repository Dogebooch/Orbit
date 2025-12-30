const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Mission Control aesthetic - dark frame
    backgroundColor: '#0f172a',
    titleBarStyle: 'default',
    show: false,
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle any IPC messages from the renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle opening local files
ipcMain.handle('open-local-file', async (event, relativePath) => {
  try {
    let filePath;
    
    if (isDev) {
      // In development, resolve relative to project root
      // __dirname is electron/ directory, so go up one level
      filePath = path.join(__dirname, '..', relativePath);
    } else {
      // In production, resolve relative to app resources
      // app.getAppPath() returns the path to the app.asar or unpacked app
      filePath = path.join(app.getAppPath(), relativePath);
    }
    
    // Normalize the path to handle any path separators
    filePath = path.normalize(filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    // Open the file with the system default application
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle opening directory in file explorer
ipcMain.handle('open-directory', async (event, directoryPath) => {
  try {
    if (!directoryPath || !fs.existsSync(directoryPath)) {
      return { success: false, error: `Directory not found: ${directoryPath}` };
    }
    
    // Use shell.openPath for Windows (opens in Explorer)
    await shell.openPath(directoryPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

