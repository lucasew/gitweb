/**
 * @generated SignedSource<<1fb17cddc3957d25cdc5bc8311e25626>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PullRequestReviewEvent = "APPROVE" | "COMMENT" | "DISMISS" | "REQUEST_CHANGES" | "%future added value";
export type PullRequestReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | "%future added value";
export type PullDetailPageReviewMutation$variables = {
  body?: string | null | undefined;
  event: PullRequestReviewEvent;
  id: string;
};
export type PullDetailPageReviewMutation$data = {
  readonly addPullRequestReview: {
    readonly pullRequestReview: {
      readonly author: {
        readonly login: string;
      } | null | undefined;
      readonly body: string;
      readonly createdAt: any;
      readonly id: string;
      readonly state: PullRequestReviewState;
    } | null | undefined;
  } | null | undefined;
};
export type PullDetailPageReviewMutation = {
  response: PullDetailPageReviewMutation$data;
  variables: PullDetailPageReviewMutation$variables;
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
  "name": "event"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v3 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "body",
        "variableName": "body"
      },
      {
        "kind": "Variable",
        "name": "event",
        "variableName": "event"
      },
      {
        "kind": "Variable",
        "name": "pullRequestId",
        "variableName": "id"
      }
    ],
    "kind": "ObjectValue",
    "name": "input"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "state",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "body",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v8 = {
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
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "PullDetailPageReviewMutation",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "AddPullRequestReviewPayload",
        "kind": "LinkedField",
        "name": "addPullRequestReview",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PullRequestReview",
            "kind": "LinkedField",
            "name": "pullRequestReview",
            "plural": false,
            "selections": [
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "author",
                "plural": false,
                "selections": [
                  (v8/*: any*/)
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
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "PullDetailPageReviewMutation",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "AddPullRequestReviewPayload",
        "kind": "LinkedField",
        "name": "addPullRequestReview",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PullRequestReview",
            "kind": "LinkedField",
            "name": "pullRequestReview",
            "plural": false,
            "selections": [
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
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
                  (v8/*: any*/),
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v4/*: any*/)
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
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "53f56f01b20428d898d6e7f4f825a786",
    "id": null,
    "metadata": {},
    "name": "PullDetailPageReviewMutation",
    "operationKind": "mutation",
    "text": "mutation PullDetailPageReviewMutation(\n  $id: ID!\n  $event: PullRequestReviewEvent!\n  $body: String\n) {\n  addPullRequestReview(input: {pullRequestId: $id, event: $event, body: $body}) {\n    pullRequestReview {\n      id\n      state\n      body\n      createdAt\n      author {\n        __typename\n        login\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "32f067c5031e661a110b333cdc8c5999";

export default node;
