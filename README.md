# HuggingFace Mirror on Cloudflare Workers

A reverse proxy to mirror HuggingFace models and datasets on Cloudflare Workers.

## Deployment

1.  Fork this repository.
2.  Get an API key from Cloudflare and set it as a secret named `CLOUDFLARE_API_TOKEN` in your repository.
3.  Change name in the `wrangler.toml` file to use your own name for the worker.
4.  [Optional] Add custom domain(s) to the workers.

### Variations

This repo provides two ways of proxy:
- **Basic (Default)**: Hostname that ends with `.hf.co` is excluded. All redirection response to `*.hf.co` will be returned as is.
- Proxy-All: All requests are proxied.
  - Traditional: Follow 302 Location to redirect LFS.
  - CAS-XET: Use CAS-XET reconstruction service to proxy LFS.

> [!CAUTION]
> Support of CAS-XET is experimental and likely to be troublesome.

### Environment Variables and Custom Domains

- **`PROXY_ALL_HOST`**: Switch between Basic and Proxy-All mode. Requiring custom domain `hf-proxy.<domain>`.
- **`USE_CAS_XET`**: When in Proxy-All mode, switch between Traditional and CAS-XET method for LFS proxy. Requiring custom domain `cas-xet.<domain>`.

See [`worker-configuration.d.ts`](worker-configuration.d.ts) for detailed descriptions.

> [!TIP]
>
> For example, if your custom domain is `https://your.domain`,
> the Proxy-All mode requires `https://hf-proxy.your.domain`,
> and the CAS-XET method requires `https://cas-xet.your.domain`.

## Usage

Just set environment variable `HF_ENDPOINT` to your domain, such as `https://your.domain`.

## Known Issues

### Content-Length headers

Huggingface clients expect `Content-Length` headers for all responses, including HEAD requests.
However, there is no way to set `Content-Length` headers in Cloudflare Workers as far as I know.
Nevertheless, the clients treat `X-Linked-Size` the same as `Content-Length`, so this project sets `X-Linked-Size` headers instead.

The other problem is the `Content-Length` header from upstream response.
It seems that Cloudflare Workers could not receive `Content-Length` headers from upstream responses.
This issue is particularly weird that it only happens in deployments, but not in online debugging environment.
As a workaround, this project receives the whole response body to calculate the content length, which may introduce performance overhead (but these files are usually very small).
For HEAD requests, the project makes a separate GET request to get the content length.

## [License](LICENSE)
Copyright 2024-2025 BrandonStudio.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this project except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
