import { describe, it, expect } from 'vitest';
import { formatForTreeView } from './handle';

describe('testTreeView', () => {
  it('display correct TreeView #1', () => {
    const objects = [{
      "attributes": { "FileName": "cat.jpg", "FilePath": "/root/id" },
      "objectId": "123",
    }, {
      "attributes": { "FileName": "cat.jpg" },
      "objectId": "456",
    }, {
      "attributes": { "FileName": "cat.jpg" },
      "objectId": "789",
    }, {
      "attributes": { "FileName": "01cat.jpg" },
      "objectId": "012",
    }];

    const tree = {
      "/": [{
        "attributes": { "FileName": "01cat.jpg" },
        "fileName": "01cat.jpg",
        "filePath": "",
        "fullName": "01cat.jpg",
        "name": "01cat.jpg",
        "objectId": "012",
      }, {
        "attributes": { "FileName": "cat.jpg" },
        "fileName": "cat.jpg",
        "filePath": "",
        "fullName": "cat.jpg",
        "name": "cat.jpg",
        "objectId": "456",
      }, {
        "attributes": { "FileName": "cat.jpg" },
        "fileName": "cat.jpg",
        "filePath": "",
        "fullName": "cat.jpg",
        "name": "cat.jpg",
        "objectId": "789",
      }],
      "root": {
        "/": [{
          "attributes": { "FileName": "cat.jpg", "FilePath": "/root/id" },
          "fileName": "cat.jpg",
          "filePath": "/root",
          "fullName": "/root/id",
          "name": "id",
          "objectId": "123",
        }]
      }
    };
    expect(formatForTreeView(objects)).toEqual(tree);
  });

  it('display correct TreeView #2', () => {
    const objects = [{
      "attributes": { "FileName": "cat.jpg", "FilePath": "my/folder/children//photos//photo2" },
      "objectId": "123",
    }, {
      "attributes": { "FileName": "", "FilePath": "345/ё\\ferkln/kmper/\\\\v////4345fk/-~s\\%<dp>20q\]%r" },
      "objectId": "456",
    }];

    const tree = {
      "345": {
        "/": [],
        "ё\\ferkln": {
          "/": [],
          "kmper": {
            "/": [],
            "\\v": {
              "/": [],
              "4345fk": {
                "/": [{
                  "attributes": { "FileName": "", "FilePath": "345/ё\\ferkln/kmper/\\\\v////4345fk/-~s\\%<dp>20q\]%r" },
                  "fileName": "",
                  "filePath": "345/ё\\ferkln/kmper/\\v/4345fk",
                  "fullName": "345/ё\\ferkln/kmper/\\v/4345fk/-~s\\%<dp>20q]%r",
                  "name": "-~s\\%<dp>20q]%r",
                  "objectId": "456",
                }]
              }
            }
          }
        }
      },
      "my": {
        "/": [],
        "folder": {
          "/": [],
          "children": {
            "/": [],
            "photos": {
              "/": [{
                "attributes": { "FileName": "cat.jpg", "FilePath": "my/folder/children//photos//photo2" },
                "fileName": "cat.jpg",
                "filePath": "my/folder/children/photos",
                "fullName": "my/folder/children/photos/photo2",
                "name": "photo2",
                "objectId": "123",
              }]
            }
          }
        }
      }
    };
    expect(formatForTreeView(objects)).toEqual(tree);
  });

  it('display correct TreeView #3', () => {
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

    const tree = {
      "/": [{
          "attributes": { "FileName": "cat.jpg", "FilePath": "/root/" },
          "fileName": "cat.jpg",
          "filePath": "",
          "fullName": "cat.jpg",
          "name": "cat.jpg",
          "objectId": "456",
        },
        {
          "attributes": { "FileName": "cat.jpg", "FilePath": "/root" },
          "fileName": "cat.jpg",
          "filePath": "",
          "fullName": "root",
          "name": "root",
          "objectId": "123",
        }
      ],
      "root": {
        "/": [{
            "attributes": { "FileName": "cat.jpg", "FilePath": "/root/obj.txt" },
            "fileName": "cat.jpg",
            "filePath": "/root",
            "fullName": "/root/obj.txt",
            "name": "obj.txt",
            "objectId": "012",
          },
          {
            "attributes": { "FileName": "cat.jpg", "FilePath": "/root/usr" },
            "fileName": "cat.jpg",
            "filePath": "/root",
            "fullName": "/root/usr",
            "name": "usr",
            "objectId": "789",
          }
        ]
      }
    };
    expect(formatForTreeView(objects)).toEqual(tree);
  });
})
