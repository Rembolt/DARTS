<!-- source: https://developers.matterport.com/api/import/guide/ -->

On this page

This guide walks through the Import API workflow to create a Matterport model from an E57 file. Each step includes the GraphQL mutation or query, variables, and sample responses.

**Try it first in GraphiQL or Postman:** You can run each step interactively in the [Import API GraphiQL console](https://api.matterport.com/import/graphiql) before automating, or use [Postman](https://www.postman.com) to send the same mutations and queries.

## Prerequisites​

  * Matterport API credentials (Token ID and Token Secret)
  * An E57 file ready for import
  * Enterprise account with Developer Tools license enabled



* * *

## Step 1: Create Import Session​

Initialize a new import session that will contain your file and track the import progress.

addImportSession Mutation
    
    
    mutation addImportSession(  
    
    
      $organizationId: ID!  
    
    
      $processType: ProcessType!  
    
    
      $name: String  
    
    
      $description: String  
    
    
    ) {  
    
    
      addImportSession(  
    
    
        organizationId: $organizationId  
    
    
        processType: $processType  
    
    
        name: $name  
    
    
        description: $description  
    
    
      ) {  
    
    
        id  
    
    
        organizationId  
    
    
        created  
    
    
        modified  
    
    
        processType  
    
    
        name  
    
    
        description  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "organizationId": "P79zdxVGgWq",  
    
    
      "processType": "E57",  
    
    
      "name": "My Import API Demo",  
    
    
      "description": "My Import API Demo description"  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "addImportSession": {  
    
    
          "id": "0cumin458wkndg4qke309xmm",  
    
    
          "organizationId": "P79zdxVGgWq",  
    
    
          "created": "2026-02-15T23:34:22Z",  
    
    
          "modified": "2026-02-15T23:34:22Z",  
    
    
          "processType": "E57",  
    
    
          "name": "My Import API Demo",  
    
    
          "description": "My Import API Demo description"  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `organizationId`| Yes| Organization where the model will be created.| `processType`| Yes| File format being imported; currently supports `E57`.| `name`| No| Model name for the import session/model.| `description`| No| Model description for the import session/model.  
---|---|---  
  
**Returns:** Full session metadata, including the session `id` used in later steps.

* * *

## Step 2: Add E57 Object​

Add the E57 file to the import session.

addE57Object Mutation
    
    
    mutation AddE57Object($importSessionId: ID!, $e57: E57ObjectInput!) {  
    
    
      addE57Object(importSessionId: $importSessionId, e57: $e57) {  
    
    
        id  
    
    
        clientId  
    
    
        files {  
    
    
          id  
    
    
          clientId  
    
    
          name  
    
    
          type  
    
    
          size  
    
    
          uploadStatus  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm",  
    
    
      "e57": {  
    
    
        "id": "e57",  
    
    
        "file": {  
    
    
          "clientId": "file1",  
    
    
          "name": "SampleDemo.e57",  
    
    
          "type": "application/octet-stream",  
    
    
          "size": 2090321920  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "addE57Object": {  
    
    
          "id": "iwnrt72hznzpd6cznsci95quc",  
    
    
          "clientId": "e57",  
    
    
          "files": [  
    
    
            {  
    
    
              "id": "0waw9rsctf42u329if6zcr4da",  
    
    
              "clientId": "file1",  
    
    
              "name": "SampleDemo.e57",  
    
    
              "type": "application/octet-stream",  
    
    
              "size": 2090321920,  
    
    
              "uploadStatus": "PENDING"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Import Session ID from Step 1.| `e57.id`| Yes| Identifier for the E57 object.| `e57.file.clientId`| Yes| Client-side identifier for the file.| `e57.file.name`| Yes| Name of the E57 file.| `e57.file.type`| Yes| MIME type.| `e57.file.size`| Yes| File size in bytes.  
---|---|---  
  
* * *

## Step 3: Begin Upload​

Signal to the API that you're ready to start uploading the file.

beginUpload Mutation
    
    
    mutation beginUpload($importSessionId: ID!, $importFileId: ID!) {  
    
    
      beginUpload(importSessionId: $importSessionId, importFileId: $importFileId) {  
    
    
        id  
    
    
        clientId  
    
    
        name  
    
    
        type  
    
    
        size  
    
    
        uploadStatus  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm",  
    
    
      "importFileId": "file1"  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "beginUpload": {  
    
    
          "id": "0waw9rsctf42u329if6zcr4da",  
    
    
          "clientId": "file1",  
    
    
          "name": "SampleDemo.e57",  
    
    
          "type": "application/octet-stream",  
    
    
          "size": 2090321920,  
    
    
          "uploadStatus": "STARTED"  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Import Session ID from Step 1.| `importFileId`| Yes| File identifier from Step 2 (use the `clientId`).  
---|---|---  
  
* * *

## Step 4: Request Part Upload​

Request a pre-signed URL for uploading a specific part of your file. This supports multipart uploads for large files.

requestPartUpload Mutation
    
    
    mutation requestPartUpload(  
    
    
      $importSessionId: ID!  
    
    
      $importFileId: ID!  
    
    
      $part: Int!  
    
    
      $size: Long!  
    
    
    ) {  
    
    
      requestPartUpload(  
    
    
        importSessionId: $importSessionId  
    
    
        importFileId: $importFileId  
    
    
        part: $part  
    
    
        size: $size  
    
    
      ) {  
    
    
        url  
    
    
        minSize  
    
    
        maxSize  
    
    
        headers {  
    
    
          key  
    
    
          value  
    
    
        }  
    
    
        method  
    
    
        completed  
    
    
        partNumber  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm",  
    
    
      "importFileId": "file1",  
    
    
      "part": 0,  
    
    
      "size": 2090321920  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "requestPartUpload": {  
    
    
          "url": "https://mp-transient-qa.s3.amazonaws.com/import/0cumin458wkndg4qke309xmm/0waw9rsctf42u329if6zcr4da?...",  
    
    
          "minSize": 2090321920,  
    
    
          "maxSize": 2090321920,  
    
    
          "headers": [],  
    
    
          "method": "PUT",  
    
    
          "completed": false,  
    
    
          "partNumber": 0  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Import Session ID from Step 1.| `importFileId`| Yes| File `clientId` from Step 2.| `part`| Yes| Zero-based part index.| `size`| Yes| File size in bytes for this part (use full file size when uploading in one part).  
---|---|---  
  
**Returns:** Pre-signed URL and headers to upload the part. Copy the full URL exactly as it contains signatures. Repeat for each part if chunking the upload.

* * *

## Step 5: Upload the File​

Upload the file (or part) to the provided pre-signed URL using HTTP `PUT`. Capture the `ETag` response header for each uploaded part — you'll need it in Step 6.
    
    
    curl -X PUT \  
    
    
      --data-binary @SampleDemo.e57 \  
    
    
      "<presigned_url_from_step_4>"  
    

note

For multipart uploads, repeat the `requestPartUpload` mutation for each part and collect each `ETag` value.

* * *

## Step 6: Complete Upload​

Confirm that the file upload is complete and provide the `ETag` values collected in Step 5.

completeUpload Mutation
    
    
    mutation completeUpload(  
    
    
      $importSessionId: ID!  
    
    
      $importFileId: ID!  
    
    
      $completedParts: [CompletedPartInput!]!  
    
    
    ) {  
    
    
      completeUpload(  
    
    
        importSessionId: $importSessionId  
    
    
        importFileId: $importFileId  
    
    
        completedParts: $completedParts  
    
    
      ) {  
    
    
        id  
    
    
        clientId  
    
    
        name  
    
    
        type  
    
    
        size  
    
    
        uploadStatus  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm",  
    
    
      "importFileId": "file1",  
    
    
      "completedParts": [  
    
    
        {  
    
    
          "headers": [  
    
    
            {  
    
    
              "key": "ETag",  
    
    
              "value": "69f67e056a3fad6395c42e3f1a5ea9"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      ]  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "completeUpload": {  
    
    
          "id": "0waw9rsctf42u329if6zcr4da",  
    
    
          "clientId": "file1",  
    
    
          "name": "SampleDemo.e57",  
    
    
          "type": "application/octet-stream",  
    
    
          "size": 2090321920,  
    
    
          "uploadStatus": "COMPLETED"  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Session ID from Step 1.| `importFileId`| Yes| File `clientId` from Step 2.| `completedParts`| Yes| Array of uploaded parts with their `ETag` headers.  
---|---|---  
  
* * *

## Step 7: Commit Import Session​

Finalize the import session and trigger model creation.

commitImportSession Mutation
    
    
    mutation commitImportSession($importSessionId: ID!) {  
    
    
      commitImportSession(importSessionId: $importSessionId) {  
    
    
        id  
    
    
        name  
    
    
        description  
    
    
        created  
    
    
        organizationId  
    
    
        userId  
    
    
        processType  
    
    
        files {  
    
    
          id  
    
    
          clientId  
    
    
          name  
    
    
          type  
    
    
          size  
    
    
          uploadStatus  
    
    
          numParts  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm"  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "commitImportSession": {  
    
    
          "id": "0cumin458wkndg4qke309xmm",  
    
    
          "name": "My Import API Demo",  
    
    
          "description": "My Import API Demo description",  
    
    
          "created": "2026-02-15T23:44:19Z",  
    
    
          "organizationId": "P79zdxVGgWq",  
    
    
          "userId": "nR4VCCojTGi",  
    
    
          "processType": "E57",  
    
    
          "files": []  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Session ID from Step 1.  
---|---|---  
  
* * *

## Query Import Session or Model IDs​

Use these queries to check on sessions in progress or look up model IDs after completion.

importSession Query (by Import Session ID)
    
    
    query importSession($importSessionId: ID!) {  
    
    
      importSession(importSessionId: $importSessionId) {  
    
    
        id  
    
    
        name  
    
    
        description  
    
    
        created  
    
    
        organizationId  
    
    
        userId  
    
    
        modelId  
    
    
        processType  
    
    
        files {  
    
    
          id  
    
    
          clientId  
    
    
          name  
    
    
          type  
    
    
          size  
    
    
          uploadStatus  
    
    
          numParts  
    
    
          parts {  
    
    
            minSize  
    
    
            maxSize  
    
    
            headers {  
    
    
              key  
    
    
              value  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm"  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "importSession": {  
    
    
          "id": "0cumin458wkndg4qke309xmm",  
    
    
          "name": "My Import API Demo",  
    
    
          "description": "My Import API Demo description",  
    
    
          "created": "2026-02-15T23:34:22Z",  
    
    
          "organizationId": "P79zdxVGgWq",  
    
    
          "userId": "nR4VCCojTGi",  
    
    
          "modelId": "Ga4afATLPtH",  
    
    
          "processType": "E57",  
    
    
          "files": [  
    
    
            {  
    
    
              "id": "0waw9rsctf42u329if6zcr4da",  
    
    
              "clientId": "file1",  
    
    
              "name": "SampleDemo.e57",  
    
    
              "type": "application/octet-stream",  
    
    
              "size": 2090321920,  
    
    
              "uploadStatus": "COMPLETED",  
    
    
              "numParts": null,  
    
    
              "parts": null  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

listImportSessions Query (by Model ID)
    
    
    query listImportSessions($modelId: ID) {  
    
    
      listImportSessions(modelId: $modelId) {  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
          created  
    
    
          modified  
    
    
          organizationId  
    
    
          userId  
    
    
          processType  
    
    
          committed  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "modelId": "Ga4afATLPtH"  
    
    
    }  
    

**Sample Response:**
    
    
    {  
    
    
      "data": {  
    
    
        "listImportSessions": {  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "0cumin458wkndg4qke309xmm",  
    
    
              "name": "My Import API Demo",  
    
    
              "created": "2026-02-15T23:34:22Z",  
    
    
              "modified": "2026-02-15T23:34:37Z",  
    
    
              "organizationId": "P79zdxVGgWq",  
    
    
              "userId": "nR4VCCojTGi",  
    
    
              "processType": "E57",  
    
    
              "committed": true  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

importFilePartsUploadStatus Query
    
    
    query importFilePartsUploadStatus(  
    
    
      $importSessionId: ID!  
    
    
      $importFileId: ID!  
    
    
    ) {  
    
    
      importFilePartsUploadStatus(  
    
    
        importSessionId: $importSessionId  
    
    
        importFileId: $importFileId  
    
    
      ) {  
    
    
        eTag  
    
    
        size  
    
    
        partNumber  
    
    
      }  
    
    
    }  
    

**Sample Variables:**
    
    
    {  
    
    
      "importSessionId": "0cumin458wkndg4qke309xmm",  
    
    
      "importFileId": "file1"  
    
    
    }  
    

**Parameters:**

Parameter| Required| Description| `importSessionId`| Yes| Session ID to inspect.| `importFileId`| Yes| File `clientId` whose parts to list.  
---|---|---  
  
* * *

## Error Handling​

If you encounter errors during the import workflow, refer to the [error codes documentation](/api/#error-codes) for troubleshooting guidance.

  * Prerequisites
  * Step 1: Create Import Session
  * Step 2: Add E57 Object
  * Step 3: Begin Upload
  * Step 4: Request Part Upload
  * Step 5: Upload the File
  * Step 6: Complete Upload
  * Step 7: Commit Import Session
  * Query Import Session or Model IDs
  * Error Handling


