import { create } from 'zustand';

export type FileType = 'file' | 'folder';
export type ProjectTab = 'frontend' | 'backend' | 'embedded';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  children?: FileItem[];
  parent?: string;
  path: string;
}

export interface OpenFile {
  id: string;
  name: string;
  content: string;
  path: string;
  language: string;
  isDirty: boolean;
}

export interface IDEState {
  // Project structure
  activeTab: ProjectTab;
  files: Record<ProjectTab, FileItem[]>;
  
  // Editor state
  openFiles: OpenFile[];
  activeFileId: string | null;
  
  // UI state
  isExplorerCollapsed: boolean;
  isOutputVisible: boolean;
  outputLogs: Array<{ id: string; type: 'info' | 'error' | 'success'; message: string; timestamp: Date }>;
  
  // Device connection
  isDeviceConnected: boolean;
  deviceType: string | null;
  
  // AI assistant
  isAIVisible: boolean;
  aiMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  
  // Actions
  setActiveTab: (tab: ProjectTab) => void;
  openFile: (file: FileItem) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => void;
  createFile: (tab: ProjectTab, name: string, parent?: string) => void;
  deleteFile: (tab: ProjectTab, fileId: string) => void;
  renameFile: (tab: ProjectTab, fileId: string, newName: string) => void;
  toggleExplorer: () => void;
  toggleOutput: () => void;
  addOutputLog: (type: 'info' | 'error' | 'success', message: string) => void;
  clearOutputLogs: () => void;
  connectDevice: (deviceType: string) => void;
  disconnectDevice: () => void;
  toggleAI: () => void;
  addAIMessage: (role: 'user' | 'assistant', content: string) => void;
}

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'jsx': return 'javascript';
    case 'py': return 'python';
    case 'cpp': case 'c': return 'cpp';
    case 'ino': return 'cpp';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

// Mock initial file structure
const initialFiles: Record<ProjectTab, FileItem[]> = {
  frontend: [
    {
      id: 'frontend-1',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: 'frontend-2',
          name: 'App.tsx',
          type: 'file',
          content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;',
          path: '/src/App.tsx',
          parent: 'frontend-1'
        },
        {
          id: 'frontend-3',
          name: 'index.css',
          type: 'file',
          content: 'body {\n  margin: 0;\n  padding: 0;\n}',
          path: '/src/index.css',
          parent: 'frontend-1'
        }
      ]
    }
  ],
  backend: [
    {
      id: 'backend-1',
      name: 'server.py',
      type: 'file',
      content: 'from flask import Flask\n\napp = Flask(__name__)\n\n@app.route("/")\ndef hello():\n    return "Hello IoT!"\n\nif __name__ == "__main__":\n    app.run(debug=True)',
      path: '/server.py'
    },
    {
      id: 'backend-2',
      name: 'mqtt_handler.py',
      type: 'file',
      content: 'import paho.mqtt.client as mqtt\n\ndef on_connect(client, userdata, flags, rc):\n    print(f"Connected with result code {rc}")\n\nclient = mqtt.Client()\nclient.on_connect = on_connect',
      path: '/mqtt_handler.py'
    }
  ],
  embedded: [
    {
      id: 'embedded-1',
      name: 'main.py',
      type: 'file',
      content: 'import machine\nimport time\n\nled = machine.Pin(2, machine.Pin.OUT)\n\nwhile True:\n    led.on()\n    time.sleep(0.5)\n    led.off()\n    time.sleep(0.5)',
      path: '/main.py'
    },
    {
      id: 'embedded-2',
      name: 'boot.py',
      type: 'file',
      content: 'import network\n\nwlan = network.WLAN(network.STA_IF)\nwlan.active(True)\nwlan.connect("your_wifi", "password")',
      path: '/boot.py'
    }
  ]
};

export const useIDEStore = create<IDEState>((set, get) => ({
  // Initial state
  activeTab: 'frontend',
  files: initialFiles,
  openFiles: [],
  activeFileId: null,
  isExplorerCollapsed: false,
  isOutputVisible: false,
  outputLogs: [],
  isDeviceConnected: false,
  deviceType: null,
  isAIVisible: true,
  aiMessages: [],

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  openFile: (file) => {
    const { openFiles } = get();
    const existingFile = openFiles.find(f => f.id === file.id);
    
    if (!existingFile) {
      const newFile: OpenFile = {
        id: file.id,
        name: file.name,
        content: file.content || '',
        path: file.path,
        language: getLanguageFromFilename(file.name),
        isDirty: false
      };
      set({ 
        openFiles: [...openFiles, newFile],
        activeFileId: file.id
      });
    } else {
      set({ activeFileId: file.id });
    }
  },

  closeFile: (fileId) => {
    const { openFiles, activeFileId } = get();
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);
    const newActiveFileId = activeFileId === fileId 
      ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null)
      : activeFileId;
    
    set({ 
      openFiles: newOpenFiles,
      activeFileId: newActiveFileId
    });
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) => {
    const { openFiles } = get();
    const updatedFiles = openFiles.map(file => 
      file.id === fileId 
        ? { ...file, content, isDirty: true }
        : file
    );
    set({ openFiles: updatedFiles });
  },

  saveFile: (fileId) => {
    const { openFiles } = get();
    const updatedFiles = openFiles.map(file => 
      file.id === fileId 
        ? { ...file, isDirty: false }
        : file
    );
    set({ openFiles: updatedFiles });
  },

  createFile: (tab, name, parent) => {
    const { files } = get();
    const newFile: FileItem = {
      id: `${tab}-${Date.now()}`,
      name,
      type: 'file',
      content: '',
      path: parent ? `${parent}/${name}` : `/${name}`,
      parent
    };

    const updatedFiles = { ...files };
    if (parent) {
      // Add to parent folder
      const updateFolder = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === parent && item.type === 'folder') {
            return { ...item, children: [...(item.children || []), newFile] };
          }
          if (item.children) {
            return { ...item, children: updateFolder(item.children) };
          }
          return item;
        });
      };
      updatedFiles[tab] = updateFolder(files[tab]);
    } else {
      updatedFiles[tab] = [...files[tab], newFile];
    }

    set({ files: updatedFiles });
  },

  deleteFile: (tab, fileId) => {
    const { files } = get();
    const removeFile = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        if (item.id === fileId) return false;
        if (item.children) {
          item.children = removeFile(item.children);
        }
        return true;
      });
    };

    const updatedFiles = { ...files };
    updatedFiles[tab] = removeFile(files[tab]);
    set({ files: updatedFiles });
  },

  renameFile: (tab, fileId, newName) => {
    const { files } = get();
    const updateFile = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) {
          return { ...item, name: newName };
        }
        if (item.children) {
          return { ...item, children: updateFile(item.children) };
        }
        return item;
      });
    };

    const updatedFiles = { ...files };
    updatedFiles[tab] = updateFile(files[tab]);
    set({ files: updatedFiles });
  },

  toggleExplorer: () => set(state => ({ 
    isExplorerCollapsed: !state.isExplorerCollapsed 
  })),

  toggleOutput: () => set(state => ({ 
    isOutputVisible: !state.isOutputVisible 
  })),

  addOutputLog: (type, message) => {
    const { outputLogs } = get();
    const newLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    set({ outputLogs: [...outputLogs, newLog] });
  },

  clearOutputLogs: () => set({ outputLogs: [] }),

  connectDevice: (deviceType) => set({ 
    isDeviceConnected: true, 
    deviceType 
  }),

  disconnectDevice: () => set({ 
    isDeviceConnected: false, 
    deviceType: null 
  }),

  toggleAI: () => set(state => ({ 
    isAIVisible: !state.isAIVisible 
  })),

  addAIMessage: (role, content) => {
    const { aiMessages } = get();
    const newMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    set({ aiMessages: [...aiMessages, newMessage] });
  }
}));