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
    saveFile 
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

  const handleRunCurrent = () => {
    toast({
      title: `Running ${activeTab}`,
      description: `Starting ${activeTab} project...`,
    });
  };

  const handleRunAll = () => {
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