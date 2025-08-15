import React from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Usb } from '@phosphor-icons/react';

export const DeviceConnection: React.FC = () => {
  const { isDeviceConnected, deviceType, connectDevice, disconnectDevice } = useIDEStore();

  const handleConnect = async () => {
    try {
      // Check if WebSerial is supported
      if ('serial' in navigator) {
        // Request a port
        const port = await (navigator as any).serial.requestPort();
        connectDevice('ESP32');
      } else {
        // Fallback - just simulate connection
        connectDevice('ESP32');
      }
    } catch (error) {
      console.log('User cancelled device selection');
    }
  };

  const handleDisconnect = () => {
    disconnectDevice();
  };

  if (isDeviceConnected) {
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
      <Button
        onClick={handleConnect}
        className="bg-primary hover:bg-primary-glow text-primary-foreground shadow-glow"
        size="sm"
      >
        <Usb size={16} className="mr-2" />
        Connect Device
      </Button>
    </div>
  );
};