// ============== Cross-Platform Serial Utilities ==============
// Works with both Electron (node-serialport) and Browser (WebSerial API)

class SerialManager {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
    this.connectedPort = null;
    this.listeners = new Map();
    this.lastConnectedDevice = null;
  }

  // ===== Port Management =====
  
  /**
   * List all available serial ports
   * @returns {Promise<Array>} Array of port objects
   */
  async listAvailablePorts() {
    try {
      if (this.isElectron) {
        // Use Electron's serialport
        return await window.electronAPI.serial.listPorts();
      } else {
        // Use WebSerial API (browser)
        if (!navigator.serial) {
          throw new Error('WebSerial API not supported in this browser');
        }
        const ports = await navigator.serial.getPorts();
        return ports.map((port, index) => ({
          path: `browser-port-${index}`,
          manufacturer: 'Web Serial Device',
          serialNumber: `web-${Date.now()}-${index}`,
          port: port // Keep reference to the actual WebSerial port
        }));
      }
    } catch (error) {
      console.error('Error listing ports:', error);
      return [];
    }
  }

  /**
   * Auto-detect and connect to first available ESP32/Arduino device
   * @param {number} baudRate - Connection baud rate (default: 115200)
   * @returns {Promise<boolean>} Success status
   */
  async autoConnectToDevice(baudRate = 115200) {
    try {
      // First try to reconnect to last used device
      const lastDevice = this.getLastConnectedDevice();
      if (lastDevice) {
        const success = await this.connectToDevice(lastDevice.path, baudRate);
        if (success) {
          console.log('Reconnected to last device:', lastDevice.path);
          return true;
        }
      }

      // If that fails, get available ports and connect to first one
      const ports = await this.listAvailablePorts();
      if (ports.length === 0) {
        throw new Error('No serial devices found');
      }

      // Try to find ESP32/Arduino device first
      const priorityDevices = ports.filter(port => 
        port.manufacturer?.toLowerCase().includes('esp') ||
        port.manufacturer?.toLowerCase().includes('arduino') ||
        port.manufacturer?.toLowerCase().includes('ftdi') ||
        port.manufacturer?.toLowerCase().includes('silicon labs')
      );

      const targetPort = priorityDevices.length > 0 ? priorityDevices[0] : ports[0];
      const success = await this.connectToDevice(targetPort.path, baudRate);
      
      if (success) {
        console.log('Auto-connected to device:', targetPort.path);
        this.saveLastConnectedDevice(targetPort);
      }
      
      return success;
    } catch (error) {
      console.error('Auto-connect failed:', error);
      return false;
    }
  }

  /**
   * Connect to a specific device
   * @param {string} path - Port path or device identifier
   * @param {number} baudRate - Connection baud rate
   * @returns {Promise<boolean>} Success status
   */
  async connectToDevice(path, baudRate = 115200) {
    try {
      if (this.connectedPort) {
        await this.disconnectFromDevice();
      }

      if (this.isElectron) {
        // Use Electron's serial connection
        const result = await window.electronAPI.serial.connect(path, baudRate);
        if (result.success) {
          this.connectedPort = { path, baudRate, type: 'electron' };
          this.setupElectronListeners();
          return true;
        }
        return false;
      } else {
        // Use WebSerial API
        if (!navigator.serial) {
          throw new Error('WebSerial API not supported');
        }

        let port;
        if (path.startsWith('browser-port-')) {
          // Use existing port from the list
          const existingPorts = await navigator.serial.getPorts();
          const index = parseInt(path.replace('browser-port-', ''));
          port = existingPorts[index];
        } else {
          // Request new port access
          port = await navigator.serial.requestPort();
        }

        await port.open({ baudRate });
        this.connectedPort = { port, path, baudRate, type: 'webserial' };
        this.setupWebSerialListeners(port);
        return true;
      }
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from current device
   * @returns {Promise<void>}
   */
  async disconnectFromDevice() {
    try {
      if (!this.connectedPort) return;

      if (this.isElectron) {
        await window.electronAPI.serial.disconnect();
      } else if (this.connectedPort.port) {
        await this.connectedPort.port.close();
      }

      this.connectedPort = null;
      this.emit('disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  // ===== Data Communication =====

  /**
   * Send data to connected device
   * @param {string} message - Message to send
   * @returns {Promise<boolean>} Success status
   */
  async writeToDevice(message) {
    try {
      if (!this.connectedPort) {
        throw new Error('No device connected');
      }

      const data = message + '\r\n'; // Add line ending

      if (this.isElectron) {
        const result = await window.electronAPI.serial.sendData(data);
        return result.success;
      } else {
        const writer = this.connectedPort.port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data));
        writer.releaseLock();
        return true;
      }
    } catch (error) {
      console.error('Write failed:', error);
      return false;
    }
  }

  /**
   * Send command and wait for response
   * @param {string} command - Command to send
   * @param {number} timeout - Response timeout in ms
   * @returns {Promise<string>} Device response
   */
  async sendCommandAndWait(command, timeout = 2000) {
    return new Promise(async (resolve, reject) => {
      let responseBuffer = '';
      const timeoutId = setTimeout(() => {
        this.off('data', responseHandler);
        reject(new Error('Command timeout'));
      }, timeout);

      const responseHandler = (data) => {
        responseBuffer += data;
        if (responseBuffer.includes('\n') || responseBuffer.includes('>>>')) {
          clearTimeout(timeoutId);
          this.off('data', responseHandler);
          resolve(responseBuffer.trim());
        }
      };

      this.on('data', responseHandler);
      const success = await this.writeToDevice(command);
      if (!success) {
        clearTimeout(timeoutId);
        this.off('data', responseHandler);
        reject(new Error('Failed to send command'));
      }
    });
  }

  // ===== Event System =====

  /**
   * Add event listener
   * @param {string} event - Event name ('data', 'error', 'connected', 'disconnected')
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      });
    }
  }

  // ===== Status & Persistence =====

  /**
   * Check if device is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connectedPort !== null;
  }

  /**
   * Get current connection info
   * @returns {Object|null}
   */
  getConnectionInfo() {
    return this.connectedPort;
  }

  /**
   * Save last connected device to localStorage
   * @param {Object} deviceInfo - Device information
   */
  saveLastConnectedDevice(deviceInfo) {
    try {
      localStorage.setItem('iot-ide-last-device', JSON.stringify({
        path: deviceInfo.path,
        manufacturer: deviceInfo.manufacturer,
        serialNumber: deviceInfo.serialNumber,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save last device:', error);
    }
  }

  /**
   * Get last connected device from localStorage
   * @returns {Object|null}
   */
  getLastConnectedDevice() {
    try {
      const saved = localStorage.getItem('iot-ide-last-device');
      if (saved) {
        const deviceInfo = JSON.parse(saved);
        // Only return if saved within last 7 days
        if (Date.now() - deviceInfo.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return deviceInfo;
        }
      }
    } catch (error) {
      console.warn('Failed to load last device:', error);
    }
    return null;
  }

  // ===== Private Methods =====

  /**
   * Setup event listeners for Electron serial communication
   */
  setupElectronListeners() {
    // Listen for incoming data
    window.electronAPI.serial.onDataReceived((data) => {
      this.emit('data', data);
    });

    // Listen for errors
    window.electronAPI.serial.onError((error) => {
      this.emit('error', error);
    });

    // Listen for disconnection
    window.electronAPI.serial.onDisconnected(() => {
      this.connectedPort = null;
      this.emit('disconnected');
    });
  }

  /**
   * Setup event listeners for WebSerial communication
   * @param {SerialPort} port - WebSerial port
   */
  async setupWebSerialListeners(port) {
    try {
      const reader = port.readable.getReader();
      const decoder = new TextDecoder();

      // Start reading loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            this.emit('data', text);
          }
        } catch (error) {
          if (error.name === 'NetworkError') {
            // Port was disconnected
            this.connectedPort = null;
            this.emit('disconnected');
          } else {
            this.emit('error', error.message);
          }
        } finally {
          reader.releaseLock();
        }
      };

      readLoop();
    } catch (error) {
      console.error('Error setting up WebSerial listeners:', error);
      this.emit('error', error.message);
    }
  }
}

// Export singleton instance
export const serialManager = new SerialManager();

// Named function exports for convenience
export const listAvailablePorts = () => serialManager.listAvailablePorts();
export const connectToDevice = (path, baudRate) => serialManager.connectToDevice(path, baudRate);
export const autoConnectToDevice = (baudRate) => serialManager.autoConnectToDevice(baudRate);
export const disconnectFromDevice = () => serialManager.disconnectFromDevice();
export const writeToDevice = (message) => serialManager.writeToDevice(message);
export const sendCommandAndWait = (command, timeout) => serialManager.sendCommandAndWait(command, timeout);

export default serialManager;