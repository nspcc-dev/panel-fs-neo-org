import { formatForTreeView } from './handle';

describe('testTreeView', () => {
  it('display correct TreeView #1', () => {
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
    }, {
      "address": { "containerId": "123", "objectId": "456" }
    }];

    const tree = {
      "/": [{
        "address": { "containerId": "123", "objectId": "456" },
        "filePath": "",
        "fullName": "456",
        "name": "456",
      }, {
        "address": { "containerId": "123", "objectId": "456" },
        "filePath": "",
        "fullName": "cat.jpg",
        "name": "cat.jpg",
      }, {
        "address": { "containerId": "789", "objectId": "012" },
        "filePath": "",
        "fullName": "cat.jpg",
        "name": "cat.jpg",
      }],
      "root": {
        "/": [{
          "address": { "containerId": "123", "objectId": "456" },
          "filePath": "/root",
          "fullName": "/root/id",
          "name": "id",
        }]
      }
    };
    expect(formatForTreeView(objects)).toEqual(tree);
  });

  it('display correct TreeView #2', () => {
    const objects = [{
      "address": { "containerId": "123", "objectId": "456" },
      "name": "cat.jpg",
      "filePath": "my/folder/children//photos//photo2",
    }, {
      "address": { "containerId": "789", "objectId": "012" },
      "filePath": "345/ё\\ferkln/kmper/\\\\v////4345fk/-~s\\%<dp>20q\]%r",
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
                  "address": {
                    "containerId": "789",
                    "objectId": "012"
                  },
                  "filePath": "345/ё\\ferkln/kmper/\\v/4345fk",
                  "fullName": "345/ё\\ferkln/kmper/\\v/4345fk/-~s\\%<dp>20q]%r",
                  "name": "-~s\\%<dp>20q]%r"
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
                "address": {
                  "containerId": "123",
                  "objectId": "456"
                },
                "filePath": "my/folder/children/photos",
                "fullName": "my/folder/children/photos/photo2",
                "name": "photo2"
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

    const tree = {
      "/": [{
          "address": {
            "containerId": "789",
            "objectId": "012"
          },
          "filePath": "",
          "fullName": "cat.jpg",
          "name": "cat.jpg"
        },
        {
          "address": {
            "containerId": "123",
            "objectId": "456"
          },
          "filePath": "",
          "fullName": "root",
          "name": "root"
        }
      ],
      "root": {
        "/": [{
            "address": {
              "containerId": "901",
              "objectId": "234"
            },
            "filePath": "/root",
            "fullName": "/root/obj.txt",
            "name": "obj.txt"
          },
          {
            "address": {
              "containerId": "345",
              "objectId": "678"
            },
            "filePath": "/root",
            "fullName": "/root/usr",
            "name": "usr"
          }
        ]
      }
    };
    expect(formatForTreeView(objects)).toEqual(tree);
  });
})
