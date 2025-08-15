import React from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { OutputPanel } from './OutputPanel';
import { AIAssistant } from './AIAssistant';
import { TabBar } from './TabBar';
import { DeviceConnection } from './DeviceConnection';
import { useIDEStore } from '../stores/ideStore';
import { Robot, Sparkle, SidebarSimple, Terminal } from '@phosphor-icons/react';
import { Button } from './ui/button';

export const IDELayout: React.FC = () => {
  const { 
    isAIVisible, 
    isExplorerCollapsed, 
    isOutputVisible, 
    toggleAI, 
    toggleExplorer, 
    toggleOutput,
    testAI 
  } = useIDEStore();

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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExplorer}
            className="border-border hover:bg-file-hover"
          >
            <SidebarSimple size={16} className="mr-2" />
            {isExplorerCollapsed ? 'Show' : 'Hide'} Explorer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleOutput}
            className="border-border hover:bg-file-hover"
          >
            <Terminal size={16} className="mr-2" />
            {isOutputVisible ? 'Hide' : 'Show'} Output
          </Button>
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
          <DeviceConnection />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        {!isExplorerCollapsed && (
          <div className="w-80 bg-sidebar-bg border-r border-border flex-shrink-0">
            <FileExplorer />
          </div>
        )}

        {/* Code Editor Area */}
        <div className="flex-1 bg-editor min-w-0 flex flex-col">
          <div className="flex-1">
            <CodeEditor />
          </div>
          <OutputPanel />
        </div>

        {/* AI Assistant */}
        {isAIVisible && (
          <div className="w-96 bg-panel-bg border-l border-border flex-shrink-0">
            <AIAssistant />
          </div>
        )}
      </div>
    </div>
  );
};