/**
 * @generated SignedSource<<193ec6dc0223e64bc4b5661846e4a34a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PullFilesDiffUnmarkViewedMutation$variables = {
  path: string;
  pullRequestId: string;
};
export type PullFilesDiffUnmarkViewedMutation$data = {
  readonly unmarkFileAsViewed: {
    readonly pullRequest: {
      readonly id: string;
    } | null | undefined;
  } | null | undefined;
};
export type PullFilesDiffUnmarkViewedMutation = {
  response: PullFilesDiffUnmarkViewedMutation$data;
  variables: PullFilesDiffUnmarkViewedMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "path"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "pullRequestId"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "path",
            "variableName": "path"
          },
          {
            "kind": "Variable",
            "name": "pullRequestId",
            "variableName": "pullRequestId"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "UnmarkFileAsViewedPayload",
    "kind": "LinkedField",
    "name": "unmarkFileAsViewed",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PullRequest",
        "kind": "LinkedField",
        "name": "pullRequest",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "PullFilesDiffUnmarkViewedMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "PullFilesDiffUnmarkViewedMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "9b5c85139a783c28f98832872cecaaf6",
    "id": null,
    "metadata": {},
    "name": "PullFilesDiffUnmarkViewedMutation",
    "operationKind": "mutation",
    "text": "mutation PullFilesDiffUnmarkViewedMutation(\n  $pullRequestId: ID!\n  $path: String!\n) {\n  unmarkFileAsViewed(input: {pullRequestId: $pullRequestId, path: $path}) {\n    pullRequest {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b6f64ea7fb28bb628d9f9a4b2e5211e9";

export default node;
