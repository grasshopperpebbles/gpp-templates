import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDotEnv, readDotEnvFile } from './dotenv';

describe('parseDotEnv', () => {
  it('reads plain, exported, quoted and commented lines', () => {
    const env = parseDotEnv(
      ['# top', 'A=1', 'export B=two', 'C="three # kept"', "D='four'", 'E=5   # note', '', 'junk', '1BAD=x'].join('\n'),
    );
    expect(env).toEqual({ A: '1', B: 'two', C: 'three # kept', D: 'four', E: '5' });
  });

  it('handles CRLF', () => {
    expect(parseDotEnv('A=1\r\nB=2\r\n')).toEqual({ A: '1', B: '2' });
  });
});

describe('readDotEnvFile', () => {
  it('reads a file and returns {} for a missing one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dotenv-'));
    writeFileSync(join(dir, '.env'), 'X=9\n');
    expect(readDotEnvFile(join(dir, '.env'))).toEqual({ X: '9' });
    expect(readDotEnvFile(join(dir, 'none'))).toEqual({});
  });
});
