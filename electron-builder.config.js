module.exports = {
  appId: 'com.iotide.app',
  productName: 'IoT IDE',
  directories: {
    output: 'dist-electron',
    buildResources: 'build-resources'
  },
  files: [
    'build/**/*',
    'public/electron.js',
    'public/preload.js',
    'node_modules/**/*'
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build-resources/icon.icns'
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.ico'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.png',
    category: 'Development'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  publish: null
};