import React from 'react';
import { useIDEStore, ProjectTab } from '../stores/ideStore';
import { Code, CloudArrowUp, Cpu } from '@phosphor-icons/react';

const tabs: { id: ProjectTab; label: string; icon: React.ElementType }[] = [
  { id: 'frontend', label: 'Frontend', icon: Code },
  { id: 'backend', label: 'Backend', icon: CloudArrowUp },
  { id: 'embedded', label: 'Embedded', icon: Cpu }
];

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useIDEStore();

  return (
    <div className="flex bg-tab-inactive rounded-lg p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${activeTab === id 
              ? 'bg-tab-active text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-file-hover'
            }
          `}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};