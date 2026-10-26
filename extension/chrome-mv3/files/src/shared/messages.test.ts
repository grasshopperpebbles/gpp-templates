import { describe, expect, it } from 'vitest';
import { isAllowedSender, parseMessage } from './messages';

const ID = 'abcdefghijklmnopabcdefghijklmnop';

describe('parseMessage', () => {
  it('accepts known message types', () => {
    expect(parseMessage({ type: 'GET_STATUS' })).toEqual({ type: 'GET_STATUS' });
    expect(parseMessage({ type: 'DATA_CAPTURED', payload: { a: 1 } })).toEqual({
      type: 'DATA_CAPTURED',
      payload: { a: 1 },
    });
  });

  it('rejects anything else', () => {
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage('GET_STATUS')).toBeNull();
    expect(parseMessage({})).toBeNull();
    expect(parseMessage({ type: 'DELETE_ALL' })).toBeNull();
    expect(parseMessage({ type: 1 })).toBeNull();
  });
});

describe('isAllowedSender', () => {
  it('requires the sender to be this extension', () => {
    expect(isAllowedSender({ type: 'GET_STATUS' }, { id: ID }, ID)).toBe(true);
    expect(isAllowedSender({ type: 'GET_STATUS' }, { id: 'other' }, ID)).toBe(false);
    expect(isAllowedSender({ type: 'GET_STATUS' }, {}, ID)).toBe(false);
  });

  it('lets only extension pages change settings', () => {
    expect(isAllowedSender({ type: 'TOGGLE_ENABLED' }, { id: ID }, ID)).toBe(true);
    expect(isAllowedSender({ type: 'TOGGLE_ENABLED' }, { id: ID, tab: { id: 1 } }, ID)).toBe(false);
  });

  it('accepts captured data from content scripts', () => {
    expect(
      isAllowedSender({ type: 'DATA_CAPTURED', payload: {} }, { id: ID, tab: { id: 1 } }, ID)
    ).toBe(true);
  });
});
