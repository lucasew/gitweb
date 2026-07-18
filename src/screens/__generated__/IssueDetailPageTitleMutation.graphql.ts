/**
 * @generated SignedSource<<b5892ce08500b932c47a22b186a9836f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type IssueDetailPageTitleMutation$variables = {
  id: string;
  title: string;
};
export type IssueDetailPageTitleMutation$data = {
  readonly updateIssue: {
    readonly issue: {
      readonly id: string;
      readonly title: string;
    } | null | undefined;
  } | null | undefined;
};
export type IssueDetailPageTitleMutation = {
  response: IssueDetailPageTitleMutation$data;
  variables: IssueDetailPageTitleMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "title"
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
            "name": "id",
            "variableName": "id"
          },
          {
            "kind": "Variable",
            "name": "title",
            "variableName": "title"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "UpdateIssuePayload",
    "kind": "LinkedField",
    "name": "updateIssue",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Issue",
        "kind": "LinkedField",
        "name": "issue",
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
            "name": "title",
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
    "name": "IssueDetailPageTitleMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "IssueDetailPageTitleMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "58b9fdf6fcc8b990bf6fa663bf67568f",
    "id": null,
    "metadata": {},
    "name": "IssueDetailPageTitleMutation",
    "operationKind": "mutation",
    "text": "mutation IssueDetailPageTitleMutation(\n  $id: ID!\n  $title: String!\n) {\n  updateIssue(input: {id: $id, title: $title}) {\n    issue {\n      id\n      title\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "633fc0f98a28064dbf3b48ff247db026";

export default node;
