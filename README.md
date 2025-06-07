# HuggingFace Mirror on Cloudflare Workers

A reverse proxy to mirror HuggingFace models and datasets on Cloudflare Workers.

## Deployment

1.  Fork this repository.
2.  Get an API key from Cloudflare and set it as a secret named `CLOUDFLARE_API_TOKEN` in your repository.
3.  Change name in the `wrangler.toml` file to use your own name for the worker.
4.  [Optional] Add custom domain(s) to the workers.

### Variations

This repo provides two ways of proxy:
- Basic (**Default**): Hostname that ends with `.hf.co` is excluded. All redirection response to `*.hf.co` will be returned as is.
- Proxy-All: All requests are proxied.

Use `PROXY_ALL_HOST` environment variable to switch between these two modes.

> \[!TIP]
>
> Proxy-All mode requires another custom domain `hf-proxy.<domain>`.
> For example, if your custom domain is `https://your.domain`, then you need to set up `https://hf-proxy.your.domain` as a custom domain in Cloudflare Workers.

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
