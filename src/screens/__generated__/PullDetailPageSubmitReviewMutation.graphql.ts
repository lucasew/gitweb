/**
 * @generated SignedSource<<1203631395905f3936510d58d430b0f3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PullRequestReviewEvent = "APPROVE" | "COMMENT" | "DISMISS" | "REQUEST_CHANGES" | "%future added value";
export type PullRequestReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | "%future added value";
export type PullDetailPageSubmitReviewMutation$variables = {
  body?: string | null | undefined;
  event: PullRequestReviewEvent;
  reviewId: string;
};
export type PullDetailPageSubmitReviewMutation$data = {
  readonly submitPullRequestReview: {
    readonly pullRequestReview: {
      readonly body: string;
      readonly bodyHTML: any;
      readonly id: string;
      readonly state: PullRequestReviewState;
    } | null | undefined;
  } | null | undefined;
};
export type PullDetailPageSubmitReviewMutation = {
  response: PullDetailPageSubmitReviewMutation$data;
  variables: PullDetailPageSubmitReviewMutation$variables;
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
  "name": "reviewId"
},
v3 = [
  {
    "alias": null,
    "args": [
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
            "name": "pullRequestReviewId",
            "variableName": "reviewId"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "SubmitPullRequestReviewPayload",
    "kind": "LinkedField",
    "name": "submitPullRequestReview",
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "state",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "body",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "bodyHTML",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
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
    "name": "PullDetailPageSubmitReviewMutation",
    "selections": (v3/*: any*/),
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
    "name": "PullDetailPageSubmitReviewMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "810a2663e5f89a88d7599a299d9e7448",
    "id": null,
    "metadata": {},
    "name": "PullDetailPageSubmitReviewMutation",
    "operationKind": "mutation",
    "text": "mutation PullDetailPageSubmitReviewMutation(\n  $reviewId: ID!\n  $event: PullRequestReviewEvent!\n  $body: String\n) {\n  submitPullRequestReview(input: {pullRequestReviewId: $reviewId, event: $event, body: $body}) {\n    pullRequestReview {\n      id\n      state\n      body\n      bodyHTML\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7e90d1cd741f4f7bacdf9651b8497223";

export default node;
