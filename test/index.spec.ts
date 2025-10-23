import { env, createExecutionContext, waitOnExecutionContext, SELF, fetchMock } from 'cloudflare:test';
import { describe, it, expect, afterEach, beforeAll, beforeEach } from 'vitest';
import worker from '../src/index';
import { proxyPrefix, casXetProxyPrefix, UpstreamHost, UpstreamHost2 } from '../src/index';
import type { XetTokenResponse, CasXetReconstructionResponse } from '@/types/hf';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Tests with fetch-mock', () => {
  beforeAll(() => {
    // https://github.com/cloudflare/workers-sdk/blob/main/fixtures/vitest-pool-workers-examples/request-mocking/test/declarative.test.ts
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
  });

  describe('Request filtering', () => {
    it('should refuse bad user-agent', async () => {
      const request = new IncomingRequest('https://example.com', {
        headers: {
          'User-Agent': 'BadBot/1.0',
        },
      });
      // Create an empty context to pass to `worker.fetch()`.
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(403);
    });
  });

  describe('Proxy requests', () => {
    it('should refuse requests without location header', async () => {
      const request = new IncomingRequest(`https://${proxyPrefix}.example.com`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(400);
    });

    it('should refuse requests to non-huggingface.co', async () => {
      const request = new IncomingRequest(`https://${proxyPrefix}.example.com?location=${encodeURIComponent('https://example.com/model')}`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(403);
    });

    it('should proxy valid requests', async () => {
      const location = `https://cdn-lfs.${UpstreamHost2}/model`;
      const request = new IncomingRequest(`https://${proxyPrefix}.example.com?location=${encodeURIComponent(location)}`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });

      fetchMock
        .get(new URL(location).origin)
        .intercept({ path: '/model' })
        .reply(200, 'Upstream response', {
          headers: {
            'Custom-Header': 'custom-value',
          },
        });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      const headers = response.headers;
      expect(headers.get('Custom-Header')).toBe('custom-value');
      expect(await response.text()).toBe('Upstream response');
    });

    it('should modify cas-xet reconstructions responses', async () => {
      const location = `https://cas-server.xethub.${UpstreamHost2}/reconstructions/hash1`;
      const request = new IncomingRequest(`https://${casXetProxyPrefix}.example.com?location=${encodeURIComponent(location)}`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });

      const originalResponse: CasXetReconstructionResponse = {
        offset_into_first_range: 0,
        terms: [
          {
            hash: 'abc123',
            unpacked_length: 1024,
            range: {
              start: 0,
              end: 1023,
            },
          },
        ],
        fetch_info: {
          'abc123': [
            {
              range: {
                start: 0,
                end: 1023,
              },
              url: `https://transfer.xethub.${UpstreamHost2}/path/to/blob`,
              url_range: {
                start: 0,
                end: 1023,
              },
            },
          ],
        },
      };

      const expectedResponse: CasXetReconstructionResponse = {
        offset_into_first_range: 0,
        terms: [
          {
            hash: 'abc123',
            unpacked_length: 1024,
            range: {
              start: 0,
              end: 1023,
            },
          },
        ],
        fetch_info: {
          'abc123': [
            {
              range: {
                start: 0,
                end: 1023,
              },
              url: `https://${proxyPrefix}.example.com/?location=https%3A%2F%2Ftransfer.xethub.hf.co%2Fpath%2Fto%2Fblob`,
              url_range: {
                start: 0,
                end: 1023,
              },
            },
          ],
        },
      };

      fetchMock
        .get(new URL(location).origin)
        .intercept({ path: '/reconstructions/hash1' })
        .reply(200, originalResponse, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      const headers = response.headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      const json = await response.json<CasXetReconstructionResponse>();
      expect(json).toEqual(expectedResponse);
    });
  });

  describe('Root requests', () => {
    it('should return file with Content-Length and/or X-Linked-Size', async () => {
      const request = new IncomingRequest(`https://example.com/files/README.md`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });

      const fileUrl = `https://${UpstreamHost}/files/README.md`;

      fetchMock
        .get(new URL(fileUrl).origin)
        .intercept({ path: '/files/README.md' })
        .replyContentLength()
        .reply(200, 'This is a README file.', {
          headers: {
            'Custom-Header': 'custom-value',
          },
        });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      const headers = response.headers;
      expect(headers.get('Custom-Header')).toBe('custom-value');
      expect(await response.text()).toBe('This is a README file.');
      expect(headers.get('Content-Length')).toBe('22');
      expect(response.headers.get('X-Linked-Size')).toBe('22');
    });

    it('should handle xet-read-token requests', async () => {
      const request = new IncomingRequest(`https://example.com/path/xet-read-token/some-id`, {
        headers: {
          'User-Agent': 'transformers/4.30.0',
        },
      });

      const tokenUrl = `https://${UpstreamHost}/path/xet-read-token/some-id`;
      const casUrl = `https://cas-server.xethub.${UpstreamHost2}/some-path`;
      const expectedCasUrl = `https://${casXetProxyPrefix}.example.com/?location=${encodeURIComponent(casUrl)}`;

      fetchMock
        .get(new URL(tokenUrl).origin)
        .intercept({ path: '/path/xet-read-token/some-id' })
        .reply(200, {
          accessToken: 'some-token',
          casUrl: casUrl,
          exp: '124',
        } satisfies XetTokenResponse, {
          headers: {
            'Content-Type': 'application/json',
            'Custom-Header': 'custom-value',
            'X-Xet-Cas-Url': casUrl,
            'X-Xet-Token-Expiration': '124',
            'X-Xet-Access-Token': 'some-token',
          },
        });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      const headers = response.headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Custom-Header')).toBe('custom-value');
      expect(headers.get('X-Xet-Cas-Url')).toBe(expectedCasUrl);
      expect(headers.get('X-Xet-Token-Expiration')).toBe('124');
      expect(headers.get('X-Xet-Access-Token')).toBe('some-token');
      const json = await response.json() as XetTokenResponse;
      expect(json.accessToken).toBe('some-token');
      expect(json.casUrl).toBe(expectedCasUrl);
    });

    describe('Redirection handling', () => {
      it('should redirect as is if PROXY_ALL_HOST is false', async () => {
        const request = new IncomingRequest(`https://example.com/models/redirect-hf`, {
          headers: {
            'User-Agent': 'transformers/4.30.0',
          },
        });

        const redirectUrl = `https://cdn-lfs-1.${UpstreamHost2}/some-model`;

        fetchMock
          .get(new URL(`https://${UpstreamHost}/models/redirect-hf`).origin)
          .intercept({ path: '/models/redirect-hf' })
          .reply(302, '', {
            headers: {
              Location: redirectUrl,
              'Custom-Header': 'custom-value',
            },
          });

        const ctx = createExecutionContext();
        const response = await worker.fetch(request, {
          PROXY_ALL_HOST: '0',
        } as typeof env, ctx);
        await waitOnExecutionContext(ctx);
        expect(response.status).toBe(302);
        const headers = response.headers;
        expect(headers.get('Location')).toBe(redirectUrl);
        expect(headers.get('Custom-Header')).toBe('custom-value');
      });

      it('should redirect to proxy host if PROXY_ALL_HOST is true', async () => {
        const request = new IncomingRequest(`https://example.com/models/redirect-hf`, {
          headers: {
            'User-Agent': 'transformers/4.30.0',
          },
        });

        const redirectUrl = `https://cdn-lfs-1.${UpstreamHost2}/some-model`;

        fetchMock
          .get(new URL(`https://${UpstreamHost}/models/redirect-hf`).origin)
          .intercept({ path: '/models/redirect-hf' })
          .reply(302, '', {
            headers: {
              Location: redirectUrl,
              'Custom-Header': 'custom-value',
            },
          });

        const ctx = createExecutionContext();
        const response = await worker.fetch(request, {
          PROXY_ALL_HOST: '1',
        } as typeof env, ctx);
        await waitOnExecutionContext(ctx);
        expect(response.status).toBe(302);
        const headers = response.headers;
        const location = headers.get('Location');
        expect(location).toBe(`https://${proxyPrefix}.example.com/?location=${encodeURIComponent(redirectUrl)}`);
        expect(headers.get('Custom-Header')).toBe('custom-value');
      });

      describe('Link header handling', () => {
        const request = new IncomingRequest(`https://example.com/models/with-link-header`, {
          headers: {
            'User-Agent': 'transformers/4.30.0',
          },
        });

        const linkHeader = `<https://${UpstreamHost}/path/to/resource>; rel="next", <https://cdn-lfs.${UpstreamHost2}/file>; rel="file"`;

        beforeEach(() => {
          fetchMock
            .get(new URL(`https://${UpstreamHost}/models/with-link-header`).origin)
            .intercept({ path: '/models/with-link-header' })
            .reply(302, 'Response with Link header', {
              headers: {
                Link: linkHeader,
                Location: `https://${UpstreamHost}/path/to/resource`,
              },
            });
        });

        it('should remove Link header when USE_XET_TRANSFER is falsy', async () => {
          const ctx = createExecutionContext();
          const response = await worker.fetch(request, {
            PROXY_ALL_HOST: '1',
            USE_XET_TRANSFER: undefined,
          } as typeof env, ctx);
          await waitOnExecutionContext(ctx);
          expect(response.status).toBe(302);
          expect(await response.text()).toBe('Response with Link header');
          const link = response.headers.get('Link');
          expect(link).toBeNull();
        });

        it('should handle Link header when USE_XET_TRANSFER is truthy', async () => {
          const ctx = createExecutionContext();
          const response = await worker.fetch(request, {
            PROXY_ALL_HOST: '1',
            USE_XET_TRANSFER: '1',
          } as typeof env, ctx);
          await waitOnExecutionContext(ctx);
          expect(response.status).toBe(302);
          expect(await response.text()).toBe('Response with Link header');
          const link = response.headers.get('Link');
          expect(link).toBe(
            `<https://example.com/path/to/resource>; rel="next", ` +
            `<https://hf-proxy.example.com/?location=https%3A%2F%2Fcdn-lfs.hf.co%2Ffile>; rel="file"`
          );
        });
      });
    });
  });
});
