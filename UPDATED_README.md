# 🚀 IoT IDE - Cross-Platform Desktop Development Environment

A modern, cross-platform IoT development environment built with **Electron + React**. Develop, debug, and deploy code to ESP32, Arduino, and other microcontrollers with ease.

## ✨ Features

- **🖥️ Desktop App**: Runs natively on Windows, macOS, and Linux
- **📁 Three-Panel Layout**: File Explorer | Code Editor | AI Assistant + Serial Monitor
- **🔌 Serial Communication**: Native USB/Serial support (Electron) + WebSerial (Browser)
- **🧠 AI Integration**: Built-in AI assistant for code generation and debugging
- **🔄 Auto-Connect**: Automatically detects and connects to devices
- **💾 Memory**: Remembers last connected device
- **📊 Real-time Monitoring**: Live serial data with export functionality

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 🚀 Running the Application

#### Web Mode (Browser)
```bash
npm run dev
# Opens http://localhost:5173
# Uses WebSerial API for device communication
```

#### Desktop Mode (Electron)
```bash
npm run electron:dev
# Launches Electron window
# Uses native serialport for device communication
```

### 📦 Building Installers

1. **Build React App**
   ```bash
   npm run build
   ```

2. **Generate Installers**
   ```bash
   npm run electron:build
   ```

   This creates installers in `dist-electron/`:
   - **Windows**: `.exe` installer
   - **macOS**: `.dmg` installer  
   - **Linux**: `.AppImage` file

## 🔧 Usage Guide

### Device Connection

1. **Auto-Connect**: Click "Auto" to automatically detect and connect to the first available device
2. **Manual Selection**: Choose a specific port from the dropdown and click "Connect"
3. **WebSerial (Browser)**: Uses browser's WebSerial API for device access

### Serial Monitor

- **Real-time Data**: View incoming data from your microcontroller
- **Send Commands**: Type commands and press Enter to send
- **History**: Use ↑ arrow key to recall last command
- **Export**: Download serial logs as text files
- **Auto-scroll**: Toggle automatic scrolling for new data

### AI Assistant

- **Context-Aware**: Understands your current code and project
- **Code Generation**: Generate MicroPython, C, and C++ code
- **Debugging Help**: Analyze errors and suggest fixes
- **Integration**: Apply AI suggestions directly to your code

## 📁 Project Structure

```
src/
├── utils/
│   └── serial.js              # Cross-platform serial utilities
├── components/
│   ├── DeviceConnection.tsx   # Device connection UI
│   ├── SerialMonitor.tsx      # Real-time serial monitor
│   ├── CodeEditor.tsx         # Monaco-based code editor
│   ├── FileExplorer.tsx       # Project file browser
│   └── AIAssistant.tsx        # AI helper panel
├── hooks/
│   ├── useElectronSerial.ts   # Electron serial integration
│   └── useDeviceSerial.ts     # WebSerial integration
└── stores/
    └── ideStore.ts            # Application state management
```

## 🔌 Serial API Reference

The `src/utils/serial.js` provides a unified interface for both Electron and Browser environments:

```javascript
import { serialManager } from '@/utils/serial';

// List available devices
const ports = await serialManager.listAvailablePorts();

// Auto-connect to first device
const success = await serialManager.autoConnectToDevice();

// Connect to specific device
await serialManager.connectToDevice('/dev/ttyUSB0');

// Send data
await serialManager.writeToDevice('print("Hello ESP32!")');

// Listen for data
serialManager.on('data', (data) => {
  console.log('Received:', data);
});
```

## 🚨 Troubleshooting

### Port Access Issues
- **Linux**: Add user to `dialout` group: `sudo usermod -a -G dialout $USER`
- **macOS**: Grant permissions in System Preferences > Security & Privacy
- **Windows**: Install device drivers for your microcontroller

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npm run electron:rebuild
```

### Serial Connection Problems
- Check baud rate (default: 115200)
- Ensure device is not in use by another application
- Try different USB cable/port
- Reset the microcontroller

## 🎯 Supported Devices

- **ESP32/ESP8266** (MicroPython, C++)
- **Arduino** (Uno, Nano, Mega, etc.)
- **STM32** microcontrollers
- **Raspberry Pi Pico**
- Any device with **USB-to-Serial** interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `ELECTRON_SETUP.md` for detailed setup
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions

---

Made with ❤️ for the IoT development community