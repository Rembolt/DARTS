<!-- source: https://developers.matterport.com/api/import/overview/ -->

On this page

note

Import API is only available for Enterprise-level Matterport Subscriptions and is currently in beta.

tip

For a walkthrough of importing E57 files through the Matterport Cloud interface, see the [Import E57 Files](https://support.matterport.com/s/article/Import-E57-Files) support article.

## Introduction​

The Matterport Import API enables developers to programmatically create Matterport models from open file formats such as E57 (point cloud data). This API is designed for organizations that need to automate model creation workflows and integrate Matterport model generation into their existing pipelines.

## Key Features​

  * **Automated Model Creation** — Create Matterport models programmatically from E57 files without manual upload steps
  * **Multi-file Processing** — Combine multiple E57 files into a single Matterport model within one import session
  * **Enterprise Integration** — Integrate model creation directly into your workflows and applications
  * **Scalable File Handling** — Support for large file uploads with multipart upload capability



## Supported File Formats​

  * **E57** — Structured point cloud data files. Learn how to check for [Structured vs Unstructured point clouds](https://support.matterport.com/s/article/Structured-and-Unstructured-Point-Clouds).



## Access Requirements​

The Import API is available exclusively to Matterport Enterprise plans. You must have:

  * An active Matterport Enterprise account
  * Developer Tools License
  * API credentials (Token ID and Token Secret) generated through [your Matterport Cloud account](https://my.matterport.com/settings/account/devtools)



For more information about Matterport Enterprise Subscription and Developer Tools, reach out to your Sales Executive.

## GraphQL Endpoint​
    
    
    https://api.matterport.com/api/import/graph  
    

You can also explore the schema interactively in the [Import API GraphiQL console](https://api.matterport.com/import/graphiql).

## Getting Started​

The Import API workflow consists of seven steps. This structured approach ensures reliable file handling and maintains data integrity.

  1. **Create an import session** — Initialize a new import process with a unique session ID
  2. **Add E57 objects** — Add the E57 file(s) you want to import
  3. **Begin upload** — Notify the API that you're ready to upload the file
  4. **Request part uploads** — Get pre-signed URLs for multipart file uploads
  5. **Upload file** — Transfer your E57 file to cloud storage using the provided URLs
  6. **Complete upload** — Confirm that all file parts have been successfully uploaded
  7. **Commit import session** — Finalize the import and begin model creation



For detailed step-by-step instructions with code examples, see the [Import API Guide](/api/import/guide/).

## Code Examples​

Ready to get started? Check out the [code examples](/api/import/code-examples/) page for a complete Python workflow to accelerate your development.

## Schema Reference​

For a complete reference of all available mutations and queries, see the [API Schema Reference](https://api.matterport.com/docs/reference).

  * Introduction
  * Key Features
  * Supported File Formats
  * Access Requirements
  * GraphQL Endpoint
  * Getting Started
  * Code Examples
  * Schema Reference


