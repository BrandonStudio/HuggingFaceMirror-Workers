// MSW (Mock Service Worker) is used to intercept and mock outbound HTTP fetch
// requests made by the Worker during tests, replacing the fetchMock API that
// was removed in @cloudflare/vitest-pool-workers v0.13.
// See: https://mswjs.io/ and https://developers.cloudflare.com/workers/testing/vitest-integration/
import { setupServer } from 'msw/node';

export const server = setupServer();
