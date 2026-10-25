// IPC channel names. Duplicated in electron/preload.cts, because a sandboxed preload can't import
// local files; channels.test.ts checks the two match.
export const CHANNELS = {
  appGetVersion: 'app:getVersion',
  appGetPath: 'app:getPath',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsReset: 'settings:reset',
  settingsDelete: 'settings:delete',
} as const;
