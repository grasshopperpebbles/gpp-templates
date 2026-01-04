/**
 * Vite configuration for Strapi 5 admin panel
 * 
 * This config helps suppress warnings about Node.js modules being externalized
 * for browser compatibility. These warnings come from dependencies (source-map-js,
 * build tools) and don't affect functionality.
 * 
 * Note: Strapi 5 manages Vite internally, so this config may not be automatically
 * picked up. If warnings persist, they're harmless and come from dependencies.
 */
export default {
  // Suppress console warnings for externalized modules
  logLevel: 'warn',
  build: {
    rollupOptions: {
      // Suppress warnings for Node.js modules that are externalized
      onwarn(warning, warn) {
        // Ignore warnings about externalized Node.js modules
        const message = warning.message || '';
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          message.includes('has been externalized for browser compatibility') ||
          message.includes('source-map-js') ||
          message.includes('Cannot access') ||
          message.includes('url.fileURLToPath') ||
          message.includes('url.pathToFileURL') ||
          message.includes('fs.existsSync') ||
          message.includes('fs.readFileSync') ||
          message.includes('path.dirname') ||
          message.includes('path.join') ||
          message.includes('path.relative') ||
          message.includes('path.resolve') ||
          message.includes('path.sep') ||
          (warning.code === 'UNRESOLVED_IMPORT' && 
           (warning.source?.includes('url') || 
            warning.source?.includes('fs') || 
            warning.source?.includes('path') ||
            warning.source?.includes('source-map-js')))
        ) {
          // Suppress these warnings
          return;
        }
        // Use default warning handler for other warnings
        warn(warning);
      },
    },
  },
  // Define empty objects for Node.js globals to prevent errors
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  // Optimize dependencies to better handle Node.js modules
  optimizeDeps: {
    exclude: ['source-map-js'],
  },
  // Suppress warnings in the console
  customLogger: {
    warn: (msg) => {
      // Suppress specific warnings about externalized modules
      if (
        msg.includes('has been externalized for browser compatibility') ||
        msg.includes('source-map-js') ||
        msg.includes('Cannot access') ||
        msg.includes('url.fileURLToPath') ||
        msg.includes('url.pathToFileURL') ||
        msg.includes('fs.existsSync') ||
        msg.includes('fs.readFileSync') ||
        msg.includes('path.dirname') ||
        msg.includes('path.join') ||
        msg.includes('path.relative') ||
        msg.includes('path.resolve') ||
        msg.includes('path.sep')
      ) {
        return; // Suppress these warnings
      }
      console.warn(msg);
    },
  },
};

