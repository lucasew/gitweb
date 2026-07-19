/**
 * @generated SignedSource<<6833ec910fc35577ba26a207ad6fe08b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PullFilesDiffMarkViewedMutation$variables = {
  path: string;
  pullRequestId: string;
};
export type PullFilesDiffMarkViewedMutation$data = {
  readonly markFileAsViewed: {
    readonly pullRequest: {
      readonly id: string;
    } | null | undefined;
  } | null | undefined;
};
export type PullFilesDiffMarkViewedMutation = {
  response: PullFilesDiffMarkViewedMutation$data;
  variables: PullFilesDiffMarkViewedMutation$variables;
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
    "concreteType": "MarkFileAsViewedPayload",
    "kind": "LinkedField",
    "name": "markFileAsViewed",
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
    "name": "PullFilesDiffMarkViewedMutation",
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
    "name": "PullFilesDiffMarkViewedMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "9d22b14a55cfa603aad50cc44a96b8d2",
    "id": null,
    "metadata": {},
    "name": "PullFilesDiffMarkViewedMutation",
    "operationKind": "mutation",
    "text": "mutation PullFilesDiffMarkViewedMutation(\n  $pullRequestId: ID!\n  $path: String!\n) {\n  markFileAsViewed(input: {pullRequestId: $pullRequestId, path: $path}) {\n    pullRequest {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b35abb0a56c2977cc00beafedc0419a4";

export default node;
