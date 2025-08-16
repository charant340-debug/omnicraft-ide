import { useState, useRef } from 'react';
import { useToast } from '../components/ui/use-toast';

interface SerialDevice {
  port: any | null; // SerialPort type not available in TS
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  writer: WritableStreamDefaultWriter<Uint8Array> | null;
}

export const useDeviceSerial = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const deviceRef = useRef<SerialDevice>({ port: null, reader: null, writer: null });
  const { toast } = useToast();

  const connectToDevice = async (): Promise<boolean> => {
    setIsConnecting(true);
    
    // Check WebSerial support
    if (!('serial' in navigator)) {
      toast({
        title: "WebSerial Not Supported",
        description: "Your browser doesn't support WebSerial API. Please use Chrome or Edge.",
        variant: "destructive"
      });
      setIsConnecting(false);
      return false;
    }
    
    try {
      // Request a port
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // CP210x
          { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // CH340
          { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
          { usbVendorId: 0x239A }, // Adafruit boards
        ]
      });

      // Open the port
      await port.open({ 
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      // Set up reader and writer
      const reader = port.readable?.getReader();
      const writer = port.writable?.getWriter();

      deviceRef.current = { port, reader, writer };
      setIsConnected(true);
      
      toast({
        title: "Device Connected",
        description: "Successfully connected to the device",
      });

      return true;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      toast({
        title: "Connection Failed", 
        description: "Failed to connect to device. Make sure it's plugged in.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromDevice = async () => {
    const { port, reader, writer } = deviceRef.current;
    
    try {
      if (reader) {
        await reader.cancel();
        await reader.releaseLock();
      }
      
      if (writer) {
        await writer.close();
      }
      
      if (port) {
        await port.close();
      }
      
      deviceRef.current = { port: null, reader: null, writer: null };
      setIsConnected(false);
      
      toast({
        title: "Device Disconnected",
        description: "Device has been disconnected",
      });
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    }
  };

  const sendCommand = async (command: string): Promise<void> => {
    const { writer } = deviceRef.current;
    
    if (!writer || !isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command + '\r\n');
      await writer.write(data);
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  };

  const readData = async (): Promise<string> => {
    const { reader } = deviceRef.current;
    
    if (!reader || !isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const decoder = new TextDecoder();
      let result = '';
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout
      
      while (attempts < maxAttempts) {
        const { value, done } = await reader.read();
        
        if (done) break;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          
          // Check if we have a complete response (ending with >>> or error)
          if (chunk.includes('>>>') || chunk.includes('Traceback')) {
            break;
          }
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to read data:', error);
      throw error;
    }
  };

  const executeCode = async (code: string): Promise<string[]> => {
    if (!isConnected) {
      throw new Error('Device not connected');
    }

    const outputs: string[] = [];
    
    try {
      // Send Ctrl+C to interrupt any running code
      await sendCommand('\x03');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear any existing output
      let initialData = await readData();
      if (initialData) {
        outputs.push('>>> Device connected and ready');
      }

      // Send the code line by line for better execution
      const lines = code.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.trim()) {
          await sendCommand(line);
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const response = await readData();
          if (response) {
            // Clean up the response and add to outputs
            const cleanResponse = response
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .split('\n')
              .filter(line => line.trim() && !line.includes('>>>'))
              .map(line => line.trim());
            
            outputs.push(...cleanResponse);
          }
        }
      }

      return outputs;
    } catch (error) {
      console.error('Failed to execute code:', error);
      outputs.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return outputs;
    }
  };

  const uploadFile = async (filename: string, content: string): Promise<void> => {
    if (!isConnected) {
      throw new Error('Device not connected');
    }

    try {
      // Create file upload command
      const lines = content.split('\n');
      
      // Start file creation
      await sendCommand(`f = open('${filename}', 'w')`);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Write content line by line
      for (const line of lines) {
        const escapedLine = line.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        await sendCommand(`f.write('${escapedLine}\\n')`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Close file
      await sendCommand('f.close()');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast({
        title: "File Uploaded",
        description: `${filename} has been uploaded to the device`,
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  return {
    isConnected,
    isConnecting,
    connectToDevice,
    disconnectFromDevice,
    sendCommand,
    readData,
    executeCode,
    uploadFile
  };
};