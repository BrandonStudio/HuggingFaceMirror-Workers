/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const LfsPrefix = 'cdn-lfs';
const UpstreamHost = 'huggingface.co';

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request, env, ctx): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);
		const hostname = url.hostname;
		const headers = new Headers(request.headers);

		// Handle bad bots
		if (/SemrushBot|MJ12bot/.test(headers.get('User-Agent') || '')) {
			return new Response('Forbidden', { status: 403 });
		}

		let request_to_upstream: Request;
		if (hostname.startsWith(LfsPrefix)) {
			// Handle lfs requests

			let cdn_prefix = hostname.split('.')[0];
			let upstream_hostname = `${cdn_prefix}.${UpstreamHost}`;
			let request_to_upstream_url = new URL(url);
			request_to_upstream_url.hostname = upstream_hostname;

			request_to_upstream = new Request(request_to_upstream_url, {
				headers: request.headers,
				method: request.method,
				body: request.body,
			});
			request_to_upstream.headers.set('Host', upstream_hostname);

			const response = await fetch(request_to_upstream);
			const headers = cloneHeaders(response.headers);
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: convertHeadersToObject(headers),
			});
		} else {
			// Handle root requests

			let request_to_upstream_url = new URL(url);
			request_to_upstream_url.hostname = UpstreamHost;

			request_to_upstream = new Request(request_to_upstream_url, {
				redirect: 'manual', // Prevent auto re-execution
				headers: request.headers,
				method: request.method,
				body: request.body,
			});
			request_to_upstream.headers.set('Host', UpstreamHost);
			request_to_upstream.headers.set('Accept-Encoding', 'identity'); // Get Content-Length header

			const response = await fetch(request_to_upstream);

			if (response.status === 301 || response.status === 302) {
				// redirection to cdn-lfs
				const location = response.headers.get('Location')!; // Location header should exists
				const location_url = new URL(location);
				const location_url_hostname = location_url.hostname;
				const cdn_prefix = location_url_hostname.split('.')[0];
				const new_hostname = `${cdn_prefix}.${hostname}`;
				location_url.hostname = new_hostname;

				const headers = cloneHeaders(response.headers);
				headers.set('Location', location_url.toString());

				return new Response(response.body, { // Does not modify body, although original hostname is kept
					status: response.status,
					statusText: response.statusText,
					headers: convertHeadersToObject(headers),
				});
			} else {
				// normal response
				const headers = cloneHeaders(response.headers);

				const l = response.headers.get('Content-Length');
				headers.set('X-Linked-Size', l || '-1'); // Use compatible X-Linked-Size header for transformers, as Content-Length will be removed.

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: convertHeadersToObject(headers),
				});
			}
		}
	},
} satisfies ExportedHandler<Env>;

function cloneHeaders(originalHeaders: Headers) {
	let newHeaders = new Headers();

	const exposableHeaders = originalHeaders.get('access-control-expose-headers');
	if (exposableHeaders) {
		for (const key of exposableHeaders.split(',')) {
			const value = originalHeaders.get(key);
			if (value) {
				newHeaders.set(key, value);
			}
		}
	} else {
		for (const [key, value] of originalHeaders) {
			newHeaders.set(key, value);
		}
	}
	return newHeaders;
}

function convertHeadersToObject(headers: Headers) {
	let headersObject: { [key: string]: string } = {};
	for (const [key, value] of headers) {
		headersObject[key] = value;
	}
	return headersObject;
}
