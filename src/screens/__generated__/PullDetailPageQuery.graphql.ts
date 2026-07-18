/**
 * @generated SignedSource<<f6da484d65a659eebd5f1d2d6b1f11b5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DiffSide = "LEFT" | "RIGHT" | "%future added value";
export type MergeableState = "CONFLICTING" | "MERGEABLE" | "UNKNOWN" | "%future added value";
export type PullRequestReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | "%future added value";
export type PullRequestState = "CLOSED" | "MERGED" | "OPEN" | "%future added value";
export type PullDetailPageQuery$variables = {
  name: string;
  number: number;
  owner: string;
};
export type PullDetailPageQuery$data = {
  readonly repository: {
    readonly pullRequest: {
      readonly author: {
        readonly login: string;
      } | null | undefined;
      readonly baseRefName: string;
      readonly body: string;
      readonly comments: {
        readonly nodes: ReadonlyArray<{
          readonly author: {
            readonly login: string;
          } | null | undefined;
          readonly body: string;
          readonly createdAt: any;
          readonly id: string;
        } | null | undefined> | null | undefined;
      };
      readonly createdAt: any;
      readonly headRefName: string;
      readonly id: string;
      readonly isDraft: boolean;
      readonly mergeable: MergeableState;
      readonly merged: boolean;
      readonly number: number;
      readonly reviewThreads: {
        readonly nodes: ReadonlyArray<{
          readonly comments: {
            readonly nodes: ReadonlyArray<{
              readonly author: {
                readonly login: string;
              } | null | undefined;
              readonly body: string;
              readonly id: string;
            } | null | undefined> | null | undefined;
          };
          readonly diffSide: DiffSide;
          readonly id: string;
          readonly isResolved: boolean;
          readonly line: number | null | undefined;
          readonly path: string;
          readonly startLine: number | null | undefined;
        } | null | undefined> | null | undefined;
      };
      readonly reviews: {
        readonly nodes: ReadonlyArray<{
          readonly author: {
            readonly login: string;
          } | null | undefined;
          readonly body: string;
          readonly createdAt: any;
          readonly id: string;
          readonly state: PullRequestReviewState;
        } | null | undefined> | null | undefined;
      } | null | undefined;
      readonly state: PullRequestState;
      readonly title: string;
      readonly url: any;
    } | null | undefined;
  } | null | undefined;
};
export type PullDetailPageQuery = {
  response: PullDetailPageQuery$data;
  variables: PullDetailPageQuery$variables;
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
  "name": "isDraft",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merged",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "mergeable",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
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
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    (v15/*: any*/)
  ],
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "baseRefName",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "headRefName",
  "storageKey": null
},
v19 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 20
  }
],
v20 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 40
  }
],
v21 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 80
  }
],
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "path",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "line",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "startLine",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "diffSide",
  "storageKey": null
},
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isResolved",
  "storageKey": null
},
v27 = {
  "alias": null,
  "args": null,
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "__typename",
      "storageKey": null
    },
    (v15/*: any*/),
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
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "PullDetailPageQuery",
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
            "concreteType": "PullRequest",
            "kind": "LinkedField",
            "name": "pullRequest",
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
              (v16/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/),
              {
                "alias": null,
                "args": (v19/*: any*/),
                "concreteType": "PullRequestReviewConnection",
                "kind": "LinkedField",
                "name": "reviews",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PullRequestReview",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v9/*: any*/),
                      (v16/*: any*/),
                      (v8/*: any*/),
                      (v14/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviews(first:20)"
              },
              {
                "alias": null,
                "args": (v20/*: any*/),
                "concreteType": "IssueCommentConnection",
                "kind": "LinkedField",
                "name": "comments",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "IssueComment",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v8/*: any*/),
                      (v14/*: any*/),
                      (v16/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:40)"
              },
              {
                "alias": null,
                "args": (v21/*: any*/),
                "concreteType": "PullRequestReviewThreadConnection",
                "kind": "LinkedField",
                "name": "reviewThreads",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PullRequestReviewThread",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v22/*: any*/),
                      (v23/*: any*/),
                      (v24/*: any*/),
                      (v25/*: any*/),
                      (v26/*: any*/),
                      {
                        "alias": null,
                        "args": (v19/*: any*/),
                        "concreteType": "PullRequestReviewCommentConnection",
                        "kind": "LinkedField",
                        "name": "comments",
                        "plural": false,
                        "selections": [
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "PullRequestReviewComment",
                            "kind": "LinkedField",
                            "name": "nodes",
                            "plural": true,
                            "selections": [
                              (v5/*: any*/),
                              (v8/*: any*/),
                              (v16/*: any*/)
                            ],
                            "storageKey": null
                          }
                        ],
                        "storageKey": "comments(first:20)"
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviewThreads(first:80)"
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
    "name": "PullDetailPageQuery",
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
            "concreteType": "PullRequest",
            "kind": "LinkedField",
            "name": "pullRequest",
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
              (v27/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/),
              {
                "alias": null,
                "args": (v19/*: any*/),
                "concreteType": "PullRequestReviewConnection",
                "kind": "LinkedField",
                "name": "reviews",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PullRequestReview",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v9/*: any*/),
                      (v27/*: any*/),
                      (v8/*: any*/),
                      (v14/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviews(first:20)"
              },
              {
                "alias": null,
                "args": (v20/*: any*/),
                "concreteType": "IssueCommentConnection",
                "kind": "LinkedField",
                "name": "comments",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "IssueComment",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v8/*: any*/),
                      (v14/*: any*/),
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:40)"
              },
              {
                "alias": null,
                "args": (v21/*: any*/),
                "concreteType": "PullRequestReviewThreadConnection",
                "kind": "LinkedField",
                "name": "reviewThreads",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PullRequestReviewThread",
                    "kind": "LinkedField",
                    "name": "nodes",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v22/*: any*/),
                      (v23/*: any*/),
                      (v24/*: any*/),
                      (v25/*: any*/),
                      (v26/*: any*/),
                      {
                        "alias": null,
                        "args": (v19/*: any*/),
                        "concreteType": "PullRequestReviewCommentConnection",
                        "kind": "LinkedField",
                        "name": "comments",
                        "plural": false,
                        "selections": [
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "PullRequestReviewComment",
                            "kind": "LinkedField",
                            "name": "nodes",
                            "plural": true,
                            "selections": [
                              (v5/*: any*/),
                              (v8/*: any*/),
                              (v27/*: any*/)
                            ],
                            "storageKey": null
                          }
                        ],
                        "storageKey": "comments(first:20)"
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviewThreads(first:80)"
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
    "cacheID": "f2b0bc3c0beff283f2230d44b5c4a94c",
    "id": null,
    "metadata": {},
    "name": "PullDetailPageQuery",
    "operationKind": "query",
    "text": "query PullDetailPageQuery(\n  $owner: String!\n  $name: String!\n  $number: Int!\n) {\n  repository(owner: $owner, name: $name) {\n    pullRequest(number: $number) {\n      id\n      number\n      title\n      body\n      state\n      isDraft\n      merged\n      mergeable\n      url\n      createdAt\n      author {\n        __typename\n        login\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      baseRefName\n      headRefName\n      reviews(first: 20) {\n        nodes {\n          id\n          state\n          author {\n            __typename\n            login\n            ... on Node {\n              __isNode: __typename\n              id\n            }\n          }\n          body\n          createdAt\n        }\n      }\n      comments(first: 40) {\n        nodes {\n          id\n          body\n          createdAt\n          author {\n            __typename\n            login\n            ... on Node {\n              __isNode: __typename\n              id\n            }\n          }\n        }\n      }\n      reviewThreads(first: 80) {\n        nodes {\n          id\n          path\n          line\n          startLine\n          diffSide\n          isResolved\n          comments(first: 20) {\n            nodes {\n              id\n              body\n              author {\n                __typename\n                login\n                ... on Node {\n                  __isNode: __typename\n                  id\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "3eb3587fbb14b12fe25df0fafe641865";

export default node;
