import React from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Usb } from '@phosphor-icons/react';
import { useToast } from './ui/use-toast';
import { useDeviceSerial } from '../hooks/useDeviceSerial';

export const DeviceConnection: React.FC = () => {
  const { isDeviceConnected, deviceType, connectDevice, disconnectDevice } = useIDEStore();
  const { isConnected, isConnecting, connectToDevice, disconnectFromDevice } = useDeviceSerial();
  const { toast } = useToast();

  const handleConnect = async () => {
    const success = await connectToDevice();
    if (success) {
      connectDevice('ESP32');
    }
  };

  const handleDisconnect = async () => {
    await disconnectFromDevice();
    disconnectDevice();
  };

  if (isConnected && isDeviceConnected) {
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
        disabled={isConnecting}
        className="bg-primary hover:bg-primary-glow text-primary-foreground shadow-glow"
        size="sm"
      >
        <Usb size={16} className="mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Device'}
      </Button>
    </div>
  );
};