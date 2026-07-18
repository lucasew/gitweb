/**
 * @generated SignedSource<<ea288ae63c3c7b69dbace6d5012189ec>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DiffSide = "LEFT" | "RIGHT" | "%future added value";
export type MergeableState = "CONFLICTING" | "MERGEABLE" | "UNKNOWN" | "%future added value";
export type PullRequestMergeMethod = "MERGE" | "REBASE" | "SQUASH" | "%future added value";
export type PullRequestReviewCommentState = "PENDING" | "SUBMITTED" | "%future added value";
export type PullRequestReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | "%future added value";
export type PullRequestState = "CLOSED" | "MERGED" | "OPEN" | "%future added value";
export type PullDetailPageQuery$variables = {
  name: string;
  number: number;
  owner: string;
};
export type PullDetailPageQuery$data = {
  readonly repository: {
    readonly mergeCommitAllowed: boolean;
    readonly pullRequest: {
      readonly author: {
        readonly avatarUrl: any;
        readonly login: string;
        readonly name?: string | null | undefined;
      } | null | undefined;
      readonly baseRefName: string;
      readonly body: string;
      readonly bodyHTML: any;
      readonly comments: {
        readonly nodes: ReadonlyArray<{
          readonly author: {
            readonly avatarUrl: any;
            readonly login: string;
            readonly name?: string | null | undefined;
          } | null | undefined;
          readonly body: string;
          readonly bodyHTML: any;
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
              readonly bodyHTML: any;
              readonly id: string;
              readonly state: PullRequestReviewCommentState;
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
            readonly avatarUrl: any;
            readonly login: string;
            readonly name?: string | null | undefined;
          } | null | undefined;
          readonly body: string;
          readonly bodyHTML: any;
          readonly createdAt: any;
          readonly id: string;
          readonly state: PullRequestReviewState;
        } | null | undefined> | null | undefined;
      } | null | undefined;
      readonly state: PullRequestState;
      readonly title: string;
      readonly url: any;
      readonly viewerLatestReview: {
        readonly body: string;
        readonly bodyHTML: any;
        readonly id: string;
        readonly state: PullRequestReviewState;
      } | null | undefined;
    } | null | undefined;
    readonly rebaseMergeAllowed: boolean;
    readonly squashMergeAllowed: boolean;
    readonly viewerDefaultMergeMethod: PullRequestMergeMethod;
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
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "mergeCommitAllowed",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "squashMergeAllowed",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "rebaseMergeAllowed",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "viewerDefaultMergeMethod",
  "storageKey": null
},
v8 = [
  {
    "kind": "Variable",
    "name": "number",
    "variableName": "number"
  }
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "number",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
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
  "name": "bodyHTML",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "state",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isDraft",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "merged",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "mergeable",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "login",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "size",
      "value": 64
    }
  ],
  "kind": "ScalarField",
  "name": "avatarUrl",
  "storageKey": "avatarUrl(size:64)"
},
v22 = {
  "kind": "InlineFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "baseRefName",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "headRefName",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "concreteType": "PullRequestReview",
  "kind": "LinkedField",
  "name": "viewerLatestReview",
  "plural": false,
  "selections": [
    (v9/*: any*/),
    (v14/*: any*/),
    (v12/*: any*/),
    (v13/*: any*/)
  ],
  "storageKey": null
},
v26 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 20
  }
],
v27 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "size",
      "value": 40
    }
  ],
  "kind": "ScalarField",
  "name": "avatarUrl",
  "storageKey": "avatarUrl(size:40)"
},
v28 = {
  "alias": null,
  "args": null,
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    (v20/*: any*/),
    (v27/*: any*/),
    (v22/*: any*/)
  ],
  "storageKey": null
},
v29 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 40
  }
],
v30 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 80
  }
],
v31 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "path",
  "storageKey": null
},
v32 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "line",
  "storageKey": null
},
v33 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "startLine",
  "storageKey": null
},
v34 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "diffSide",
  "storageKey": null
},
v35 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isResolved",
  "storageKey": null
},
v36 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v37 = {
  "kind": "InlineFragment",
  "selections": [
    (v9/*: any*/)
  ],
  "type": "Node",
  "abstractKey": "__isNode"
},
v38 = {
  "alias": null,
  "args": null,
  "concreteType": null,
  "kind": "LinkedField",
  "name": "author",
  "plural": false,
  "selections": [
    (v36/*: any*/),
    (v20/*: any*/),
    (v27/*: any*/),
    (v22/*: any*/),
    (v37/*: any*/)
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
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "PullRequest",
            "kind": "LinkedField",
            "name": "pullRequest",
            "plural": false,
            "selections": [
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "author",
                "plural": false,
                "selections": [
                  (v20/*: any*/),
                  (v21/*: any*/),
                  (v22/*: any*/)
                ],
                "storageKey": null
              },
              (v23/*: any*/),
              (v24/*: any*/),
              (v25/*: any*/),
              {
                "alias": null,
                "args": (v26/*: any*/),
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
                      (v9/*: any*/),
                      (v14/*: any*/),
                      (v28/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviews(first:20)"
              },
              {
                "alias": null,
                "args": (v29/*: any*/),
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
                      (v9/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v19/*: any*/),
                      (v28/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:40)"
              },
              {
                "alias": null,
                "args": (v30/*: any*/),
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
                      (v9/*: any*/),
                      (v31/*: any*/),
                      (v32/*: any*/),
                      (v33/*: any*/),
                      (v34/*: any*/),
                      (v35/*: any*/),
                      {
                        "alias": null,
                        "args": (v26/*: any*/),
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
                              (v9/*: any*/),
                              (v12/*: any*/),
                              (v13/*: any*/),
                              (v14/*: any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": null,
                                "kind": "LinkedField",
                                "name": "author",
                                "plural": false,
                                "selections": [
                                  (v20/*: any*/)
                                ],
                                "storageKey": null
                              }
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
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "PullRequest",
            "kind": "LinkedField",
            "name": "pullRequest",
            "plural": false,
            "selections": [
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
              (v12/*: any*/),
              (v13/*: any*/),
              (v14/*: any*/),
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "author",
                "plural": false,
                "selections": [
                  (v36/*: any*/),
                  (v20/*: any*/),
                  (v21/*: any*/),
                  (v22/*: any*/),
                  (v37/*: any*/)
                ],
                "storageKey": null
              },
              (v23/*: any*/),
              (v24/*: any*/),
              (v25/*: any*/),
              {
                "alias": null,
                "args": (v26/*: any*/),
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
                      (v9/*: any*/),
                      (v14/*: any*/),
                      (v38/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "reviews(first:20)"
              },
              {
                "alias": null,
                "args": (v29/*: any*/),
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
                      (v9/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v19/*: any*/),
                      (v38/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": "comments(first:40)"
              },
              {
                "alias": null,
                "args": (v30/*: any*/),
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
                      (v9/*: any*/),
                      (v31/*: any*/),
                      (v32/*: any*/),
                      (v33/*: any*/),
                      (v34/*: any*/),
                      (v35/*: any*/),
                      {
                        "alias": null,
                        "args": (v26/*: any*/),
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
                              (v9/*: any*/),
                              (v12/*: any*/),
                              (v13/*: any*/),
                              (v14/*: any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": null,
                                "kind": "LinkedField",
                                "name": "author",
                                "plural": false,
                                "selections": [
                                  (v36/*: any*/),
                                  (v20/*: any*/),
                                  (v37/*: any*/)
                                ],
                                "storageKey": null
                              }
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
          (v9/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e91d7f9f1fc48ae4d21f0b791ebcbaa2",
    "id": null,
    "metadata": {},
    "name": "PullDetailPageQuery",
    "operationKind": "query",
    "text": "query PullDetailPageQuery(\n  $owner: String!\n  $name: String!\n  $number: Int!\n) {\n  repository(owner: $owner, name: $name) {\n    mergeCommitAllowed\n    squashMergeAllowed\n    rebaseMergeAllowed\n    viewerDefaultMergeMethod\n    pullRequest(number: $number) {\n      id\n      number\n      title\n      body\n      bodyHTML\n      state\n      isDraft\n      merged\n      mergeable\n      url\n      createdAt\n      author {\n        __typename\n        login\n        avatarUrl(size: 64)\n        ... on User {\n          name\n        }\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      baseRefName\n      headRefName\n      viewerLatestReview {\n        id\n        state\n        body\n        bodyHTML\n      }\n      reviews(first: 20) {\n        nodes {\n          id\n          state\n          author {\n            __typename\n            login\n            avatarUrl(size: 40)\n            ... on User {\n              name\n            }\n            ... on Node {\n              __isNode: __typename\n              id\n            }\n          }\n          body\n          bodyHTML\n          createdAt\n        }\n      }\n      comments(first: 40) {\n        nodes {\n          id\n          body\n          bodyHTML\n          createdAt\n          author {\n            __typename\n            login\n            avatarUrl(size: 40)\n            ... on User {\n              name\n            }\n            ... on Node {\n              __isNode: __typename\n              id\n            }\n          }\n        }\n      }\n      reviewThreads(first: 80) {\n        nodes {\n          id\n          path\n          line\n          startLine\n          diffSide\n          isResolved\n          comments(first: 20) {\n            nodes {\n              id\n              body\n              bodyHTML\n              state\n              author {\n                __typename\n                login\n                ... on Node {\n                  __isNode: __typename\n                  id\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "ade54ed53c7e430d0d01eb22077bddf0";

export default node;
