import TreeView from './TreeView';
import { formatForTreeView } from '../../Functions/handle';
import { cleanup, render } from '@testing-library/react';

afterEach(cleanup);

function getAllFolders(obj) {
  return Object.entries(obj).reduce((r, [k, v]) => {
    if (k !== '/') {
      r.push(k, ...getAllFolders(v));
    }
    return r;
  }, []);
};

function getAllFileNames(obj) {
  return Object.entries(obj).reduce((r, [k, v]) => {
    if (k === '/') {
      for (let i = 0; i < v.length; i += 1) {
        r.push(v[i].name);
      }
      r.push(...getAllFileNames(v));
    } else if (typeof v === 'object') {
      r.push(...getAllFileNames(v));
    }
    return r;
  }, []);
};

describe('testTreeView', () => {
  it('DOM display correct TreeView #1', () => {
    const objects = [{
      "address": { "containerId": "123", "objectId": "456" },
      "name": "cat.jpg",
      "filePath": "/root/id",
    }, {
      "address": { "containerId": "123", "objectId": "456" },
      "name": "cat.jpg",
    }, {
      "address": { "containerId": "789", "objectId": "012" },
      "name": "cat.jpg",
    }];
    const objectsTreeView = formatForTreeView(objects);
    const { container, queryAllByText } = render(<TreeView objects={objectsTreeView} />);
    expect(container.querySelectorAll('div.file--label').length).toBe(objects.length);

    const folders = getAllFolders(objectsTreeView);
    for (let i = 0; i < folders.length; i += 1) {
      expect(queryAllByText(folders[i]));
    }

    const fileNames = getAllFileNames(objectsTreeView);
    for (let i = 0; i < fileNames.length; i += 1) {
      expect(queryAllByText(fileNames[i]));
    }
  });
});

describe('testTreeView', () => {
  it('DOM display correct TreeView #2', () => {
    const objects = [{
      "address": { "containerId": "123", "objectId": "456" },
      "name": "cat.jpg",
      "filePath": "my/folder/children//photos//photo2",
    }, {
      "address": { "containerId": "789", "objectId": "012" },
      "filePath": "345/ё\\ferkln/kmper/\\\\v////4345fk/-~s\\%<dp>20q\]%r",
    }];
    const objectsTreeView = formatForTreeView(objects);
    const { container, queryAllByText } = render(<TreeView objects={objectsTreeView} />);
    expect(container.querySelectorAll('div.file--label').length).toBe(objects.length);

    const folders = getAllFolders(objectsTreeView);
    for (let i = 0; i < folders.length; i += 1) {
      expect(queryAllByText(folders[i]));
    }

    const fileNames = getAllFileNames(objectsTreeView);
    for (let i = 0; i < fileNames.length; i += 1) {
      expect(queryAllByText(fileNames[i]));
    }
  });
});

describe('testTreeView', () => {
  it('DOM display correct TreeView #3', () => {
    const objects = [{
      "address": { "containerId": "123", "objectId": "456" },
      "name": "cat.jpg",
      "filePath": "/root",
    }, {
      "address": { "containerId": "789", "objectId": "012" },
      "name": "cat.jpg",
      "filePath": "/root/",
    }, {
      "address": { "containerId": "345", "objectId": "678" },
      "name": "cat.jpg",
      "filePath": "/root/usr",
    }, {
      "address": { "containerId": "901", "objectId": "234" },
      "name": "cat.jpg",
      "filePath": "/root/obj.txt",
    }];
    const objectsTreeView = formatForTreeView(objects);
    const { container, queryAllByText } = render(<TreeView objects={objectsTreeView} />);
    expect(container.querySelectorAll('div.file--label').length).toBe(objects.length);

    const folders = getAllFolders(objectsTreeView);
    for (let i = 0; i < folders.length; i += 1) {
      expect(queryAllByText(folders[i]));
    }

    const fileNames = getAllFileNames(objectsTreeView);
    for (let i = 0; i < fileNames.length; i += 1) {
      expect(queryAllByText(fileNames[i]));
    }
  });
});
