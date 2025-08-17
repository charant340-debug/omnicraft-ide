const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Serial port methods
  serial: {
    listPorts: () => ipcRenderer.invoke('serial:list-ports'),
    connect: (portPath, baudRate) => ipcRenderer.invoke('serial:connect', portPath, baudRate),
    disconnect: () => ipcRenderer.invoke('serial:disconnect'),
    sendData: (data) => ipcRenderer.invoke('serial:send-data', data),
    isConnected: () => ipcRenderer.invoke('serial:is-connected'),
    
    // Event listeners
    onDataReceived: (callback) => {
      ipcRenderer.on('serial:data-received', (event, data) => callback(data));
    },
    onError: (callback) => {
      ipcRenderer.on('serial:error', (event, error) => callback(error));
    },
    onDisconnected: (callback) => {
      ipcRenderer.on('serial:disconnected', () => callback());
    },
    
    // Remove listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // File system methods
  fs: {
    showOpenDialog: () => ipcRenderer.invoke('fs:show-open-dialog'),
    showSaveDialog: (options) => ipcRenderer.invoke('fs:show-save-dialog', options)
  },

  // Window control methods
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Environment info
  platform: process.platform,
  isElectron: true
});