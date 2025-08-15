import React, { useState } from 'react';
import { useIDEStore, FileItem } from '../stores/ideStore';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Trash, 
  DotsThreeVertical,
  FileJs,
  FilePy,
  FileHtml,
  FileCss
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return FileJs;
    case 'py':
      return FilePy;
    case 'html':
      return FileHtml;
    case 'css':
      return FileCss;
    default:
      return File;
  }
};

interface FileTreeItemProps {
  item: FileItem;
  level: number;
  onSelect: (item: FileItem) => void;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
  item, 
  level, 
  onSelect, 
  expandedFolders, 
  toggleFolder 
}) => {
  const { activeTab, createFile, deleteFile, renameFile } = useIDEStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const isExpanded = expandedFolders.has(item.id);
  const IconComponent = item.type === 'folder' 
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(item.name);

  const handleClick = () => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else {
      onSelect(item);
    }
  };

  const handleRename = () => {
    renameFile(activeTab, item.id, newName);
    setIsRenaming(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    }
    if (e.key === 'Escape') {
      setNewName(item.name);
      setIsRenaming(false);
    }
  };

  return (
    <div>
      <div
        className="flex items-center space-x-2 px-2 py-1.5 hover:bg-file-hover cursor-pointer group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <IconComponent 
          size={16} 
          className={`${item.type === 'folder' ? 'text-accent' : 'text-muted-foreground'}`}
          onClick={handleClick}
        />
        
        {isRenaming ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-input text-foreground text-sm px-1 py-0.5 rounded border-0 focus:ring-1 focus:ring-primary"
            autoFocus
          />
        ) : (
          <span 
            className="flex-1 text-sm text-sidebar-foreground select-none"
            onClick={handleClick}
          >
            {item.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0 hover:bg-muted"
            >
              <DotsThreeVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {item.type === 'folder' && (
              <DropdownMenuItem onClick={() => createFile(activeTab, 'new-file.js', item.id)}>
                <Plus size={14} className="mr-2" />
                New File
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteFile(activeTab, item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const { activeTab, files, openFile, createFile } = useIDEStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['frontend-1']));

  // Filter files based on active tab
  const currentFiles = files[activeTab] || [];

  // Reset expanded folders when tab changes to avoid stale folder states
  React.useEffect(() => {
    setExpandedFolders(new Set());
  }, [activeTab]);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar-bg text-sidebar-foreground">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-sidebar-bg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sidebar-foreground capitalize">{activeTab} Files ({currentFiles.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createFile(activeTab, 'new-file.js')}
            className="w-6 h-6 p-0 hover:bg-file-hover"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {currentFiles.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-muted-foreground mb-2">No files in {activeTab}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createFile(activeTab, `new-file.${activeTab === 'embedded' ? 'py' : activeTab === 'backend' ? 'py' : 'tsx'}`)}
              className="border-border hover:bg-file-hover text-sidebar-foreground"
            >
              <Plus size={14} className="mr-2" />
              Create First File
            </Button>
          </div>
        ) : (
          currentFiles.map(item => (
            <FileTreeItem
              key={item.id}
              item={item}
              level={0}
              onSelect={openFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))
        )}
      </div>
    </div>
  );
};