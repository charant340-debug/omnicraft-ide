# IoT IDE - Electron Desktop Setup Guide

This guide will help you set up the IoT IDE as a desktop application using Electron.

## Quick Start

Since `package.json` is read-only in this environment, you'll need to manually add the following scripts and configuration when you clone this project locally:

### 1. Update package.json

Add these scripts to your `package.json`:

```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "scripts": {
    "electron": "electron public/electron.js",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron public/electron.js\"",
    "electron-pack": "npm run build && electron-builder",
    "electron-dist": "npm run build && electron-builder --publish=never"
  }
}
```

### 2. Install Additional Dependencies

The following packages are already configured in the code but need to be added to your local package.json:

```bash
npm install electron electron-builder electron-reload serialport concurrently wait-on
```

### 3. Development Workflow

#### Web Development (Current)
```bash
npm run dev  # Runs on http://localhost:8080 with WebSerial API
```

#### Desktop Development (After Setup)
```bash
npm run electron-dev  # Runs Electron app with native serial port access
```

#### Build Desktop App
```bash
npm run electron-pack  # Creates installers for your platform
```

## What's Already Configured

### ✅ Electron Main Process
- `public/electron.js` - Complete Electron main process with IPC handlers
- `public/preload.js` - Secure IPC bridge for renderer process

### ✅ Serial Port Integration
- `src/hooks/useElectronSerial.ts` - Native Node.js serialport integration
- `src/components/DeviceConnection.tsx` - Updated to support both WebSerial and Electron
- `src/types/electron.d.ts` - TypeScript definitions for Electron APIs

### ✅ Build Configuration
- `electron-builder.config.js` - Multi-platform build configuration
- `build-resources/` - Directory for application icons

### ✅ Documentation
- `README-Electron.md` - Complete desktop app documentation

## Key Features

### Dual-Mode Support
The application automatically detects whether it's running in:
- **Browser Mode**: Uses WebSerial API (requires HTTPS/localhost)
- **Desktop Mode**: Uses native Node.js serialport (full system access)

### Native Serial Port Access
Unlike the WebSerial API, the desktop version provides:
- No permission dialogs
- Access to all system serial ports
- Better performance and reliability
- Works completely offline

### Cross-Platform Builds
Configured to build:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package (Intel + Apple Silicon)
- **Linux**: `.AppImage` executable

## Manual Setup Steps (Required Locally)

1. **Clone the project locally**
2. **Update package.json** with the scripts and main field above
3. **Install Electron dependencies**: `npm install electron electron-builder electron-reload serialport concurrently wait-on`
4. **Add application icons** to `build-resources/` folder
5. **Set environment variables** (copy `.env.example` to `.env`)
6. **Run development mode**: `npm run electron-dev`

## Environment Variables

Create a `.env` file with:
```bash
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

## Testing Both Modes

1. **Test Web Mode**: `npm run dev` (current functionality)
2. **Test Desktop Mode**: `npm run electron-dev` (after setup)

The UI will automatically adapt based on the environment and show different connection options.

## Build Distribution

After running `npm run electron-pack`, you'll find installers in:
- `dist-electron/` directory
- Platform-specific formats ready for distribution

## Support

For issues specific to Electron integration:
1. Check Node.js version compatibility (16+)
2. Verify serial port permissions on your OS
3. Review the electron-builder.config.js for platform-specific settings

The application maintains full backward compatibility - you can continue developing in browser mode while having desktop capabilities available.