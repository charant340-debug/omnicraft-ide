import React from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '../stores/ideStore';
import { X, Circle, Play, PlayCircle } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

export const CodeEditor: React.FC = () => {
  const { 
    openFiles, 
    activeFileId, 
    activeTab,
    setActiveFile, 
    closeFile, 
    updateFileContent, 
    saveFile,
    addOutputLog,
    toggleOutput
  } = useIDEStore();
  const { toast } = useToast();

  const activeFile = openFiles.find(f => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateFileContent(activeFileId, value);
    }
  };

  const handleSave = () => {
    if (activeFileId) {
      saveFile(activeFileId);
    }
  };

  const simulateCodeExecution = (code: string, language: string) => {
    // Extract print statements and simulate output
    const outputs: string[] = [];
    
    if (language === 'python') {
      const printMatches = code.match(/print\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/g);
      if (printMatches) {
        printMatches.forEach(match => {
          const content = match.match(/["'`]([^"'`]*)["'`]/);
          if (content && content[1]) {
            outputs.push(content[1]);
          }
        });
      }
    } else if (language === 'javascript' || language === 'typescript') {
      const consoleMatches = code.match(/console\.log\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/g);
      if (consoleMatches) {
        consoleMatches.forEach(match => {
          const content = match.match(/["'`]([^"'`]*)["'`]/);
          if (content && content[1]) {
            outputs.push(content[1]);
          }
        });
      }
    } else if (language === 'cpp' || language === 'c') {
      const coutMatches = code.match(/cout\s*<<\s*["']([^"']*)["']/g);
      if (coutMatches) {
        coutMatches.forEach(match => {
          const content = match.match(/["']([^"']*)["']/);
          if (content && content[1]) {
            outputs.push(content[1]);
          }
        });
      }
    }
    
    return outputs;
  };

  const simulateEmbeddedREPL = () => {
    // Simulate embedded device REPL interaction
    const replCommands = [
      { delay: 500, type: 'info', message: '>>> Connecting to device...' },
      { delay: 1000, type: 'success', message: 'MicroPython v1.20.0 on 2023-04-26; ESP32 module with ESP32' },
      { delay: 1200, type: 'info', message: 'Type "help()" for more information.' },
      { delay: 1400, type: 'info', message: '>>> ' },
    ];

    // Execute commands with delays
    replCommands.forEach(({ delay, type, message }) => {
      setTimeout(() => {
        addOutputLog(type as 'info' | 'error' | 'success', message);
      }, delay);
    });

    // Simulate running the actual code
    if (activeFile) {
      const outputs = simulateCodeExecution(activeFile.content, activeFile.language);
      
      setTimeout(() => {
        addOutputLog('info', '>>> exec(open("main.py").read())');
        
        if (outputs.length > 0) {
          outputs.forEach((output, index) => {
            setTimeout(() => {
              addOutputLog('info', output);
            }, 200 + (index * 100));
          });
        }
        
        // Simulate device-specific outputs
        setTimeout(() => {
          addOutputLog('success', 'LED blink pattern started');
          addOutputLog('info', 'Device ready for commands');
          addOutputLog('info', '>>> ');
        }, 500 + (outputs.length * 100));
        
      }, 2000);
    }
  };

  const handleRunCurrent = () => {
    if (!activeFile) return;
    
    // Show output panel first
    addOutputLog('info', `Starting ${activeTab} project...`);
    
    if (activeTab === 'embedded') {
      // Handle embedded device as REPL
      simulateEmbeddedREPL();
      toast({
        title: "Connecting to Device",
        description: "Establishing REPL connection...",
      });
    } else {
      // Handle frontend/backend normally
      setTimeout(() => {
        addOutputLog('success', `${activeTab} project started successfully on port ${activeTab === 'frontend' ? '3000' : '8000'}`);
        
        // Simulate code execution and show actual output
        const outputs = simulateCodeExecution(activeFile.content, activeFile.language);
        if (outputs.length > 0) {
          setTimeout(() => {
            addOutputLog('info', '--- Program Output ---');
            outputs.forEach(output => {
              addOutputLog('info', output);
            });
            addOutputLog('info', '--- End Output ---');
          }, 500);
        } else {
          setTimeout(() => {
            addOutputLog('info', 'Program executed successfully (no output)');
          }, 500);
        }
      }, 1000);

      toast({
        title: `Running ${activeTab}`,
        description: `Starting ${activeTab} project...`,
      });
    }
  };

  const handleRunAll = () => {
    addOutputLog('info', 'Starting all projects...');
    
    // Simulate running all projects
    setTimeout(() => {
      addOutputLog('success', 'Frontend started on port 3000');
    }, 500);
    setTimeout(() => {
      addOutputLog('success', 'Backend started on port 8000');
    }, 1000);
    setTimeout(() => {
      addOutputLog('info', '>>> Connecting to embedded device...');
      addOutputLog('success', 'MicroPython v1.20.0 on ESP32 module');
      addOutputLog('info', 'Device ready - REPL active');
      addOutputLog('info', '>>> ');
    }, 1500);

    toast({
      title: "Running All Projects",
      description: "Starting frontend, backend, and embedded projects...",
    });
  };

  // Handle Ctrl+S for save
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId]);

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-editor">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Files Open</h3>
          <p className="text-muted-foreground">Open a file from the explorer to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-editor">
      {/* Tabs */}
      <div className="bg-tab-inactive border-b border-border flex overflow-x-auto">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={`
              flex items-center space-x-2 px-4 py-2 border-r border-border cursor-pointer group
              ${file.id === activeFileId 
                ? 'bg-tab-active text-foreground' 
                : 'bg-tab-inactive text-muted-foreground hover:text-foreground hover:bg-file-hover'
              }
            `}
            onClick={() => setActiveFile(file.id)}
          >
            <Circle 
              size={8} 
              weight={file.isDirty ? 'fill' : 'bold'}
              className={file.isDirty ? 'text-warning' : 'text-muted-foreground'} 
            />
            <span className="text-sm select-none">{file.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 w-4 h-4 p-0 hover:bg-muted"
            >
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>

      {/* Run Controls */}
      <div className="bg-panel-bg border-b border-border flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleRunCurrent}
            className="flex items-center space-x-2"
          >
            <Play size={14} />
            <span>Run {activeTab}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunAll}
            className="flex items-center space-x-2"
          >
            <PlayCircle size={14} />
            <span>Run All</span>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {openFiles.length} file{openFiles.length !== 1 ? 's' : ''} open
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 w-full h-full">
        {activeFile && (
          <Editor
            height="100%"
            width="100%"
            defaultLanguage={activeFile.language}
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontFamily: 'var(--font-code)',
              fontSize: 14,
              lineHeight: 1.5,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              }
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      {activeFile && (
        <div className="h-6 bg-panel-bg border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{activeFile.language}</span>
            <span>{activeFile.path}</span>
          </div>
          <div className="flex items-center space-x-2">
            {activeFile.isDirty && <span className="text-warning">Unsaved</span>}
            <span>Ctrl+S to save</span>
          </div>
        </div>
      )}
    </div>
  );
};