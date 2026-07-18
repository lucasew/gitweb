/**
 * @generated SignedSource<<3742702738b591367d802d863c92fedf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DiffSide = "LEFT" | "RIGHT" | "%future added value";
export type PullFilesDiffThreadMutation$variables = {
  body: string;
  line: number;
  path: string;
  pullRequestId: string;
  side: DiffSide;
};
export type PullFilesDiffThreadMutation$data = {
  readonly addPullRequestReviewThread: {
    readonly thread: {
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
    } | null | undefined;
  } | null | undefined;
};
export type PullFilesDiffThreadMutation = {
  response: PullFilesDiffThreadMutation$data;
  variables: PullFilesDiffThreadMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "body"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "line"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "path"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "pullRequestId"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "side"
},
v5 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "body",
        "variableName": "body"
      },
      {
        "kind": "Variable",
        "name": "line",
        "variableName": "line"
      },
      {
        "kind": "Variable",
        "name": "path",
        "variableName": "path"
      },
      {
        "kind": "Variable",
        "name": "pullRequestId",
        "variableName": "pullRequestId"
      },
      {
        "kind": "Variable",
        "name": "side",
        "variableName": "side"
      },
      {
        "kind": "Literal",
        "name": "subjectType",
        "value": "LINE"
      }
    ],
    "kind": "ObjectValue",
    "name": "input"
  }
],
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "path",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "line",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "diffSide",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isResolved",
  "storageKey": null
},
v11 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 5
  }
],
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "login",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "PullFilesDiffThreadMutation",
    "selections": [
      {
        "alias": null,
        "args": (v5/*: any*/),
        "concreteType": "AddPullRequestReviewThreadPayload",
        "kind": "LinkedField",
        "name": "addPullRequestReviewThread",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PullRequestReviewThread",
            "kind": "LinkedField",
            "name": "thread",
            "plural": false,
            "selections": [
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              {
                "alias": null,
                "args": (v11/*: any*/),
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
                      (v6/*: any*/),
                      (v12/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": null,
                        "kind": "LinkedField",
                        "name": "author",
                        "plural": false,
                        "selections": [
                          (v13/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:5)"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v3/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/),
      (v1/*: any*/),
      (v4/*: any*/)
    ],
    "kind": "Operation",
    "name": "PullFilesDiffThreadMutation",
    "selections": [
      {
        "alias": null,
        "args": (v5/*: any*/),
        "concreteType": "AddPullRequestReviewThreadPayload",
        "kind": "LinkedField",
        "name": "addPullRequestReviewThread",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PullRequestReviewThread",
            "kind": "LinkedField",
            "name": "thread",
            "plural": false,
            "selections": [
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v10/*: any*/),
              {
                "alias": null,
                "args": (v11/*: any*/),
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
                      (v6/*: any*/),
                      (v12/*: any*/),
                      {
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
                          (v13/*: any*/),
                          {
                            "kind": "InlineFragment",
                            "selections": [
                              (v6/*: any*/)
                            ],
                            "type": "Node",
                            "abstractKey": "__isNode"
                          }
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:5)"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9ac625530db89d04aa945f9c3a343f90",
    "id": null,
    "metadata": {},
    "name": "PullFilesDiffThreadMutation",
    "operationKind": "mutation",
    "text": "mutation PullFilesDiffThreadMutation(\n  $pullRequestId: ID!\n  $path: String!\n  $body: String!\n  $line: Int!\n  $side: DiffSide!\n) {\n  addPullRequestReviewThread(input: {pullRequestId: $pullRequestId, path: $path, body: $body, line: $line, side: $side, subjectType: LINE}) {\n    thread {\n      id\n      path\n      line\n      diffSide\n      isResolved\n      comments(first: 5) {\n        nodes {\n          id\n          body\n          author {\n            __typename\n            login\n            ... on Node {\n              __isNode: __typename\n              id\n            }\n          }\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6ea1ed477ae40ff6822b8e4ea33c1e64";

export default node;
