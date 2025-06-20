
export function formatForTreeView(objects) {
	for (let i = 0; i < objects.length; i++) {
		objects[i].fileName = objects[i].attributes.FileName ? objects[i].attributes.FileName : '';
		objects[i].filePath = objects[i].attributes.FilePath ? objects[i].attributes.FilePath : '';
	}

	const getTreeView = (objectsList) => {
		return objectsList.reduce((root, item) => {
			const path = item.filePath || '';
			const parts = path.split('/').filter(Boolean);
			let current = root;

			for (const part of parts) {
				if (!current[part]) {
					current[part] = {};
				}
				if (!current[part]['/']) {
					current[part]['/'] = [];
				}
				current = current[part];
			}

			if (!current['/']) {
				current['/'] = [];
			}
			current['/'].push(item);

			return root;
		}, {});
	};

	for (let i = 0; i < objects.length; i++) {
		const path = objects[i].filePath.replace(/\/+/g, '/').replace(/\\\\/g, '\\').split('/');
		if (path[path.length - 1] === '') {
			objects[i].filePath = '';
		} else {
			objects[i].name = path[path.length - 1]
			objects[i].filePath = path.slice(0, path.length - 1).join('/');
		}

		if (!objects[i].name) {
			objects[i].name =  objects[i].attributes.FileName ? objects[i].attributes.FileName : objects[i].objectId;
		}

		objects[i].fullName = `${objects[i].filePath ? `${objects[i].filePath.trim()}/` : ''}${objects[i].name.trim()}`;
	}

	objects.sort((a, b) => {
		if (a.fullName < b.fullName) {
			return -1;
		}

		if (a.fullName > b.fullName) {
			return 1;
		}

		return 0;
	});
	return getTreeView(objects);
}

export function formatForContainerName(attributes, containerId) {
	if (attributes.length > 0) {
		const pos = attributes.map((item) => item.key).indexOf('Name');
		if (pos !== -1) {
			return attributes[pos].value;
		}
	}
	return containerId;
}

export function formatBytes(bytes) {
	const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	let i = 0
	for (i; bytes >= 1024; i += 1) {
		bytes /= 1024;
	}
	return `${bytes === 0 ? bytes : bytes.toFixed(1)} ${units[i]}`;
}
