import { describe, it, expect } from 'vitest';
import { truthy, cloneHeaders, replaceUrl1, replaceUrl2, processLinkHeader } from '../src/index';

describe('Helper functions', () => {
  describe('truthy', () => {
    for (const val of ['true', '1', 'yes', 'TRUE', 'on', '1 ']) {
      it('should return true for ' + val, () => {
        expect(truthy(val)).toBe(true);
      });
    }
    for (const val of ['false', '0', 'no', 'FALSE', 'off', '0 ', '', ' ', undefined]) {
      it('should return false for ' + val, () => {
        expect(truthy(val)).toBe(false);
      });
    }
  });

  it('cloneHeaders should clone all headers correctly', () => {
    const original = new Headers();
    original.set('Content-Type', 'application/json');
    original.set('X-Custom-Header', 'test-value');

    const cloned = cloneHeaders(original);

    expect(cloned.get('Content-Type')).toBe('application/json');
    expect(cloned.get('X-Custom-Header')).toBe('test-value');
    expect([...cloned.keys()].length).toBe(2);
  });

  it('replaceUrl1 should replace the hostname in a URL', () => {
    const originalUrl = 'https://huggingface.co/path/to/resource';
    const newHostname = 'example.com';

    const result = replaceUrl1(originalUrl, newHostname);

    expect(result.hostname).toBe(newHostname);
    expect(result.pathname).toBe('/path/to/resource');
    expect(result.protocol).toBe('https:');
  });

  it('replaceUrl2 should create a proxy URL with the original URL as a parameter', () => {
    const originalUrl = 'https://cdn-lfs.huggingface.co/path/to/model';
    const hostname = 'example.com';

    const result = replaceUrl2(originalUrl, hostname);

    expect(result).toBe(`https://hf-proxy.example.com/?location=${encodeURIComponent(originalUrl)}`);
  });

  it('processLinkHeader should transform URLs in Link header', () => {
    const linkHeader = '<https://huggingface.co/path/to>; rel="next", <https://cdn-lfs.hf.co/file>; rel="file"';
    const hostname = 'example.com';

    const result = processLinkHeader(linkHeader, hostname);

    // expect(result).toContain('example.com');
    // expect(result).toContain(`hf-proxy.${hostname}`);
    // expect(result).not.toContain('huggingface.co');
    expect(result).toBe(
      '<https://example.com/path/to>; rel="next", ' +
      '<https://hf-proxy.example.com/?location=https%3A%2F%2Fcdn-lfs.hf.co%2Ffile>; rel="file"'
    );
  });
});
