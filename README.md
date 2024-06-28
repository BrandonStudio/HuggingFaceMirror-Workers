# HuggingFace Mirror on Cloudflare Workers

A reverse proxy to mirror HuggingFace models and datasets on Cloudflare Workers.

## Deployment

1.  Fork this repository.
2.  Get an API key from Cloudflare and set it as a secret named `CLOUDFLARE_API_TOKEN` in your repository.
3.  Change name in the `wrangler.toml` file to use your own name for the worker.
4.  Add 3 custom domains to the workers, one starts with `cdn-lfs`, one starts with `cdn-lfs-us-1`.

    3 domains would be like:
	- `your.domain`
	- `cdn-lfs.your.domain`
	- `cdn-lfs-us-1.your.domain`

## Usage

Just set environment variable `HF_ENDPOINT` to your custom domain, such as `https://your.domain`.

## License
[Apache License 2.0](LICENSE)
