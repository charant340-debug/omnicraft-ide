import React from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { AIAssistant } from './AIAssistant';
import { TabBar } from './TabBar';
import { DeviceConnection } from './DeviceConnection';
import { useIDEStore } from '../stores/ideStore';

export const IDELayout: React.FC = () => {
  const { isAIVisible } = useIDEStore();

  return (
    <div className="min-h-screen bg-background font-ui flex flex-col">
      {/* Top Bar */}
      <header className="h-12 bg-panel-bg border-b border-border flex items-center justify-between px-4 shadow-panel">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-sm">IoT</span>
            </div>
            <span className="text-foreground font-semibold">IDE</span>
          </div>
          <TabBar />
        </div>
        <DeviceConnection />
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-80 bg-sidebar-bg border-r border-border">
          <FileExplorer />
        </div>

        {/* Code Editor */}
        <div className={`flex-1 flex flex-col min-w-0 ${isAIVisible ? 'mr-96' : ''} transition-all duration-300`}>
          <CodeEditor />
        </div>

        {/* AI Assistant */}
        {isAIVisible && (
          <div className="w-96 bg-panel-bg border-l border-border">
            <AIAssistant />
          </div>
        )}
      </div>
    </div>
  );
};