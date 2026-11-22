import type { MenuItemConstructorOptions } from 'electron';

export interface MenuActions {
  openWebsite: () => void;
  reloadPage: () => void;
  showLogs: () => void;
}

/** The application menu: Electron's standard roles plus the host's own items. */
export function buildMenuTemplate(
  actions: MenuActions,
  platform: NodeJS.Platform,
  appName: string,
): MenuItemConstructorOptions[] {
  const mac = platform === 'darwin';
  return [
    ...(mac ? ([{ role: 'appMenu', label: appName }] as MenuItemConstructorOptions[]) : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open website in browser', click: actions.openWebsite },
        { label: 'Show logs', click: actions.showLogs },
        { type: 'separator' },
        mac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Reload page', accelerator: 'CmdOrCtrl+R', click: actions.reloadPage },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
}
