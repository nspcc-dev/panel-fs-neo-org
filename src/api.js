const rest_gw = import.meta.env.VITE_RESTGW ? import.meta.env.VITE_RESTGW : 'https://rest.t5.fs.neo.org/v1';

async function serverRequest(method, url, params, headers) {
	const json = {
		method,
		headers,
	}
	if (json['headers']['Content-Type']) {
		json['body'] = params;
	} else if (Object.keys(params).length > 0) {
		json['body'] = JSON.stringify(params);
		json['headers']['Content-Type'] = 'application/json';
	}
	let activeUrl = `${rest_gw}${url}`;
	if (url.indexOf('http') !== -1) {
		activeUrl = url;
	}
	return fetch(activeUrl, json).catch((error) => {
		console.log(error);
	});
}

export default function api(method, url, params = {}, headers = {}) {
	return new Promise((resolve, reject) => {
		serverRequest(method, url, params, headers).then(async (response) => {
			if (response && response.status === 204) {
				resolve({
					status: 'success'
				});
			} else {
				let res = response;
				if (method === 'GET' && url.indexOf(`/by_id/`) !== -1 && response.status === 200) {
					res = await response.blob();
					const header = response.headers.get('Content-Type');
					resolve({ header, res, status: response.status });
				} else if (method === 'HEAD' && url.indexOf(`/by_id/`) !== -1 && response.status === 200) {
					const attributes = response.headers.get('x-attributes') ? JSON.parse(response.headers.get('x-attributes')) : {};
					const res = {
						'containerId': response.headers.get('x-container-Id'),
						'objectId': response.headers.get('x-object-id'),
						'ownerId': response.headers.get('x-owner-Id'),
						'filename': attributes['FileName'],
						'attributes': attributes,
						'contentType': response.headers.get('Content-Type'),
						'objectSize': response.headers.get('Content-Length') ? response.headers.get('Content-Length') : response.headers.get('x-neofs-payload-length'),
					}
					resolve(res);
				} else if (method === 'HEAD') {
					resolve(response.status);
				} else if (response.status === 413) {
					reject('413 Request Entity Too Large');
				} else if (response) {
					try {
						res = await response.json();
						resolve(res);
					} catch (err) {
						resolve(err);
					}
				} else {
					reject(res);
				}
			}
		});
	});
}
