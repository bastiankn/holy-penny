import { CameraSource } from './CameraSource';

describe('real CameraSource failure handling', () => {
  it('releases an acquired stream when video playback fails and allows a retry', async () => {
    const stop = jest.fn();
    const stream = { getTracks: () => [{ stop }] };
    const getUserMedia = jest.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const source = new CameraSource();
    const play = jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new Error('playback failed'))
      .mockResolvedValue();
    try {
      await expect(source.start()).rejects.toThrow('playback failed');
      expect(stop).toHaveBeenCalledTimes(1);
      expect(source.getStream()).toBeNull();
      expect(document.querySelector('video')).toBeNull();
      await expect(source.start()).resolves.toBe(stream);
      expect(source.isStreaming()).toBe(true);
    } finally {
      source.stop();
      play.mockRestore();
    }
  });
});
