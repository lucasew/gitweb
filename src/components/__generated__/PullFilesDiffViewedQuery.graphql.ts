/**
 * @generated SignedSource<<214b445e8a17df1b49cbdef671639981>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FileViewedState = "DISMISSED" | "UNVIEWED" | "VIEWED" | "%future added value";
export type PullFilesDiffViewedQuery$variables = {
  name: string;
  number: number;
  owner: string;
};
export type PullFilesDiffViewedQuery$data = {
  readonly repository: {
    readonly pullRequest: {
      readonly files: {
        readonly nodes: ReadonlyArray<{
          readonly path: string;
          readonly viewerViewedState: FileViewedState;
        } | null | undefined> | null | undefined;
        readonly totalCount: number;
      } | null | undefined;
      readonly id: string;
    } | null | undefined;
  } | null | undefined;
};
export type PullFilesDiffViewedQuery = {
  response: PullFilesDiffViewedQuery$data;
  variables: PullFilesDiffViewedQuery$variables;
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
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "number",
      "variableName": "number"
    }
  ],
  "concreteType": "PullRequest",
  "kind": "LinkedField",
  "name": "pullRequest",
  "plural": false,
  "selections": [
    (v4/*: any*/),
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "first",
          "value": 100
        }
      ],
      "concreteType": "PullRequestChangedFileConnection",
      "kind": "LinkedField",
      "name": "files",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "totalCount",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "PullRequestChangedFile",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "path",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "viewerViewedState",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "files(first:100)"
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
    "name": "PullFilesDiffViewedQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Repository",
        "kind": "LinkedField",
        "name": "repository",
        "plural": false,
        "selections": [
          (v5/*: any*/)
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
    "name": "PullFilesDiffViewedQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Repository",
        "kind": "LinkedField",
        "name": "repository",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v4/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "471b9026a4c827c6e69992f9c2d76019",
    "id": null,
    "metadata": {},
    "name": "PullFilesDiffViewedQuery",
    "operationKind": "query",
    "text": "query PullFilesDiffViewedQuery(\n  $owner: String!\n  $name: String!\n  $number: Int!\n) {\n  repository(owner: $owner, name: $name) {\n    pullRequest(number: $number) {\n      id\n      files(first: 100) {\n        totalCount\n        nodes {\n          path\n          viewerViewedState\n        }\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "73a4e486515cc85e46e5a862a0ae5d28";

export default node;
