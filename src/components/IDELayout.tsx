import React from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { OutputPanel } from './OutputPanel';
import { AIAssistant } from './AIAssistant';
import { TabBar } from './TabBar';
import { DeviceConnection } from './DeviceConnection';
import { SerialMonitor } from './SerialMonitor';
import { useIDEStore } from '../stores/ideStore';
import { Robot, Sparkle, SidebarSimple } from '@phosphor-icons/react';
import { Button } from './ui/button';

export const IDELayout: React.FC = () => {
  const { 
    isAIVisible, 
    isExplorerCollapsed, 
    isOutputVisible, 
    toggleAI, 
    toggleExplorer, 
    toggleOutput,
    testAI,
    addOutputLog
  } = useIDEStore();

  return (
    <div className="h-screen bg-background font-ui flex flex-col overflow-hidden">
      {/* Top Bar - Fixed */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-panel-bg border-b border-border flex items-center justify-between px-4 shadow-panel z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-sm">IoT</span>
            </div>
            <span className="text-foreground font-semibold">IDE</span>
          </div>
          <TabBar />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isAIVisible ? "default" : "outline"}
            size="sm"
            onClick={toggleAI}
            className={`
              ${isAIVisible 
                ? 'bg-primary text-primary-foreground shadow-glow' 
                : 'border-border hover:bg-file-hover'
              }
            `}
          >
            {isAIVisible ? <Sparkle size={16} className="mr-2" /> : <Robot size={16} className="mr-2" />}
            {isAIVisible ? 'Hide AI' : 'Show AI'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              testAI();
              // Also show AI panel to see the result
              if (!isAIVisible) toggleAI();
            }}
            className="border-border hover:bg-file-hover"
          >
            🧪 Test AI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addOutputLog('info', 'Code execution started...');
              setTimeout(() => addOutputLog('success', 'Build completed successfully!'), 1000);
              setTimeout(() => addOutputLog('info', 'Server started on port 3000'), 1500);
            }}
            className="border-border hover:bg-file-hover"
          >
            ▶️ Run Code
          </Button>
          <DeviceConnection />
        </div>
      </header>

      {/* Main Content - Account for fixed header */}
      <div className="flex flex-1 overflow-hidden pt-12 h-full">
        {/* File Explorer */}
        {!isExplorerCollapsed && (
          <div className="w-80 bg-sidebar-bg border-r border-border flex-shrink-0 h-full overflow-hidden relative">
            <FileExplorer />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExplorer}
              className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-8 p-0 bg-sidebar-bg border border-border rounded-md hover:bg-file-hover z-10"
            >
              <SidebarSimple size={12} className="rotate-180" />
            </Button>
          </div>
        )}
        
        {/* Collapsed Explorer Toggle */}
        {isExplorerCollapsed && (
          <div className="w-0 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExplorer}
              className="absolute top-1/2 left-0 transform -translate-y-1/2 w-6 h-8 p-0 bg-sidebar-bg border border-border rounded-r-md hover:bg-file-hover z-10"
            >
              <SidebarSimple size={12} />
            </Button>
          </div>
        )}

        {/* Code Editor Area */}
        <div className="flex-1 bg-editor min-w-0 flex flex-col h-full">
          <div className={`${isOutputVisible ? 'flex-[0.7]' : 'flex-1'} overflow-hidden`}>
            <CodeEditor />
          </div>
          {isOutputVisible && (
            <div className="flex-[0.3] border-t border-border overflow-hidden">
              <OutputPanel />
            </div>
          )}
        </div>

          {/* Right Panel - AI Assistant & Serial Monitor */}
          {isAIVisible && (
            <div className="w-96 border-l border-border flex flex-col">
              <div className="flex-1">
                <AIAssistant />
              </div>
              <div className="h-80 border-t border-border">
                <SerialMonitor />
              </div>
            </div>
          )}
      </div>
    </div>
  );
};