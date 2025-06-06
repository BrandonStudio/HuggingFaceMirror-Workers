const LfsPrefix = 'cdn-lfs';
const proxyPrefix = 'hf-proxy';
const UpstreamHost = 'huggingface.co';
const UpstreamHost2 = 'hf.co';

const badRequest = () => new Response('Bad Request', { status: 400 });
const forbidden = () => new Response('Forbidden', { status: 403 });

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request, env, ctx): Promise<Response> {
		const proxyAllHost = env.PROXY_ALL_HOST ? true : false;
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);
		const hostname = url.hostname;
		const headers = new Headers(request.headers);

		const userAgent = headers.get('User-Agent')?.toLowerCase();
		// Handle bad bots
		if (userAgent && !/transformers/.test(userAgent)) {
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
				body: request.body,
				redirect: 'manual',
			});

			// Assume we don't need another redirection.
			return response;

		/** @deprecated handler for *.hf.co is deprecated. */
		} else if (hostname.startsWith(LfsPrefix)) {
			// Handle lfs requests

			let cdn_prefix = hostname.split('.')[0];
			let upstream_hostname = `${cdn_prefix}.${UpstreamHost2}`;
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
				headers: headers,
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

				if (!proxyAllHost && location_url_hostname.endsWith('.' + UpstreamHost2)) {
					// Do not handle hf.co redirection. Redirect as is.
					return response;
				}

				const encoded_url = encodeURIComponent(location);
				const new_hostname = `${proxyPrefix}.${hostname}`;
				const new_url = `https://${new_hostname}/?location=${encoded_url}`;

				const headers = cloneHeaders(response.headers);
				headers.set('Location', new_url);

				return new Response(response.body, { // Does not modify body, although original hostname is kept
					status: response.status,
					statusText: response.statusText,
					headers: headers,
				});
			} else {
				// normal response
				const headers = cloneHeaders(response.headers);

				const l = response.headers.get('Content-Length');
				if (!headers.has('X-Linked-Size')) {
					headers.set('X-Linked-Size', l || '-1'); // Use compatible X-Linked-Size header for transformers, as Content-Length will be removed.
				}

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: headers,
				});
			}
		}
	},
} satisfies ExportedHandler<Env & Record<string, string | undefined>>;

function cloneHeaders(originalHeaders: Headers) {
	let newHeaders = new Headers();
	for (const [key, value] of originalHeaders) {
		newHeaders.set(key, value);
	}
	return newHeaders;
}
