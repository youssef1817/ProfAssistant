const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

let mainWindow;
let serverProcess;

function startServer() {
    const appDataDir = app.getPath('userData');
    const targetDbFile = path.join(appDataDir, 'database.json');
    const sourceDbFile = path.join(__dirname, 'database.json');
    
    // Auto-create directory and migrate existing data to avoid any data loss
    if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true });
    }
    
    if (!fs.existsSync(targetDbFile) && fs.existsSync(sourceDbFile)) {
        try {
            fs.copyFileSync(sourceDbFile, targetDbFile);
            console.log(`Successfully migrated existing database.json to AppData!`);
        } catch (e) {
            console.error(`Error migrating database.json:`, e);
        }
    }

    // Determine node binary to use (portable local or system node)
    const binNode = path.join(__dirname, 'bin', 'node.exe');
    const hasLocalNode = fs.existsSync(binNode);
    const nodeBinary = hasLocalNode ? binNode : 'node';

    console.log(`Starting background server using: ${nodeBinary}`);

    // Spawn scripts/server.mjs with secure environment paths
    serverProcess = spawn(nodeBinary, [path.join(__dirname, 'scripts', 'server.mjs')], {
        cwd: __dirname,
        env: { 
            ...process.env, 
            PORT: '3000',
            APP_DATA_DIR: appDataDir,
            EXCEL_REPOSITORY_DIR: path.join(app.getPath('documents'), 'ProfAssistant', 'مستودع النقط')
        }
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data}`);
    });
}

function checkServerReady(port, callback) {
    const client = net.connect({ port }, () => {
        client.end();
        callback(true);
    });
    client.on('error', () => {
        setTimeout(() => checkServerReady(port, callback), 50); // Poll every 50ms
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        title: "منصة ProfAssistant - التتبع والتحليل الذكي لنقط التلاميذ",
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Remove menu bar
    mainWindow.setMenuBarVisibility(false);

    // Load the beautiful styled loading screen immediately
    mainWindow.loadFile(path.join(__dirname, 'public', 'loading.html'));

    // Probe the server port and load URL immediately when ready
    checkServerReady(3000, () => {
        if (mainWindow) {
            mainWindow.loadURL('http://localhost:3000');
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startServer();
    createWindow();
});

app.on('window-all-closed', () => {
    // Gracefully terminate the server process
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
