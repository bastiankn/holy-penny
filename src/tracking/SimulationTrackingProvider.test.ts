import { SimulationTrackingProvider } from './SimulationTrackingProvider';

it('does not restart a stopped simulation when its pending start resolves', async () => {
  const provider = new SimulationTrackingProvider();
  const starting = provider.start();
  provider.stop();
  await starting;
  expect(provider.getState()).toBe('STOPPED');
  expect(provider.getPose()).toBeNull();
});
