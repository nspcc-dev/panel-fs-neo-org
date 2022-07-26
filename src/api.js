const server = process.env.REACT_APP_SERVER;

async function serverRequest(method, url, params, headers) {
    const json = {
        method,
        headers,
    }
    if (Object.keys(params).length > 0) {
        json['body'] = JSON.stringify(params);
    }
    let activeUrl = `${server}${url}`;
    if (url.indexOf('http') !== -1) {
        activeUrl = url;
    }
    return fetch(activeUrl, json).catch((error) => {
        console.log(error);
    });
}

export default function api(method, url, params = {}, headers = {}) {
    return new Promise((resolve) => {
        serverRequest(method, url, params, headers).then(async (responce) => {
            if (responce && responce.status === 204) {
                resolve({ status: 'success' });
            } else {
                let res = responce;
                res = await responce.json();
                resolve(res);
            }
        });
    });
}
