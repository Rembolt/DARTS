<!-- source: https://developers.matterport.com/api-changelog/page-4/ -->

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
    
    
      
    
    
    # List all the model access levels.  
    
    
    query {  
    
    
      organization {  
    
    
        modelShareAccessLevels: [ModelShareAccessLevel]  
    
    
      }  
    
    
    }  
    

* * *

## 2022.06.15​

_June 15, 2022_

This release exposes the initial schema for object annotations (object detection/insights), data will only be available for folks included in the invite only evaluation.

Also included in this release is the initial implementation of Private Model Embed (PME), the next-gen replacement for Private Model Access (PMA).

API Changes

  * [CLOSED BETA] As part of the internal beta of Object Detection the following schema will be made public but data will only be populated for members of the closed beta.


    
    
    type Model {  
    
    
      inferenceEvents(ids: [ID!]): [InferenceEvent!]  
    
    
      objectClassifications: [ObjectClassification!]  
    
    
      objectAnnotations(  
    
    
        inferenceEvents: [ID!]  
    
    
        ids: [ID!]  
    
    
        includeDisabled: Boolean  
    
    
        minimumConfidenceOverride: Float  
    
    
      ): [ObjectAnnotation!]  
    
    
    }  
    
    
      
    
    
    type InferenceEvent {  
    
    
      id: ID!  
    
    
      created: DateTime!  
    
    
      detectionModelName: String!  
    
    
      detectionModelVersion: String!  
    
    
    }  
    
    
      
    
    
    type ObjectClassification {  
    
    
      id: ID!  
    
    
      label: String!  
    
    
      defaultKeywords: [String!]  
    
    
    }  
    
    
      
    
    
    type ObjectAnnotation implements Annotation {  
    
    
      id: ID!  
    
    
      created: DateTime!  
    
    
      modified: DateTime!  
    
    
      model: Model  
    
    
      source: ObjectAnnotationSource!  
    
    
      floor: ModelFloor  
    
    
      room: ModelRoom  
    
    
      enabled: Boolean!  
    
    
      label: String  
    
    
      confidence: Float  
    
    
      panos: [PanoramicImageLocation!]  
    
    
      region: Region  
    
    
      tag: Mattertag  
    
    
      keywords: [String!]  
    
    
      classification: ObjectClassification  
    
    
    }  
    
    
      
    
    
    type Mattertag {  
    
    
      objectAnnotation: ObjectAnnotation  
    
    
    }  
    

* * *

## 2022.05.26​

_May 26, 2022_

This release adds ability to get information about user(s) who have uploaded the model.

  * For all models created to date this will always be a single user, however this will expand out to allow multiple uploaders as the capture app evolves


    
    
    query {  
    
    
      model(id: ID!) {  
    
    
        uploaders: [UserMetadata]  
    
    
      }  
    
    
    }  
    

* * *

## 2022.05.26​

_May 26, 2022_

**Account API**

This release adds support to manage default upload folders as well as manage user access to a given space.

  * Query or Update default upload folders for a given user :


    
    
      
    
    
    # Update default upload folder id for a given user  
    
    
      
    
    
    mutation {  
    
    
      updateDefaultUploadFolder(  
    
    
        # User ID  
    
    
        userId: ID!,  
    
    
      
    
    
        # Default folder id will be updated to the given value  
    
    
        folderId: ID!  
    
    
      ): UserMembership  
    
    
    }  
    
    
      
    

  * Query model shares based on the given criteria


    
    
      
    
    
    # A paginated search to get a list of all the model shares satisfying given query  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        modelShares(  
    
    
      
    
    
          # A query string to search for. If the query is not provided, all the results for given organization are returned.  
    
    
          query: String,  
    
    
      
    
    
          # If supplied, the query string only searches this field  
    
    
          field: ModelSharesSearchField,  
    
    
      
    
    
          # Filter based on the access level granted to user  
    
    
          accessLevel: ModelShareAccess,  
    
    
      
    
    
          # Desired number of entries in a page of results. If not specified, default will be 10  
    
    
          pageSize: Int,  
    
    
      
    
    
          # The offset value to apply, if omitted will start with the first matching result. The result list's 'nextOffset' property provides the offset value for the next page of results.  
    
    
      
    
    
          offset: String  
    
    
      
    
    
        ): UserModelShareAccessList  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # List all the model access levels.  
    
    
    query {  
    
    
      organization {  
    
    
        listModelShareAccessLevels: [ModelShareAccessLevel]  
    
    
      }  
    
    
    }  
    
    
      
    

  * Manage user access to a given space


    
    
      
    
    
    # Add access to a given model for a user with the given role. If the user already has access to the given model, update user role with the given role. Returns the ID of the model that was added/updated.  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        addOrUpdateModelShareAccess(  
    
    
            userId: ID!,  
    
    
            roleId: ID!,  
    
    
            modelId: ID!  
    
    
        ): UserModelShareAccess  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Remove access to a given model for a user.  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        removeModelShareAccess(  
    
    
          userId: ID!,  
    
    
          modelId: ID!  
    
    
        ): Boolean!  
    
    
      }  
    
    
    }  
    
    
      
    

Examples for given query and mutations:
    
    
    # Query to get default upload folder  
    
    
      
    
    
    query {  
    
    
    organization {  
    
    
      membershipByEmail(email:"webmaster@matterport.com") {  
    
    
        defaultUploadFolder {  
    
    
          path  
    
    
          id  
    
    
          creator {  
    
    
            id  
    
    
            email  
    
    
            firstName  
    
    
            lastName  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Query for model shares for a given user  
    
    
      
    
    
    query {  
    
    
      organization {  
    
    
        modelShares (field: userId, query: "r6wRPLhXvjz", pageSize:20) {  
    
    
          results {  
    
    
            user {  
    
    
              id  
    
    
              email  
    
    
            }  
    
    
            modelId  
    
    
            modelShareAccessLevel {  
    
    
              name  
    
    
              id  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Add or update model share for a given user  
    
    
      
    
    
    mutation {  
    
    
      addOrUpdateModelShareAccess(userId:"r6wRPLhXvjz", modelId:"pcJ2TYcQPDo", roleId:"00000000002") {  
    
    
        user {  
    
    
          email  
    
    
        }  
    
    
        modelId  
    
    
        modelShareAccessLevel {  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # Remove user access to a given space  
    
    
    mutation {  
    
    
      removeModelShareAccess(userId:"r6wRPLhXvjz", modelId:"pcJ2TYcQPDo")  
    
    
    }  
    
    
      
    

* * *

## 2022.05.04​

_May 4, 2022_

This is a minor feature release to expose more information about bundle status.

  * Additional information about the status of bundles that are being processed.
  * The processing field on bundles is made public, the following attributes will now be available under that for any bundles that have been unlocked:


    
    
    query {  
    
    
      model(id: ID!) {  
    
    
        bundle(id: "mp:matterpak") {  
    
    
          processing {  
    
    
            bundleId: String!  
    
    
            organizationId: ID!  
    
    
            status: BundleProcessingStatus!  
    
    
            lastModified: DateTime!  
    
    
            failureCode: String  
    
    
            failureReason: String  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Note that failureCode and failureReason are specific to each bundle type

* * *

  * 2022.09.21
  * 2022.09.07
  * 2022.09.07
  * 2022.08.24
  * 2022.08.24
  * 2022.07.28
  * 2022.06.15
  * 2022.05.26
  * 2022.05.26
  * 2022.05.04


