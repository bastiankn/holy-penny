import { SoundPlayer } from './sound';

describe('SoundPlayer', () => {
  const originalFetch = global.fetch;
  const originalAudioContext = (globalThis as unknown as Record<string, unknown>)['AudioContext'];

  afterEach(() => {
    if (originalFetch === undefined) {
      delete (global as unknown as Record<string, unknown>)['fetch'];
    } else {
      global.fetch = originalFetch;
    }
    const g = globalThis as unknown as Record<string, unknown>;
    if (originalAudioContext === undefined) {
      delete g['AudioContext'];
    } else {
      g['AudioContext'] = originalAudioContext;
    }
    jest.restoreAllMocks();
  });

  it('disabled player resolves silent without calling fetch', async () => {
    const player = new SoundPlayer();
    player.setEnabled(false);
    expect(player.isEnabled()).toBe(false);
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true } as Response)
    ) as unknown as typeof fetch;
    await expect(player.playCollect()).resolves.toBe('silent');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resolves silent when no AudioContext is available and fetch fails', async () => {
    const g = globalThis as unknown as Record<string, unknown>;
    delete g['AudioContext'];
    const w = window as unknown as Record<string, unknown>;
    delete w['AudioContext'];
    delete w['webkitAudioContext'];
    global.fetch = jest.fn(() => Promise.reject(new Error('no file'))) as unknown as typeof fetch;
    const player = new SoundPlayer();
    player.setEnabled(true);
    await expect(player.playCollect()).resolves.toBe('silent');
  });

  it('resolves webaudio when AudioContext is mocked and file fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('404'))) as unknown as typeof fetch;
    const mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 },
    };
    const mockGain = {
      connect: jest.fn(),
      gain: { value: 0 },
    };
    const mockContext = {
      destination: {},
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGain),
      close: jest.fn(() => Promise.resolve()),
    };
    const MockAudioContext = jest.fn(() => mockContext);
    (globalThis as unknown as Record<string, unknown>)['AudioContext'] = MockAudioContext;
    (window as unknown as Record<string, unknown>)['AudioContext'] = MockAudioContext;
    const player = new SoundPlayer();
    player.setEnabled(true);
    await expect(player.playCollect()).resolves.toBe('webaudio');
  });

  it('never rejects when fetch fails and no AudioContext exists', async () => {
    const g = globalThis as unknown as Record<string, unknown>;
    delete g['AudioContext'];
    const w = window as unknown as Record<string, unknown>;
    delete w['AudioContext'];
    delete w['webkitAudioContext'];
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('network down'))
    ) as unknown as typeof fetch;
    const player = new SoundPlayer();
    await expect(player.playCollect()).resolves.toBe('silent');
  });
});
