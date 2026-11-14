<!-- source: https://developers.matterport.com/api-changelog/page-3/ -->

On this page

## 2023.03.01​

_March 1, 2023_

### API Changes​

  * The assets attribute on Model is marked as nullable and documented with @error model.inactive
  * The `updateModelAddress` mutation supports changing the `addressVisibility` property.
  * The model mutation `updateAddress` supports changing the `addressVisibility` property.



### Bug Fixes and Other Enhancements​

  * Model Webhooks bugs have been fixed and users should receive notifications for all models in their organization.



* * *

## 2023.01.18​

_January 18, 2023_

  * The `icon` attribute on [Mattertags](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/mattertag.doc.html) may now be read and patched. Please see the Tags 2.0 Icons Reference for the full icon set.
  * The `floor` attribute on Labels may now be [queried](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/label.doc.html) and mutated.
  * Added ID for the resource (denoting SID of the resource) in `AccessInfo` type for access query



* * *

## 2022.12.14​

_December 14, 2022_

  * Folder and model api query for `access` now in `@beta`
  * The HTTP status code will be more accurate in cases where the entire graph query fails to process.
  * The error structure will also now include an additional httpStatus attribute which indicates what the equivalent HTTP status for each sub-error would have been



Example model query:
    
    
    query model {  
    
    
      model(id: "$modelId") {  
    
    
        access(pageSize: 30, orderBy: ROLE, filters: [Admin]) {  
    
    
          results On this page
    
    ## 2023.03.01​
    
    
    
    
    _March 1, 2023_
    
    
    
    
    ### API Changes​
    
    
    
    
    
    
        * The assets attribute on Model is marked as nullable and documented with @error model.inactive
    
    
        * The updateModelAddress mutation supports changing the addressVisibility property.
    
    
        * The model mutation updateAddress supports changing the addressVisibility property.
    
    
    
    
    
    ### Bug Fixes and Other Enhancements​
    
    
    
    
    
    
        * Model Webhooks bugs have been fixed and users should receive notifications for all models in their organization.
    
    
    
    
    
    * * *
    
    
    
    
    ## 2023.01.18​
    
    
    
    
    _January 18, 2023_
    
    
    
    
    
    
        * The icon attribute on [Mattertags](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/mattertag.doc.html) may now be read and patched. Please see the Tags 2.0 Icons Reference for the full icon set.
    
    
        * The floor attribute on Labels may now be [queried](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/label.doc.html) and mutated.
    
    
        * Added ID for the resource (denoting SID of the resource) in AccessInfo type for access query
    
    
    
    
    
    * * *
    
    
    
    
    ## 2022.12.14​
    
    
    
    
    _December 14, 2022_
    
    
    
    
    
    
        * Folder and model api query for access now in @beta
    
    
        * The HTTP status code will be more accurate in cases where the entire graph query fails to process.
    
    
        * The error structure will also now include an additional httpStatus attribute which indicates what the equivalent HTTP status for each sub-error would have been
    
    
    
    
    
    Example model query:
    
    
    
    
    
    query model {  
    
    
      model(id: "$modelId") {  
    
    
        access(pageSize: 30, orderBy: ROLE, filters: [Admin]) {  
    
    
          results {  
    
    
            email  
    
    
            type  
    
    
            role  
    
    
            name  
    
    
          }  
    
    
          nextOffset  
    
    
        }  
    
    
      }  
    
    
    }  
    

Example folder query:
    
    
    query folder {  
    
    
      folder(id: "$folderId") {  
    
    
        id  
    
    
        name  
    
    
        access(filters: [FolderCreator], pageSize: 500) {  
    
    
          results {  
    
    
            email  
    
    
            name  
    
    
            role  
    
    
            type  
    
    
          }  
    
    
          nextOffset  
    
    
        }  
    
    
      }  
    
    
    }  
    

* * *

## 2022.12.14​

_December 14, 2022_

**Account API**

API Changes

  * Making access query in `user.schema` to be beta


    
    
    query {  
    
    
      organization {  
    
    
        memberships {  
    
    
          results {  
    
    
            user(id: "$userId") {  
    
    
              access(  
    
    
                filters: [FolderCreator, FolderShares]  
    
    
                orderBy: ROLE  
    
    
                sortOrder: desc  
    
    
              ) {  
    
    
                results {  
    
    
                  email  
    
    
                  type  
    
    
                  name  
    
    
                  role  
    
    
                }  
    
    
                nextOffset  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

* * *

## 2022.11.16​

_November 16, 2022_

  * [Folder API query](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/folder.doc.html) for `modelCountSummary` is now out of `@beta`



* * *

## 2022.11.16​

_November 16, 2022_

**Account API**

API Changes

  * Account Membership search now filters out banned users
  * Account Membership search now allows us to query email, lastName, firstName


    
    
    # Get memberships on an org with emails that contain matterport  
    
    
    query {  
    
    
      organization {  
    
    
        id  
    
    
        memberships(field: email, query: "matterport") {  
    
    
          results {  
    
    
            user {  
    
    
              id  
    
    
              email  
    
    
            }  
    
    
            status  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

  * We added the ability to order membership search results


    
    
    # Membership search with ordering  
    
    
    query {  
    
    
      organization {  
    
    
        id  
    
    
        memberships(  
    
    
          field: email  
    
    
          query: "matterport"  
    
    
          sortBy: [  
    
    
            { field: last_name, order: desc }  
    
    
            { field: first_name }  
    
    
            { field: last_login, order: asc }  
    
    
          ]  
    
    
        ) {  
    
    
          results {  
    
    
            user {  
    
    
              id  
    
    
              email  
    
    
              lastName  
    
    
              lastLogin  
    
    
              firstName  
    
    
            }  
    
    
            status  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Bug Fixes and Other Enhancements**

  * fixed the query field for org/account memberships



* * *

## 2022.10.26​

_October 26, 2022_

  * [Folder](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/folder.doc.html) extensions now out of `@beta`
  * Webhook Mutations now available. (Enterprise only)


    
    
    mutation {  
    
    
      addModelEventWebhookCallback(ModelEventCallbackInput) { ... }  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      patchModelEventWebhookCallback(  
    
    
        id: ID!,  
    
    
        input: ModelEventCallbackInput  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      removeModelEventWebhookCallback(id: ID!): Boolean  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      pingModelEventWebhookCallback(id: ID!): Boolean  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      addModelEventToCallback(  
    
    
        id: ID!,  
    
    
    	eventTypes: [ModelEventType!]  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      removeModelEventFromCallback(  
    
    
        id: ID!,  
    
    
    	eventTypes: [ModelEventType!]  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    

* * *

## 2022.10.26​

_October 26, 2022_

**Account API**

  * Sandbox mode is now blocked on the Account API because there is no specific behavior for this mode on this API.

  * folderShares and folderShareAccessLevels queries no longer beta




* * *

## 2022.10.12​

_October 12, 2022_

This changes the default serialization of fields with errors or no data from being left out of the response to serializing null explicitly (this is more compliant with the GraphQL standard). There is a graph query which may be used to opt an org out of this behavior to the previous behaviour:
    
    
    query getSerialization($orgId: ID) {  
    
    
      organization(id: $orgId) {  
    
    
        id  
    
    
        developer {  
    
    
          options {  
    
    
            serializeGraphNulls  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation disableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: disabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation enableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: enabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    

Bug Fixes and Other Enhancements

  * Fixed a bug where the query to get the organization’s root folder was not returning results.



* * *

## 2022.09.21​

_September 21, 2022_

  * Mattertag description max length increased from 1,000 characters to 2,000 characters



* * *

  * 2023.03.01
    * API Changes
    * Bug Fixes and Other Enhancements
  * 2023.01.18
  * 2022.12.14
  * 2022.12.14
  * 2022.11.16
  * 2022.11.16
  * 2022.10.26
  * 2022.10.26
  * 2022.10.12
  * 2022.09.21



On this page

## 2022.09.21​

_September 21, 2022_

**Account API**

This changes the default serialization of fields with errors or no data from being left out of the response to serializing null explicitly (this is more compliant with the GraphQL standard). There is a graph query which may be used to opt an org out of this behavior to the previous behaviour:

[Try it in our interactive console](https://api.matterport.com/api/mp/accounts/graphiql/?query=query%20getSerialization\(%24orgId%3A%20ID\)%20%7B%0A%20%20organization\(id%3A%24orgId\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20developer%20%7B%0A%20%20%20%20%20%20options%20%7B%0A%20%20%20%20%20%20%20%20serializeGraphNulls%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Amutation%20disableSerializeNulls\(%24orgId%3A%20ID\)%20%7B%0A%20%20patchDeveloperOptions\(%0A%20%20%20%20organizationId%3A%24orgId%0A%20%20%20%20serializeGraphNulls%3A%20disabled%0A%20%20\)%20%7B%0A%20%20%20%20serializeGraphNulls%0A%20%20%7D%0A%7D%0A%0Amutation%20enableSerializeNulls\(%24orgId%3A%20ID\)%20%7B%0A%20%20patchDeveloperOptions\(%0A%20%20%20%20organizationId%3A%24orgId%0A%20%20%20%20serializeGraphNulls%3A%20enabled%0A%20%20\)%20%7B%0A%20%20%20%20serializeGraphNulls%0A%20%20%7D%0A%7D&operationName=getSerialization)
    
    
    query getSerialization($orgId: ID) {  
    
    
      organization(id: $orgId) {  
    
    
        id  
    
    
        developer {  
    
    
          options {  
    
    
            serializeGraphNulls  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation disableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: disabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation enableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: enabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    

* * *

## 2022.09.07​

_September 7, 2022_

This release exposes full folder manipulation (within org) create, edit, share, move and delete folders.

This is currently a closed beta that can be enabled via the api.graph.ext.folders policy.

API Changes

  * Add query to get folder and root folder for an organization.


    
    
    query {  
    
    
    	folder(id: ID!): Folder  
    
    
    }  
    
    
      
    
    
    query {  
    
    
    	rootFolder(organizationId: ID): Folder  
    
    
    }  
    

  * Add mutation to create, edit, delete and move folders within organization


    
    
    mutation {  
    
    
    	addFolder(folderDetails: FolderDetails!): Folder  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	patchFolder(id: ID!, patchInput: FolderPatch!): Folder  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	moveToFolder(modelIds: [ID!], folderIds: [ID!], destinationFolderId: ID!): Folder  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	deleteFolder(id: ID!): Boolean  
    
    
    }  
    

  * Add mutation to add, update and remove shares for model and folders


    
    
      
    
    
    mutation {  
    
    
    	removeModelShareAccess(userId: ID!, modelId: ID!): Boolean!  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	removeFolderShareAccess(userId: ID!, folderId: ID!): Boolean!  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    {  
    
    
            email  
    
    
            type  
    
    
            role  
    
    
            name  
    
    
          }  
    
    
          nextOffset  
    
    
        }  
    
    
      }  
    
    
    }  
    

Example folder query:
    
    
    query folder {  
    
    
      folder(id: "$folderId") {  
    
    
        id  
    
    
        name  
    
    
        access(filters: [FolderCreator], pageSize: 500) {  
    
    
          results {  
    
    
            email  
    
    
            name  
    
    
            role  
    
    
            type  
    
    
          }  
    
    
          nextOffset  
    
    
        }  
    
    
      }  
    
    
    }  
    

* * *

## 2022.12.14​

_December 14, 2022_

**Account API**

API Changes

  * Making access query in `user.schema` to be beta


    
    
    query {  
    
    
      organization {  
    
    
        memberships {  
    
    
          results {  
    
    
            user(id: "$userId") {  
    
    
              access(  
    
    
                filters: [FolderCreator, FolderShares]  
    
    
                orderBy: ROLE  
    
    
                sortOrder: desc  
    
    
              ) {  
    
    
                results {  
    
    
                  email  
    
    
                  type  
    
    
                  name  
    
    
                  role  
    
    
                }  
    
    
                nextOffset  
    
    
              }  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

* * *

## 2022.11.16​

_November 16, 2022_

  * [Folder API query](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/folder.doc.html) for `modelCountSummary` is now out of `@beta`



* * *

## 2022.11.16​

_November 16, 2022_

**Account API**

API Changes

  * Account Membership search now filters out banned users
  * Account Membership search now allows us to query email, lastName, firstName


    
    
    # Get memberships on an org with emails that contain matterport  
    
    
    query {  
    
    
      organization {  
    
    
        id  
    
    
        memberships(field: email, query: "matterport") {  
    
    
          results {  
    
    
            user {  
    
    
              id  
    
    
              email  
    
    
            }  
    
    
            status  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

  * We added the ability to order membership search results


    
    
    # Membership search with ordering  
    
    
    query {  
    
    
      organization {  
    
    
        id  
    
    
        memberships(  
    
    
          field: email  
    
    
          query: "matterport"  
    
    
          sortBy: [  
    
    
            { field: last_name, order: desc }  
    
    
            { field: first_name }  
    
    
            { field: last_login, order: asc }  
    
    
          ]  
    
    
        ) {  
    
    
          results {  
    
    
            user {  
    
    
              id  
    
    
              email  
    
    
              lastName  
    
    
              lastLogin  
    
    
              firstName  
    
    
            }  
    
    
            status  
    
    
    	addOrUpdateModelShareAccess(userId: ID!, roleId: ID!, modelId: ID!): UserModelShareAccess  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	addOrUpdateFolderShareAccess(  
    
    
    		email: String,  
    
    
    		userId: ID,  
    
    
    		invitationMessage: String,  
    
    
    		roleId: ID!,  
    
    
    		folderId: ID!  
    
    
    	): UserFolderShareAccess  
    
    
    }  
    

* * *

## 2022.09.07​

_September 7, 2022_

**Account API**

  * This release exposes full folder manipulation (within org) create, edit, share, move and delete folders. (private beta)



**Bug Fixes and Other Enhancements:**

  * Allow modelShare queries to filter based on multiple access levels instead of a single one.


    
    
    # A paginated search to get a list of all the model shares satisfying given query  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        modelShares(  
    
    
      
    
    
          # A query string to search for. If the query is not provided, all the results for given organization are returned.  
    
    
          query: String,  
    
    
      
    
    
          # If supplied, the query string only searches this field  
    
    
          field: ModelSharesSearchField,  
    
    
      
    
    
          # Filter based on the access level granted to user. If more than one level is selected, shares with access given with either level is shown (an OR operation is performed)  
    
    
      
    
    
          accessLevel: [ModelShareAccess],  
    
    
      
    
    
          # Desired number of entries in a page of results. If not specified, default will be 10  
    
    
      
    
    
          pageSize: Int,  
    
    
      
    
    
          # The offset value to apply, if omitted will start with the first matching result. The result list's 'nextOffset' property provides the offset value for the next page of results.  
    
    
      
    
    
          offset: String  
    
    
        ): UserModelShareAccessList  
    
    
      }  
    
    
    }  
    

  * Query results are returned sorted by created date in descending order.



* * *

## 2022.08.24​

_August 24, 2022_

This is a minor revision related to the object detection beta.

API Changes

  * Add a parameter to Model.objectAnnotations() to explicitly include user created ObjectAnnotations


    
    
    query {  
    
    
    	objectAnnotations(  
    
    
    		includeUserCreated: Boolean  
    
    
    	): [ObjectAnnotation!]  
    
    
    }  
    

* * *

## 2022.08.24​

_August 24, 2022_

**Account API**

This release added mutation to clear default upload folder while deprecating listRoles and model share mutations

  * Rename listRoles to roles:


    
    
    # List all the roles associated with the account.  
    
    
    # @deprecated v2022.08.24 Use roles instead  
    
    
    query {  
    
    
      organization {  
    
    
        listRoles: [OrganizationRole]  
    
    
      }  
    
    
    }  
    

  * Add mutation to clear default upload folder for a user:


    
    
      
    
    
    # Clear the default upload folder a user  
    
    
    mutation {  
    
    
      clearDefaultUploadFolder(  
    
    
        # ID of the user  
    
    
        userId: ID!  
    
    
      ): Boolean  
    
    
    }  
    
    
      
    

  * Deprecated addOrUpdateModelShareAccess and removeModelShareAccess, moving it to model api:


    
    
    # Add access to a given model for a user with the given role. If the user already has access to the given model, update user role with the given role. Returns the ID of the model that was added/updated.  
    
    
    # @deprecated  
    
    
      
    
    
    mutation {  
    
    
      addOrUpdateModelShareAccess(  
    
    
        organizationId: ID,  
    
    
        userId: ID!,  
    
    
        roleId: ID!,  
    
    
        modelId: ID!  
    
    
      ): UserModelShareAccess  
    
    
    }  
    
    
      
    
    
    # Remove access to a given model for a user.  
    
    
    # @deprecated  
    
    
    mutation {  
    
    
      removeModelShareAccess(  
    
    
        organizationId: ID,  
    
    
        userId: ID!,  
    
    
        modelId: ID!  
    
    
      ): Boolean!  
    
    
    }  
    

* * *

## 2022.07.28​

_July 28, 2022_

**Account API**

This release changes query to list access levels for model shares.

  * Rename listModelShareAccessLevels to modelShareAccessLevels:


    
    
      
    
    
    # List all the model access levels.  
    
    
    # @deprecated use modelShareAccessLevels instead  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        listModelShareAccessLevels: [ModelShareAccessLevel]  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Bug Fixes and Other Enhancements**

  * fixed the query field for org/account memberships



* * *

## 2022.10.26​

_October 26, 2022_

  * [Folder](https://static.matterport.com/api-doc/2022.12.76-main-g91695f2/reference/graphdoc/model/folder.doc.html) extensions now out of `@beta`
  * Webhook Mutations now available. (Enterprise only)


    
    
    mutation {  
    
    
      addModelEventWebhookCallback(ModelEventCallbackInput) { ... }  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      patchModelEventWebhookCallback(  
    
    
        id: ID!,  
    
    
        input: ModelEventCallbackInput  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      removeModelEventWebhookCallback(id: ID!): Boolean  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      pingModelEventWebhookCallback(id: ID!): Boolean  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      addModelEventToCallback(  
    
    
        id: ID!,  
    
    
    	eventTypes: [ModelEventType!]  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
      removeModelEventFromCallback(  
    
    
        id: ID!,  
    
    
    	eventTypes: [ModelEventType!]  
    
    
      ): ModelEventWebhookCallback  
    
    
    }  
    

* * *

## 2022.10.26​

_October 26, 2022_

**Account API**

  * Sandbox mode is now blocked on the Account API because there is no specific behavior for this mode on this API.

  * folderShares and folderShareAccessLevels queries no longer beta




* * *

## 2022.10.12​

_October 12, 2022_

This changes the default serialization of fields with errors or no data from being left out of the response to serializing null explicitly (this is more compliant with the GraphQL standard). There is a graph query which may be used to opt an org out of this behavior to the previous behaviour:
    
    
    query getSerialization($orgId: ID) {  
    
    
      organization(id: $orgId) {  
    
    
        id  
    
    
        developer {  
    
    
          options {  
    
    
            serializeGraphNulls  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation disableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: disabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    
    
      
    
    
    mutation enableSerializeNulls($orgId: ID) {  
    
    
      patchDeveloperOptions(organizationId: $orgId, serializeGraphNulls: enabled) {  
    
    
        serializeGraphNulls  
    
    
      }  
    
    
    }  
    

Bug Fixes and Other Enhancements

  * Fixed a bug where the query to get the organization’s root folder was not returning results.



* * *

## 2022.09.21​

_September 21, 2022_

  * Mattertag description max length increased from 1,000 characters to 2,000 characters



* * *

  * 2023.03.01
    * API Changes
    * Bug Fixes and Other Enhancements
  * 2023.01.18
  * 2022.12.14
  * 2022.12.14
  * 2022.11.16
  * 2022.11.16
  * 2022.10.26
  * 2022.10.26
  * 2022.10.12
  * 2022.09.21


