import { useState, useEffect, useCallback } from 'react';

interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

interface UseElectronSerialReturn {
  isConnected: boolean;
  isConnecting: boolean;
  availablePorts: SerialPort[];
  connectedPort: string | null;
  lastMessage: string;
  error: string | null;
  
  listPorts: () => Promise<void>;
  connectToDevice: (portPath: string, baudRate?: number) => Promise<boolean>;
  disconnectFromDevice: () => Promise<void>;
  sendCommand: (command: string) => Promise<boolean>;
  executeCode: (code: string) => Promise<string>;
  uploadFile: (filename: string, content: string) => Promise<boolean>;
}

export const useElectronSerial = (): UseElectronSerialReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPort[]>([]);
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const listPorts = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const ports = await window.electronAPI.serial.listPorts();
      setAvailablePorts(ports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list ports');
      console.error('Error listing ports:', err);
    }
  }, [isElectron]);

  const connectToDevice = useCallback(async (portPath: string, baudRate = 115200): Promise<boolean> => {
    if (!isElectron) return false;

    setIsConnecting(true);
    setError(null);

    try {
      const result = await window.electronAPI.serial.connect(portPath, baudRate);
      if (result.success) {
        setIsConnected(true);
        setConnectedPort(portPath);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to device';
      setError(errorMessage);
      console.error('Connection error:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isElectron]);

  const disconnectFromDevice = useCallback(async () => {
    if (!isElectron) return;

    try {
      await window.electronAPI.serial.disconnect();
      setIsConnected(false);
      setConnectedPort(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      console.error('Disconnect error:', err);
    }
  }, [isElectron]);

  const sendCommand = useCallback(async (command: string): Promise<boolean> => {
    if (!isElectron || !isConnected) return false;

    try {
      const result = await window.electronAPI.serial.sendData(command);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
      console.error('Send command error:', err);
      return false;
    }
  }, [isElectron, isConnected]);

  const executeCode = useCallback(async (code: string): Promise<string> => {
    if (!isElectron || !isConnected) return 'Device not connected';

    try {
      // Send code line by line for MicroPython
      const lines = code.split('\n').filter(line => line.trim());
      let output = '';

      for (const line of lines) {
        await sendCommand(line);
        // Wait a bit for response
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return output || 'Code executed successfully';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute code';
      setError(errorMessage);
      return errorMessage;
    }
  }, [isElectron, isConnected, sendCommand]);

  const uploadFile = useCallback(async (filename: string, content: string): Promise<boolean> => {
    if (!isElectron || !isConnected) return false;

    try {
      // Create file on device
      await sendCommand(`f = open('${filename}', 'w')`);
      
      // Write content line by line
      const lines = content.split('\n');
      for (const line of lines) {
        const escapedLine = line.replace(/'/g, "\\'");
        await sendCommand(`f.write('${escapedLine}\\n')`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Close file
      await sendCommand('f.close()');
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Upload file error:', err);
      return false;
    }
  }, [isElectron, isConnected, sendCommand]);

  // Set up event listeners
  useEffect(() => {
    if (!isElectron) return;

    // Listen for incoming data
    window.electronAPI.serial.onDataReceived((data: string) => {
      setLastMessage(data);
    });

    // Listen for errors
    window.electronAPI.serial.onError((error: string) => {
      setError(error);
    });

    // Listen for disconnection
    window.electronAPI.serial.onDisconnected(() => {
      setIsConnected(false);
      setConnectedPort(null);
    });

    // Check initial connection status
    window.electronAPI.serial.isConnected().then(setIsConnected);

    // Initial port listing
    listPorts();

    return () => {
      // Clean up listeners
      window.electronAPI.serial.removeAllListeners('serial:data-received');
      window.electronAPI.serial.removeAllListeners('serial:error');
      window.electronAPI.serial.removeAllListeners('serial:disconnected');
    };
  }, [isElectron, listPorts]);

  return {
    isConnected,
    isConnecting,
    availablePorts,
    connectedPort,
    lastMessage,
    error,
    listPorts,
    connectToDevice,
    disconnectFromDevice,
    sendCommand,
    executeCode,
    uploadFile
  };
};