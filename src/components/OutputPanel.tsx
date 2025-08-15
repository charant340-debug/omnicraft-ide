import React from 'react';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { X, Terminal, Trash } from '@phosphor-icons/react';

export const OutputPanel: React.FC = () => {
  const { outputLogs, isOutputVisible, toggleOutput, clearOutputLogs } = useIDEStore();

  if (!isOutputVisible) return null;

  const getLogIcon = (type: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="h-64 bg-terminal border-t border-border flex flex-col">
      {/* Header */}
      <div className="h-8 bg-panel-bg border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Output</span>
          <span className="text-xs text-muted-foreground">({outputLogs.length} logs)</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOutputLogs}
            className="w-6 h-6 p-0 hover:bg-muted"
            disabled={outputLogs.length === 0}
          >
            <Trash size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleOutput}
            className="w-6 h-6 p-0 hover:bg-muted"
          >
            <X size={12} />
          </Button>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-sm bg-terminal">
        {outputLogs.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            No output logs yet. Run your code to see results here.
          </div>
        ) : (
          <div className="space-y-1">
            {outputLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 py-1">
                <span className="text-xs text-muted-foreground flex-shrink-0 w-16">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="flex-shrink-0">
                  {getLogIcon(log.type)}
                </span>
                <span className={`flex-1 ${getLogColor(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};