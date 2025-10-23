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
