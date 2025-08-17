import React, { useEffect, useState } from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Usb } from '@phosphor-icons/react';
import { RotateCcw, Zap } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useElectronSerial } from '../hooks/useElectronSerial';
import { useDeviceSerial } from '../hooks/useDeviceSerial';
import { serialManager } from '../utils/serial';

export const DeviceConnection: React.FC = () => {
  const { isDeviceConnected, connectDevice, disconnectDevice, addOutputLog } = useIDEStore();
  const { toast } = useToast();
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [availablePorts, setAvailablePorts] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  // Electron serial hook
  const electronSerial = useElectronSerial();
  
  // Web serial hook  
  const webSerial = useDeviceSerial();

  // Use the appropriate hook based on environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const serial = isElectron ? electronSerial : webSerial;

  // Load available ports on mount and attempt auto-connect
  useEffect(() => {
    loadAvailablePorts();
    if (!autoConnectAttempted) {
      handleAutoConnect();
      setAutoConnectAttempted(true);
    }
  }, [autoConnectAttempted]);

  const loadAvailablePorts = async () => {
    try {
      const ports = await serialManager.listAvailablePorts();
      setAvailablePorts(ports);
      
      // If no port selected but ports available, select first one
      if (!selectedPort && ports.length > 0) {
        setSelectedPort(ports[0].path);
      }
    } catch (error) {
      console.error('Failed to load ports:', error);
      addOutputLog('error', 'Failed to load available ports');
    }
  };

  const handleAutoConnect = async () => {
    if (isDeviceConnected) return;
    
    setIsConnecting(true);
    try {
      const success = await serialManager.autoConnectToDevice();
      if (success) {
        const connectionInfo = serialManager.getConnectionInfo();
        connectDevice('Auto-detected Device', connectionInfo?.path);
        addOutputLog('success', `Auto-connected to device: ${connectionInfo?.path}`);
        toast({
          title: 'Device Connected',
          description: 'Automatically connected to available device'
        });
      }
    } catch (error) {
      console.log('Auto-connect not available:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPort && !isElectron) {
      // For WebSerial, trigger port selection
      try {
        setIsConnecting(true);
        const success = await serialManager.connectToDevice();
        if (success) {
          const connectionInfo = serialManager.getConnectionInfo();
          connectDevice('ESP32 (WebSerial)', connectionInfo?.path);
          addOutputLog('success', 'Connected via WebSerial');
          toast({
            title: 'Device Connected',
            description: 'Successfully connected via WebSerial'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        addOutputLog('error', `Connection failed: ${errorMessage}`);
        toast({
          title: 'Connection Failed',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    if (!selectedPort) {
      toast({
        title: 'No Port Selected',
        description: 'Please select a port to connect to',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    try {
      const success = await serialManager.connectToDevice(selectedPort);
      if (success) {
        connectDevice(isElectron ? 'ESP32 (USB)' : 'ESP32 (WebSerial)', selectedPort);
        addOutputLog('success', `Connected to ${selectedPort}`);
        toast({
          title: 'Device Connected',
          description: `Successfully connected to ${selectedPort}`
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      addOutputLog('error', `Connection failed: ${errorMessage}`);
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await serialManager.disconnectFromDevice();
      disconnectDevice();
      addOutputLog('info', 'Device disconnected');
      toast({
        title: 'Device Disconnected',
        description: 'Successfully disconnected from device'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed';
      addOutputLog('error', `Disconnect failed: ${errorMessage}`);
    }
  };

  const handleRefreshPorts = async () => {
    await loadAvailablePorts();
    toast({
      title: 'Ports Refreshed',
      description: `Found ${availablePorts.length} available ports`
    });
  };

  return (
    <div className="flex items-center space-x-2">
      {isDeviceConnected ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-success/20 text-success rounded-md">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <Usb size={16} />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="h-8 border-border hover:bg-file-hover"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <>
          <Select value={selectedPort} onValueChange={setSelectedPort}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder={availablePorts.length > 0 ? "Select port" : "No ports found"} />
            </SelectTrigger>
            <SelectContent>
              {availablePorts.map((port) => (
                <SelectItem key={port.path} value={port.path}>
                  {port.path} {port.manufacturer && `(${port.manufacturer})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="h-8"
          >
            <Usb size={14} className="mr-1" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>

          <Button
            onClick={handleAutoConnect}
            disabled={isConnecting}
            size="sm"
            variant="outline"
            className="h-8"
            title="Auto-connect to first available device"
          >
            <Zap size={14} className="mr-1" />
            Auto
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshPorts}
            className="w-8 h-8 p-0"
            title="Refresh ports"
          >
            <RotateCcw size={14} />
          </Button>
        </>
      )}
    </div>
  );
};