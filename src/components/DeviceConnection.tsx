import React, { useState } from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Usb, ArrowClockwise } from '@phosphor-icons/react';
import { useToast } from './ui/use-toast';
import { useElectronSerial } from '../hooks/useElectronSerial';
import { useDeviceSerial } from '../hooks/useDeviceSerial';

export const DeviceConnection: React.FC = () => {
  const { isDeviceConnected, deviceType, connectDevice, disconnectDevice } = useIDEStore();
  const webSerial = useDeviceSerial();
  const electronSerial = useElectronSerial();
  const { toast } = useToast();
  const [selectedPort, setSelectedPort] = useState<string>('');

  // Use Electron serial when available, fallback to WebSerial
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const serialAPI = isElectron ? electronSerial : webSerial;

  const handleConnect = async () => {
    if (isElectron && !selectedPort) {
      toast({
        title: "Error",
        description: "Please select a port first",
        variant: "destructive",
      });
      return;
    }

    const success = isElectron 
      ? await serialAPI.connectToDevice(selectedPort, 115200)
      : await (serialAPI as any).connectToDevice();
    
    if (success) {
      connectDevice(isElectron ? 'ESP32 (USB)' : 'ESP32 (WebSerial)');
      toast({
        title: "Connected",
        description: `Connected to ${isElectron ? selectedPort : 'device'}`,
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not connect to device",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    await serialAPI.disconnectFromDevice();
    disconnectDevice();
    toast({
      title: "Disconnected",
      description: "Device disconnected",
    });
  };

  const handleRefreshPorts = () => {
    if (isElectron) {
      electronSerial.listPorts();
    }
  };

  if (serialAPI.isConnected && isDeviceConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-success/20 text-success rounded-md">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <Usb size={16} />
          <span className="text-sm font-medium">{deviceType}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-border hover:bg-file-hover"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isElectron && (
        <>
          <Select value={selectedPort} onValueChange={setSelectedPort}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Select Port" />
            </SelectTrigger>
            <SelectContent>
              {electronSerial.availablePorts.map((port) => (
                <SelectItem key={port.path} value={port.path}>
                  {port.path} {port.manufacturer && `(${port.manufacturer})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPorts}
            className="w-8 h-8 p-0"
          >
            <ArrowClockwise size={14} />
          </Button>
        </>
      )}
      <Button
        onClick={handleConnect}
        disabled={serialAPI.isConnecting || (isElectron && !selectedPort)}
        className="bg-primary hover:bg-primary-glow text-primary-foreground shadow-glow"
        size="sm"
      >
        <Usb size={16} className="mr-2" />
        {serialAPI.isConnecting ? 'Connecting...' : 'Connect Device'}
      </Button>
    </div>
  );
};