declare global {
  interface Window {
    electronAPI: {
      serial: {
        listPorts: () => Promise<Array<{
          path: string;
          manufacturer?: string;
          serialNumber?: string;
          pnpId?: string;
          locationId?: string;
          productId?: string;
          vendorId?: string;
        }>>;
        connect: (portPath: string, baudRate: number) => Promise<{
          success: boolean;
          port: string;
          baudRate: number;
        }>;
        disconnect: () => Promise<{ success: boolean }>;
        sendData: (data: string) => Promise<{ success: boolean }>;
        isConnected: () => Promise<boolean>;
        onDataReceived: (callback: (data: string) => void) => void;
        onError: (callback: (error: string) => void) => void;
        onDisconnected: (callback: () => void) => void;
        removeAllListeners: (channel: string) => void;
      };
      fs: {
        showOpenDialog: () => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      platform: string;
      isElectron: boolean;
    };
  }
}

export {};