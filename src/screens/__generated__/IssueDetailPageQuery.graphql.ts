/**
 * @generated SignedSource<<533945e61834cc411944bc7dcd9b815a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type IssueState = "CLOSED" | "OPEN" | "%future added value";
export type IssueStateReason = "COMPLETED" | "DUPLICATE" | "NOT_PLANNED" | "REOPENED" | "%future added value";
export type IssueDetailPageQuery$variables = {
  name: string;
  number: number;
  owner: string;
};
export type IssueDetailPageQuery$data = {
  readonly repository: {
    readonly issue: {
      readonly assignees: {
        readonly nodes: ReadonlyArray<{
          readonly avatarUrl: any;
          readonly id: string;
          readonly login: string;
        } | null | undefined> | null | undefined;
      };
      readonly author: {
        readonly avatarUrl: any;
        readonly login: string;
      } | null | undefined;
      readonly body: string;
      readonly closedAt: any | null | undefined;
      readonly comments: {
        readonly edges: ReadonlyArray<{
          readonly node: {
            readonly author: {
              readonly avatarUrl: any;
              readonly login: string;
            } | null | undefined;
            readonly body: string;
            readonly createdAt: any;
            readonly id: string;
          } | null | undefined;
        } | null | undefined> | null | undefined;
      };
      readonly createdAt: any;
      readonly id: string;
      readonly labels: {
        readonly nodes: ReadonlyArray<{
          readonly color: string;
          readonly id: string;
          readonly name: string;
        } | null | undefined> | null | undefined;
      } | null | undefined;
      readonly number: number;
      readonly state: IssueState;
      readonly stateReason: IssueStateReason | null | undefined;
      readonly title: string;
      readonly updatedAt: any;
      readonly url: any;
    } | null | undefined;
  } | null | undefined;
};
export type IssueDetailPageQuery = {
  response: IssueDetailPageQuery$data;
  variables: IssueDetailPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "name"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "number"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "owner"
},
v3 = [
  {
    "kind": "Variable",
    "name": "name",
    "variableName": "name"
  },
  {
    "kind": "Variable",
    "name": "owner",
    "variableName": "owner"
  }
],
v4 = [
  {
    "kind": "Variable",
    "name": "number",
    "variableName": "number"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "number",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "state",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "stateReason",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "closedAt",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "login",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "avatarUrl",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    (v15/*: any*/),
    (v16/*: any*/)
  ],
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 20
    }
  ],
  "concreteType": "LabelConnection",
  "kind": "LinkedField",
  "name": "labels",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Label",
      "kind": "LinkedField",
      "name": "nodes",
      "plural": true,
      "selections": [
        (v5/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "color",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": "labels(first:20)"
},
v19 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 10
    }
  ],
  "concreteType": "UserConnection",
  "kind": "LinkedField",
  "name": "assignees",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "nodes",
      "plural": true,
      "selections": [
        (v5/*: any*/),
        (v15/*: any*/),
        (v16/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": "assignees(first:10)"
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "endCursor",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasNextPage",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    (v20/*: any*/),
    (v15/*: any*/),
    (v16/*: any*/),
    {
      "kind": "InlineFragment",
      "selections": [
        (v5/*: any*/)
      ],
      "type": "Node",
      "abstractKey": "__isNode"
    }
  ],
  "storageKey": null
},
v24 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "IssueDetailPageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Repository",
        "kind": "LinkedField",
        "name": "repository",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v4/*: any*/),
            "concreteType": "Issue",
            "kind": "LinkedField",
            "name": "issue",
            "plural": false,
            "selections": [
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              {
                "alias": "comments",
                "args": null,
                "concreteType": "IssueCommentConnection",
                "kind": "LinkedField",
                "name": "__IssueDetailPage_comments_connection",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "IssueCommentEdge",
                    "kind": "LinkedField",
                    "name": "edges",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "IssueComment",
                        "kind": "LinkedField",
                        "name": "node",
                        "plural": false,
                        "selections": [
                          (v5/*: any*/),
                          (v8/*: any*/),
                          (v11/*: any*/),
                          (v17/*: any*/),
                          (v20/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v21/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v22/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "IssueDetailPageQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Repository",
        "kind": "LinkedField",
        "name": "repository",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v4/*: any*/),
            "concreteType": "Issue",
            "kind": "LinkedField",
            "name": "issue",
            "plural": false,
            "selections": [
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v23/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              {
                "alias": null,
                "args": (v24/*: any*/),
                "concreteType": "IssueCommentConnection",
                "kind": "LinkedField",
                "name": "comments",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "IssueCommentEdge",
                    "kind": "LinkedField",
                    "name": "edges",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "IssueComment",
                        "kind": "LinkedField",
                        "name": "node",
                        "plural": false,
                        "selections": [
                          (v5/*: any*/),
                          (v8/*: any*/),
                          (v11/*: any*/),
                          (v23/*: any*/),
                          (v20/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v21/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v22/*: any*/)
                ],
                "storageKey": "comments(first:50)"
              },
              {
                "alias": null,
                "args": (v24/*: any*/),
                "filters": null,
                "handle": "connection",
                "key": "IssueDetailPage_comments",
                "kind": "LinkedHandle",
                "name": "comments"
              }
            ],
            "storageKey": null
          },
          (v5/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "40dfff32ff1a93865fc70df242f1e738",
    "id": null,
    "metadata": {
      "connection": [
        {
          "count": null,
          "cursor": null,
          "direction": "forward",
          "path": [
            "repository",
            "issue",
            "comments"
          ]
        }
      ]
    },
    "name": "IssueDetailPageQuery",
    "operationKind": "query",
    "text": "query IssueDetailPageQuery(\n  $owner: String!\n  $name: String!\n  $number: Int!\n) {\n  repository(owner: $owner, name: $name) {\n    issue(number: $number) {\n      id\n      number\n      title\n      body\n      state\n      stateReason\n      createdAt\n      updatedAt\n      closedAt\n      url\n      author {\n        __typename\n        login\n        avatarUrl\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      labels(first: 20) {\n        nodes {\n          id\n          name\n          color\n        }\n      }\n      assignees(first: 10) {\n        nodes {\n          id\n          login\n          avatarUrl\n        }\n      }\n      comments(first: 50) {\n        edges {\n          node {\n            id\n            body\n            createdAt\n            author {\n              __typename\n              login\n              avatarUrl\n              ... on Node {\n                __isNode: __typename\n                id\n              }\n            }\n            __typename\n          }\n          cursor\n        }\n        pageInfo {\n          endCursor\n          hasNextPage\n        }\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "8a668d24d94c605c186a3c14dcc9336e";

export default node;
