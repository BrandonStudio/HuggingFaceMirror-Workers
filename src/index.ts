/**
 * @license Apache-2.0
 *
 * Copyright 2024-2025 BrandonStudio.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { XetTokenResponse, CasXetReconstructionResponse } from "@/types/hf";

export const proxyPrefix = 'hf-proxy';
export const casXetProxyPrefix = 'cas-xet';
export const UpstreamHost = 'huggingface.co';
export const UpstreamHost2 = 'hf.co';

export const truthy = (v?: string) => {
  if (!v) return false;
  v = v.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

const badRequest = () => new Response('Bad Request', { status: 400 });
const forbidden = () => new Response('Forbidden', { status: 403 });

export default {
  async fetch(request, env, ctx): Promise<Response> {
    console.log(`Handling request ${request.method} ${request.url}`);

    const proxyAllHost = truthy(env.PROXY_ALL_HOST);

    const url = new URL(request.url);
    const hostname = url.hostname;
    const headers = new Headers(request.headers);

    const userAgent = headers.get('User-Agent')?.toLowerCase();
    // Handle bad bots
    if (
      userAgent
        ? !/(transformers|hf_hub)/.test(userAgent)
        : !proxyAllHost || (!hostname.startsWith(proxyPrefix) && !hostname.startsWith(casXetProxyPrefix)) || url.pathname !== '/'
    ) {
      console.info(`Bad user-agent: ${userAgent}.`)
      return forbidden();
    }

    let request_to_upstream: Request;
    if (hostname.startsWith(proxyPrefix)) {
      let location = url.searchParams.get('location');
      if (!location) {
        return badRequest();
      }

      try {
        location = decodeURIComponent(location);
        const location_url = new URL(location);
        if (!location_url.hostname.endsWith('.' + UpstreamHost) && !location_url.hostname.endsWith('.' + UpstreamHost2)) {
          // Only allow requests to huggingface.co and hf.co
          return forbidden();
        }
      } catch (e) {
        console.error(`Invalid location URL: ${location}`, e);
        return badRequest();
      }

      const response = await fetch(location, {
        headers,
        method: request.method,
        body: request.body ?? undefined,
        redirect: 'manual',
      });

      // Assume we don't need another redirection.
      return response;
    } else if (hostname.startsWith(casXetProxyPrefix)) {
      let location = url.searchParams.get('location');
      if (!location) {
        return badRequest();
      }

      try {
        location = decodeURIComponent(location);
        const location_url = new URL(location);
        if (!location_url.hostname.endsWith('.' + UpstreamHost) && !location_url.hostname.endsWith('.' + UpstreamHost2)) {
          // Only allow requests to huggingface.co and hf.co
          return forbidden();
        }
      } catch (e) {
        console.error(`Invalid location URL: ${location}`, e);
        return badRequest();
      }

      const response = await fetch(location, {
        headers,
        method: request.method,
        body: request.body ?? undefined,
      });

      if (response.ok) {
        const responseBody = await response.json<CasXetReconstructionResponse>();
        const modifiedBody = replaceCasXetReconstructionResponse(responseBody, hostname.substring(casXetProxyPrefix.length + 1));

        return new Response(JSON.stringify(modifiedBody), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } else {
        console.error(`Failed to fetch CAS XET reconstruction: ${response.status} ${response.statusText}`);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    } else {
      // Handle root requests

      let request_to_upstream_url = new URL(url);
      request_to_upstream_url.hostname = UpstreamHost;

      request_to_upstream = new Request(request_to_upstream_url, {
        redirect: 'manual', // Prevent auto re-execution
        headers: request.headers,
        method: request.method,
        body: request.body ?? undefined,
      });
      request_to_upstream.headers.set('Host', UpstreamHost);
      request_to_upstream.headers.set('Accept-Encoding', 'identity'); // Get Content-Length header

      const response = await fetch(request_to_upstream);

      if (response.status === 301 || response.status === 302) {
        // redirection to cdn-lfs
        const location = response.headers.get('Location');
        if (!location) {
          throw new Error('Redirection without Location header');
        }
        const location_url = new URL(location);
        const location_url_hostname = location_url.hostname;

        if (!proxyAllHost && location_url_hostname.endsWith('.' + UpstreamHost2)) {
          // Do not handle hf.co redirection. Redirect as is.
          return response;
        }

        const encoded_url = encodeURIComponent(location);
        const new_hostname = `${proxyPrefix}.${hostname}`;
        const new_url = `https://${new_hostname}/?location=${encoded_url}`;

        const headers = cloneHeaders(response.headers);
        headers.set('Location', new_url);
        if (headers.has('Link')) {
          if (truthy(env.USE_XET_TRANSFER)) {
            headers.set('Link', processLinkHeader(headers.get('Link')!, hostname));
          } else {
            headers.delete('Link');
          }
        }

        return new Response(response.body, { // Does not modify body, although original hostname is kept
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
      } else if (request_to_upstream_url.pathname.includes('/xet-read-token/')) {
        // special handling for xet-read-token, which returns a JSON response
        const tokenResponse = await response.json<XetTokenResponse>();
        const headers2 = cloneHeaders(response.headers);
        tokenResponse['casUrl'] = replaceCasXetUrl(tokenResponse['casUrl'], hostname);
        headers2.set('X-Xet-Cas-Url', replaceCasXetUrl(headers2.get('X-Xet-Cas-Url') || tokenResponse['casUrl'], hostname));
        headers2.set('Content-Type', 'application/json');
        headers2.delete('Content-Length');
        return new Response(JSON.stringify(tokenResponse), {
          status: response.status,
          statusText: response.statusText,
          headers: headers2,
        });
      } else {
        // normal response
        const responseBuffer = await response.arrayBuffer();
        const headers = cloneHeaders(response.headers);

        const l = response.headers.get('Content-Length');
        if (!headers.has('X-Linked-Size')) {
          // Use compatible X-Linked-Size header for transformers, in case Content-Length is missing.
          headers.set('X-Linked-Size', l || responseBuffer.byteLength.toString());
        }

        return new Response(responseBuffer, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
      }
    }
  },
} satisfies ExportedHandler<Env>;

export function cloneHeaders(originalHeaders: Headers) {
  let newHeaders = new Headers();
  for (const [key, value] of originalHeaders) {
    newHeaders.set(key, value);
  }
  return newHeaders;
}

export function replaceUrl1(url: string, hostname: string) {
  const parsedUrl = new URL(url);
  parsedUrl.hostname = hostname;
  return parsedUrl;
}

export function replaceUrl2(url: string, hostname: string) {
  const encodedUrl = encodeURIComponent(url);
  const newHostname = `${proxyPrefix}.${hostname}`;
  return `https://${newHostname}/?location=${encodedUrl}`;
}

export function replaceCasXetUrl(url: string, hostname: string) {
  const encodedUrl = encodeURIComponent(url);
  const newHostname = `${casXetProxyPrefix}.${hostname}`;
  return `https://${newHostname}/?location=${encodedUrl}`;
}

export function processLinkHeader(linkHeader: string, hostname: string) {
  const regex = /<(https?:\/\/[^>]+)>/g;
  return linkHeader.replace(regex, (match, url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === UpstreamHost) {
        return `<${replaceUrl1(url, hostname).href}>`;
      }
      if (parsedUrl.hostname.endsWith('.' + UpstreamHost2)) {
        return `<${replaceUrl2(url, hostname)}>`;
      } else {
        return match; // Do not modify
      }
    } catch (e) {
      console.error(`Invalid URL in Link header: ${url}`, e);
      return match; // Do not modify
    }
  });
}

export function replaceCasXetReconstructionResponse(
  response: CasXetReconstructionResponse,
  hostname: string,
): CasXetReconstructionResponse {
  for (const info of Object.values(response.fetch_info)) {
    for (const item of info) {
      item.url = replaceUrl2(item.url, hostname);
    }
  }
  return response;
}
