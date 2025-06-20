import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import TreeView from './TreeView';
import { formatForTreeView } from '../../Functions/handle';

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
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root/id" },
      "objectId": "123",
    }, {
      "attributes": { "FileName": "cat.jpg" },
      "objectId": "456",
    }, {
      "attributes": { "FileName": "cat.jpg" },
      "objectId": "789",
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
      "attributes": { "FileName": "cat.jpg", "FilePath": "my/folder/children//photos//photo2" },
      "objectId": "123",
    }, {
      "attributes": { "FileName": "", "FilePath": "345/ё\\ferkln/kmper/\\\\v////4345fk/-~s\\%<dp>20q\]%r" },
      "objectId": "456",
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
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root" },
      "objectId": "123",
    }, {
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root/" },
      "objectId": "456",
    }, {
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root/usr" },
      "objectId": "789",
    }, {
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root/obj.txt" },
      "objectId": "012",
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
