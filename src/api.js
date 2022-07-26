const rest_gw = process.env.REACT_APP_RESTGW ? process.env.REACT_APP_RESTGW : 'https://rest.t5.fs.neo.org/v1';
const http_gw = process.env.REACT_APP_HTTPGW ? process.env.REACT_APP_HTTPGW : 'https://http.t5.fs.neo.org';

async function serverRequest(method, url, params, headers) {
	const json = {
		method,
		headers,
	}
	if (Object.keys(params).length > 0) {
		json['body'] = JSON.stringify(params);
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
				if (method === 'GET' && url.indexOf(`${http_gw}/get/`) !== -1) {
					res = await response.blob();
					const header = response.headers.get('Content-Type');
					resolve({ header, res });
				} else if (response) {
					res = await response.json();
					resolve(res);
				} else {
					reject(res);
				}
			}
		});
	});
}
