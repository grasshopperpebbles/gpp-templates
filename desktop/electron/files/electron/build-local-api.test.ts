import { describe, expect, it } from 'vitest';
import { localApiPath } from '../scripts/build-local-api.mjs';

describe('localApiPath', () => {
  it('is unset when the desktop env has no local API', () => {
    expect(localApiPath('/apps/desktop', 'VITE_API_BASE_URL=http://localhost:3001/api/v1\n')).toBeUndefined();
  });

  it('resolves the API directory from the desktop folder', () => {
    expect(localApiPath('/apps/desktop', 'GPP_LOCAL_API_DIR=../api\n')).toBe('/apps/api');
  });
});
