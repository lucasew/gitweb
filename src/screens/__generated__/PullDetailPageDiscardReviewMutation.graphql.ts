/**
 * @generated SignedSource<<d23ef2752e892f120d73710e9bf14d90>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PullRequestReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING" | "%future added value";
export type PullDetailPageDiscardReviewMutation$variables = {
  reviewId: string;
};
export type PullDetailPageDiscardReviewMutation$data = {
  readonly deletePullRequestReview: {
    readonly pullRequestReview: {
      readonly id: string;
      readonly state: PullRequestReviewState;
    } | null | undefined;
  } | null | undefined;
};
export type PullDetailPageDiscardReviewMutation = {
  response: PullDetailPageDiscardReviewMutation$data;
  variables: PullDetailPageDiscardReviewMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "reviewId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
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
    "concreteType": "DeletePullRequestReviewPayload",
    "kind": "LinkedField",
    "name": "deletePullRequestReview",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PullDetailPageDiscardReviewMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PullDetailPageDiscardReviewMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c7b16da0bd0897b3cb8f1ff58eee2118",
    "id": null,
    "metadata": {},
    "name": "PullDetailPageDiscardReviewMutation",
    "operationKind": "mutation",
    "text": "mutation PullDetailPageDiscardReviewMutation(\n  $reviewId: ID!\n) {\n  deletePullRequestReview(input: {pullRequestReviewId: $reviewId}) {\n    pullRequestReview {\n      id\n      state\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "276fbdbc7b872c0d2387ec4878a7fb18";

export default node;
