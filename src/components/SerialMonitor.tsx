import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Terminal, Send, Trash, Download } from 'lucide-react';
import { serialManager } from '../utils/serial';
import { useToast } from './ui/use-toast';

export const SerialMonitor: React.FC = () => {
  const { 
    isDeviceConnected, 
    serialData, 
    addSerialData, 
    clearSerialData, 
    lastCommand,
    setLastCommand,
    addOutputLog 
  } = useIDEStore();
  
  const [command, setCommand] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [serialData, isAutoScroll]);

  // Setup serial data listener
  useEffect(() => {
    const handleSerialData = (data: string) => {
      addSerialData(data);
      addOutputLog('info', `Received: ${data.trim()}`);
    };

    const handleSerialError = (error: string) => {
      addOutputLog('error', `Serial Error: ${error}`);
      toast({
        title: 'Serial Error',
        description: error,
        variant: 'destructive'
      });
    };

    const handleDisconnected = () => {
      addOutputLog('info', 'Device disconnected');
      toast({
        title: 'Device Disconnected',
        description: 'Serial connection was lost'
      });
    };

    serialManager.on('data', handleSerialData);
    serialManager.on('error', handleSerialError);
    serialManager.on('disconnected', handleDisconnected);

    return () => {
      serialManager.off('data', handleSerialData);
      serialManager.off('error', handleSerialError);
      serialManager.off('disconnected', handleDisconnected);
    };
  }, [addSerialData, addOutputLog, toast]);

  const handleSendCommand = async () => {
    if (!command.trim() || !isDeviceConnected) return;

    try {
      const success = await serialManager.writeToDevice(command);
      if (success) {
        addOutputLog('success', `Sent: ${command}`);
        setLastCommand(command);
        setCommand('');
      } else {
        throw new Error('Failed to send command');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addOutputLog('error', `Send failed: ${errorMessage}`);
      toast({
        title: 'Send Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCommand(lastCommand);
    }
  };

  const handleExportLog = () => {
    const blob = new Blob([serialData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Log Exported',
      description: 'Serial log has been downloaded'
    });
  };

  const formatSerialData = (data: string) => {
    return data.split('\n').map((line, index) => {
      const timestamp = new Date().toLocaleTimeString();
      return (
        <div key={index} className="flex text-sm">
          <span className="text-muted-foreground text-xs w-20 flex-shrink-0">
            {timestamp}
          </span>
          <span className="text-green-400 font-mono ml-2">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="h-full bg-terminal flex flex-col border-l border-border">
      {/* Header */}
      <div className="h-10 bg-panel-bg border-b border-border flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Serial Monitor</span>
          <div className={`w-2 h-2 rounded-full ${isDeviceConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportLog}
            className="w-7 h-7 p-0"
            disabled={!serialData}
            title="Export log"
          >
            <Download size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSerialData}
            className="w-7 h-7 p-0"
            disabled={!serialData}
            title="Clear monitor"
          >
            <Trash size={12} />
          </Button>
        </div>
      </div>

      {/* Serial Output */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-3 font-mono text-sm">
            {!isDeviceConnected ? (
              <div className="text-muted-foreground text-center py-8">
                Connect to a device to see serial output
              </div>
            ) : serialData ? (
              <div className="space-y-1">
                {formatSerialData(serialData)}
              </div>
            ) : (
              <div className="text-muted-foreground">
                Waiting for data...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Auto-scroll toggle */}
        <div className="absolute bottom-2 right-2">
          <Button
            variant={isAutoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className="text-xs h-6"
          >
            Auto-scroll {isAutoScroll ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Command Input */}
      <div className="h-12 border-t border-border bg-panel-bg flex items-center space-x-2 px-3 flex-shrink-0">
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isDeviceConnected ? "Type command... (↑ for last, Enter to send)" : "Connect device first"}
          disabled={!isDeviceConnected}
          className="flex-1 h-8 text-sm font-mono bg-terminal border-muted"
        />
        <Button
          onClick={handleSendCommand}
          disabled={!isDeviceConnected || !command.trim()}
          size="sm"
          className="h-8 px-3"
        >
          <Send size={12} className="mr-1" />
          Send
        </Button>
      </div>
    </div>
  );
};