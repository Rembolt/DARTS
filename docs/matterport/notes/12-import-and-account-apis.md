# Import API (beta) and Account API

Both are **Enterprise-only** and need a Developer Tools License plus API credentials (Token ID and Secret).

## Import API (beta)

Sources: https://developers.matterport.com/api/import/overview/ and `/guide/`

Creates Matterport models from open formats (currently **E57** point clouds). Supports multi-file imports (several E57s into one model) and multipart uploads for large files.

Endpoint: `https://api.matterport.com/api/import/graph` . Console: https://api.matterport.com/import/graphiql . Reference: https://api.matterport.com/docs/reference

### Workflow

1. `addImportSession`: pass org ID and process type `E57`, plus optional name and description. Returns the session ID used afterwards.
2. `addE57Object`: register the file (client ID, name, MIME type, size in bytes).
3. `beginUpload`: session ID plus the file's client ID.
4. `requestPartUpload`: session ID, file client ID, zero-based part index and part size. Repeat per part. Returns a pre-signed URL.
5. HTTP `PUT` the data to each pre-signed URL. **Record the `ETag` response header** of each part.
6. `completeUpload`: session ID, file client ID, and the list of parts with ETags.
7. `commitImportSession`: finalizes and starts model creation.

Tracking: `importSession` (returns `modelId` once available), `listImportSessions` (find by model ID), `importFilePartsUploadStatus` (uploaded parts and ETags).

More: guide https://developers.matterport.com/api/import/guide/ and a full Python example at https://developers.matterport.com/api/import/code-examples/ (not read here).

## Account API

Sources: https://developers.matterport.com/api/account/overview/ , `/samples/` , `/custom-roles/`

Endpoint: `https://api.matterport.com/api/accounts/graph` . Console: https://api.matterport.com/account/graphiql

Covers organization, user and role info (including custom roles), inviting/removing/editing users, folder management (assign, create, update, delete; model counts; moving folders or models), and SDK key management.

### Samples

```graphql
# Org info incl. SDK keys and bundles
query { organization { name created developer { mode license { availability } } sdkKeys { used remaining quota keys(active: true) { key label domains { created secureOnly domain port } } } bundles { id name description enabled } } }

# Members
query { organization { memberships(query: "", pageSize: 100, offset: null) { nextOffset results { user { id firstName lastName email created } roles { id name } status } } } }

mutation($userEmail: String!, $roleId: ID!, $inviteMessage: String) { inviteMember(email: $userEmail, roleId: $roleId, inviteMessage: $inviteMessage) { user { email } status } }
mutation($email: String!) { removeMembership(email: $email) { user { email } status } }
mutation($email: String!, $roleId: ID!) { patchMembership(email: $email, roleId: $roleId) { user { email } roles { id name } } }
```

Stock role IDs: collaborator `00000000100`, admin `00000000120`, owner `00000000200`, billing-admin `00000000080`.

SDK key management mutations:

| Action | Mutation |
|---|---|
| Add key | `provisionSdkKey(label, domains: [AddSdkDomain!])` |
| Delete key | `removeSdkKey(key)` |
| Add domain | `addSdkDomain(key, details)` |
| Remove domain | `removeSdkDomain(key, domainId)` |
| Update domain | `patchSdkDomain(key, domainId, patch)` |

A domain input looks like `{ domain: "http://localhost", secureOnly: false, port: 8000 }`.

### Custom roles and user groups

Custom roles allow or deny specific permissions beyond the stock roles; user groups bundle members so roles and shares apply together. Configure them in the Matterport users settings page and use the API to automate. Share roles seen in samples: viewer `00000001001`, full `00000001002`.

```graphql
query { roles(query: { include: CUSTOM, offset: null }) { nextOffset totalResults results { id name } } }
query($roleName: String!) { roles(query: { include: CUSTOM, searchText: $roleName }) { results { id name } } }
query { userGroups(offset: null) { nextOffset totalResults results { id name roles { id name } members { results { user { email id } } } modelShares { results { sharedObject { id name } roles { id name } } } folderShares { results { sharedObject { id name } roles { id name } } } } } }
query($email: String!) { organization { membershipByEmail(email: $email) { user { id email objectAccess { results { sharedObject { __typename id name } isInherited roles { id name } sharedWith { id name source } } } } roles { id name } } } }
```

Invite with a custom role: `inviteMember(email, roleId) { user { id } }`. Change role: `patchMembership(email, roleId)`.
