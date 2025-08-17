# IoT IDE - Desktop Application

A desktop IoT development environment built with Electron + React, featuring device connectivity, AI assistance, and code editing capabilities.

## Features

- **Three-Panel Layout**: File Explorer, Tabbed Code Editor, and AI Assistant
- **Device Connectivity**: ESP32/Arduino support via USB/Serial using native Node.js serialport
- **AI Integration**: OpenAI-powered code assistance and debugging
- **Cross-Platform**: Windows (.exe), macOS (.dmg), and Linux (.AppImage) installers
- **Live Development**: Hot reload for both React and Electron components

## Development Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd iot-ide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

### Development Workflow

#### React Development (Web Mode)
```bash
npm run dev
# Opens http://localhost:8080
# Uses WebSerial API for device connectivity
```

#### Electron Development (Desktop Mode) 
```bash
npm run electron-dev
# Starts React dev server + Electron app
# Uses native serialport for device connectivity
# Hot reload enabled for both React and Electron
```

#### Production Build
```bash
npm run build
# Builds React app for production
```

#### Create Installers
```bash
npm run electron-pack
# Creates platform-specific installers in dist-electron/
```

#### Development Only Build
```bash
npm run electron-dist  
# Creates installers without publishing
```

## Project Structure

```
├── public/
│   ├── electron.js          # Main Electron process
│   ├── preload.js           # IPC bridge script
│   └── favicon.ico
├── src/
│   ├── components/          # React components
│   ├── hooks/
│   │   ├── useDeviceSerial.ts      # WebSerial API (browser)
│   │   └── useElectronSerial.ts    # Node serialport (Electron)
│   ├── types/
│   │   └── electron.d.ts    # TypeScript definitions
│   └── ...
├── electron-builder.config.js  # Build configuration
└── package.json
```

## Device Connectivity

### Browser Mode (WebSerial API)
- Modern browsers with WebSerial API support
- User grants permission to access serial ports
- Limited to HTTPS or localhost

### Desktop Mode (Node.js serialport)
- Full access to system serial ports
- No permission dialogs needed
- Works offline
- Better performance and reliability

## Build Configuration

### Electron Builder Config (`electron-builder.config.js`)

The app builds for multiple platforms:

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg) - supports both Intel and Apple Silicon
- **Linux**: AppImage (.AppImage)

### Build Resources

Place icons in `build-resources/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS) 
- `icon.png` (Linux)

## Environment Variables

### Development (.env)
```bash
OPENAI_API_KEY=your_api_key_here
NODE_ENV=development
```

### Production
Set environment variables in your CI/CD or build environment.

## Troubleshooting

### Common Issues

1. **Electron app won't start**
   - Check that React dev server is running on port 8080
   - Verify Node.js version compatibility

2. **Serial port access denied**
   - On Linux: Add user to dialout group: `sudo usermod -a -G dialout $USER`
   - On macOS: Grant security permissions in System Preferences

3. **Build failures**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Electron and Node.js version compatibility

4. **IPC communication errors**
   - Verify preload.js is loaded correctly
   - Check contextIsolation and nodeIntegration settings

### Development Tips

- Use Chrome DevTools in Electron for debugging React components
- Main process logs appear in terminal running `electron-dev`
- Renderer process logs appear in Electron DevTools console

## Deployment

### Manual Distribution
After running `npm run electron-pack`, distributable files are in `dist-electron/`:
- Upload installers to your website or distribution platform

### Automatic Updates (Optional)
Configure electron-updater for automatic updates:
1. Set up a release server
2. Configure update server in electron-builder config
3. Implement update logic in main process

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test in both browser and Electron modes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.