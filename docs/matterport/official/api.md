<!-- source: https://developers.matterport.com/api/ -->

On this page

Our developer community is full of industry professionals who want to integrate Matterport into their every-day workflows.

We’re committed to face this challenge, and that starts with opening up our API to architects, engineers, and any other [professionals who want to dive deeper into our platform](https://matterport.com/platform/developers).

We offer a developer toolset that allows developers to directly connect to Matterport’s back-end datastore, while also allowing customers to act on their models programmatically.

From directly accessing data, to modifying content, to managing a model’s status, to purchasing value-added services, we want our developers to have full control.

## GraphQL​

Matterport's APIs are provided with a GraphQL API interface. GraphQL allows developers to make declarative queries to fetch the exact data needed using a single endpoint. Compared to a REST API, which may require round-trip requests to many endpoints, GraphQL can get all of the data that your application needs with a single request.

In addition to queries that fetch data, our APIs also provide mutations, which are requests to modify data. A mutation may be used to update data related to a model or may trigger an action such as purchasing an add-on.

[Learn more about constructing GraphQL queries and mutations](https://graphql.org/learn/queries/).

## Documentation​

Each of our GraphQL APIs contain a schema that contains a complete set of definitions for all queries and mutations that a user can perform.

Our Model API is available to users at all account levels. Enterprise customers also have access to Account API and Import API (Beta).

You can explore the schema and perform queries interactively via GraphiQL:

  * [Model API GraphiQL](https://api.matterport.com/model/graphiql)
  * [Account API GraphiQL](https://api.matterport.com/account/graphiql)
  * [Import API GraphiQL](https://api.matterport.com/import/graphiql)



You can also use popular GraphQL clients such as [Postman](https://www.postman.com/), [Altair](https://altairgraphql.dev/), or [Insomnia](https://insomnia.rest/). These clients leverage the provided schema to provide query completion through introspection along with an interactive reference guide.

## Generate API Keys​

  1. Go to Matterport Cloud (my.matterport.com).
  2. Click Settings in the lower left.
  3. Select Developer Tools.
  4. Go to the API Token Management section.
  5. Request API keys



You need to generate an API key that allows you to connect to our API endpoints. You can generate up to five keys for use across the different applications you want to build. When you create a new key, you are presented with the following:

  * **Token ID** \- This appears on the settings page.
  * **Token Secret** \- This is presented only once, so make sure to copy and save it securely.



API keys are "admin" or "all-access" keys. This means they grant users administrative credentials to the customer account. Using the API with the generated API key, developers can perform all administrative functions using the API, including archiving models, purchasing floorplans and Matterpaks.

It's important to remember this when sharing your API keys. We strongly advise that you don't share your API keys with third-party companies or developers.

Note that accounts have only Sandbox mode enabled by default. For more information about Sandbox Mode, refer to the [Developer Tools Availability and Pricing](https://support.matterport.com/s/article/Developer-Tools-Pricing-and-Availability?language=en_US) article.

## Connect to the Endpoints​

Our APIs only accept requests from server side scripting.

API| Endpoint| Availability| **Model API**| `https://api.matterport.com/api/models/graph`| All accounts| **Account API**| `https://api.matterport.com/api/accounts/graph`| Enterprise only| **Import API**| `https://api.matterport.com/api/import/graph`| Enterprise only (Beta)  
---|---|---  
  
**Authentication:**

  * Use the Token ID as the username
  * Use the Token Secret as the password
  * Example: `Authorization: Basic [base64_encode(Token_ID:Token_Secret)]`



All standard http libraries should support this process, but make sure to set your preemptive authorization to "true".

## Error Codes​

All application-level errors have codes in their error extensions. Use the guide below to recognize and troubleshoot common error codes. 

1\. request.unauthenticated

No authorization token is present, or the authorization token has expired. 

2\. request.unauthorized

User attempted to access an operation or field that is not allowed. 

3\. request.invalid

The graph query could not be processed. 

4\. error.internal

The server was unable to process the request. 

5\. not.found

The requested object doesn't exist. You will see this error when using the specific ID field in the associated operation. 

6\. not.unique

An attempt was made to retrieve a single record from a secondary index, but multiple records matched the submitted query. This often happens when multiple models have the same internal ID. 

7\. quota.exceeded

Resource limited mutations. For example, attempting to activate more models than allowed due to subscription limitations 

## FAQs​

What is an API?

API is short for [application programming interface](https://en.wikipedia.org/wiki/Application_programming_interface). This is a communications protocol between different parts of a computer program. The main intention of an API is to simplify the implementation and maintenance of software. 

Matterport APIs allow developers or customers to programmatically connect their systems or applications directly to the Matterport system in order to access and modify data. 

Matterport also offers an "SDK." What's the difference?

The Showcase SDK is a client-side JavaScript client and library that can be used by developers to extend Showcase capabilities, even if the Showcase is directly embedded on another site or platform. Think of it as a thin, invisible layer that sits on top of the Showcase iFrame, only on the developer's page. With that in mind, the SDK affects the experience only on one developer page per use. As such, models that have been shared on multiple sites are affected only on the developer's page where the SDK has been applied.

As opposed to the SDK, the API connects directly __ to the Matterport backend. This allows developers to perform a variety of commands, like searching, reading data, changing data, and placing orders. The Matterport API allows developers to programmatically perform actions that customers take in Matterport Cloud and includes access to some data not publically available.

What accounts can I access using the API?

We recommend only using the API to access the customer's account and models. __ Keep in mind, the API token is essentially a set of administrative credentials, and provides full access to the account, even to make purchases via API.

What APIs are currently available?

Matterport currently offers two APIs:

**Model API** Search, read, and change model data, including model details like the name and address of the space, sharing URLs, images, videos, position data, the OBJ mesh file, the point cloud file, panoramic imagery, position points, and Tags.

**Account API** (Enterprise Only) — These commands include managing users, inviting, updating permissions, and managing SDK keys.

**Import API** (Enterprise Only, Beta) — Import and programmatically process open file formats like E57 to create Matterport models.

Matterport also offers Enterprise-only extensions to these APIs:

**Folders API** — An extension to both Model and Account APIs that provides the ability to manage folders, move models between folders and query models by folders.

**GeoCoords API** — An extension to Model API that provides the ability to extract and modify geographic coordinates (latitude, longitude, and altitude) for Matterport models.

**Webhooks** — An extension to Model API. Add callback events that send information to your platform when changes are made within your account including when models are uploaded, processed, edited or removed.

**Private Model Embed Mutations** — An extension to Model API. Create private model embed links with a short-lived access token for displaying models within your private Intranet.

What do I need to be able to access the Account API?

You need to have a developer tools license on any of our Enterprise SaaS Tiers. If you do not currently have a Developer Tools license, please contact your Enterprise account manager to add this to your contract.

How do I get started?

You'll need to request an API token. To do so:

  1. Go to Matterport Cloud (my.matterport.com)
  2. Click Settings in the lower left.
  3. Select Developer Tools.
  4. Go to the API Token Management section. Here, you can request and revoke API keys.



How do I connect and authenticate with my API token?

How you write your query depends on the HTTP method and content-type you specify. Per the GraphQL spec, the request can be sent as either GET or POST.

**GET requests** \- The parameters must be properly escaped in the query string.

**POST requests** \- This should include a JSON-encoded body, illustrated in this article.

Use this URL in your GET and POST requests: **`https://api.matterport.com/api/models/graph`**

[Try a sample GET request (using the URL above)](https://api.matterport.com/api/models/graph?query=query{models{totalResults%20results%20{id%20name%20created%20modified%20visibility%20}}})

Sample cURL request:
    
    
    Authorization: Basic <b>[base64 encoded apiToken:apiSecret]</b>  
    
    
      
    
    
    curl \  
    
    
    --user [apiKey]:[apiSecret] \  
    
    
    -v 'https://api.matterport.com/api/models/graph?query=\{models\{totalResults%20results\{id%20created%20modified%20visibility\}\}\}'  
    

Notice the symbols above taken from the cURL request - these are escaping for bash. The cURL will not automatically URL encode whitespace, which is why the **%20** is added.

Why are Showcase SDK and Model API coordinates different?

This is a bit confusing, but is expected behavior. The Showcase SDK is designed to work from the perspective of the camera, so its coordinate system rotates to determine the Y axis (height) and Z axis (depth). If you were to download a MatterPak, you would find all of the coordinate information with Z-up. The SDK hides this by only exposing certain pieces of information.

![Model API vs Showcase Coordinate System](/assets/images/xyz-coordinate-system-58b844ecd9739a7d61226e9a4ae07736.png)

The pseudo-code for doing the translation is as follows:
    
    
    def fromSdkToApi(x, y, z) = [ x, -z, y ]  
    
    
    def fromApiToSdk(x, y, z) = [ x, z, -y ]  
    

Note that the translation above may seem odd because the Z and Y coordinates are both flipped, and one is inverted.

I can't see the changes I am doing with the Model API right away - what should I do?

This happens because of caching in our CDN. An edit/publish flow will fully flush the CDN cache, though we don't currently do that for every edit at the API layer.

One way to verify that you're experiencing a CDN cache issue is to look at the model in a private or incognito window. Authenticated users will bypass the cache but anonymous viewers will not. If this is the case, changes should be visible to everyone within an hour.

Can I manipulate a 3D mesh of a model with the API?

No, the API can only currently get and set model details, assets, Mattertags, labels, and bundles.

How do I query all models with Python using requests? 

Use the query below:
    
    
    import requests   
    
    
      
    
    
    token = 'Your API token'   
    
    
    secret = 'Your secret API token'   
    
    
    endpoint = 'https://api.matterport.com/api/models/graph'  
    
    
    query = { 'query' :  
    
    
        '''  
    
    
        query {  
    
    
          models(query: "*"){  
    
    
            totalResults  
    
    
            results{ id }  
    
    
          }  
    
    
        }  
    
    
        '''  
    
    
    }  
    
    
    auth = (token, secret)  
    
    
    headers = {'content-type': 'application/json', 'accept':'gzip'}  
    
    
    r = requests.post(endpoint, json=query, auth=auth, headers=headers)   
    
    
      
    
    
    if(r.ok):  
    
    
        print(r.json())  
    
    
    else:   
    
    
        print(r.status_code)  
    

How do I query all models with Node.js using fetch?
    
    
    const { default: fetch } = require("node-fetch");  
    
    
    const token = "Your API token";  
    
    
    const secret = "Your secret API token";  
    
    
    const auth = Buffer.from(token + ':' + secret).toString('base64');  
    
    
    const endpoint = "https://api.matterport.com/api/models/graph";  
    
    
    const body = JSON.stringify({  
    
    
      query: `  
    
    
        query {  
    
    
          models(query: "*"){  
    
    
            totalResults  
    
    
            results{ id }  
    
    
          }  
    
    
        }  
    
    
      `  
    
    
    });  
    
    
      
    
    
    fetch(endpoint, {  
    
    
        method: 'POST',  
    
    
        headers: {  
    
    
          'Authorization': `Basic ${auth}`,  
    
    
          'Content-type': 'application/json'  
    
    
        },  
    
    
        body: body,  
    
    
      })  
    
    
      .then(res => res.json())  
    
    
      .then(data => console.log(data))  
    

I'm a collaborator on an account - why can't I use the Interactive Console?

If you are set as a collaborator (as opposed to an admin), you cannot access models through the API.

If you need access, you have two options:

  1. Request that an account admin transfers the space to you.
  2. Have the admin of the account share their API tokens with you.



An API token will give you access to every model that belongs to the admin's account.

Why can't I access my MatterPak™ bundle after unlocking it?

MatterPaks™ require a few minutes to be generated for a space. Once the unlock is requested, please allow up to 15 minutes before querying for the MatterPak™ Bundle.

How do I update embedded media within a Mattertag?

To add or update rich media content, you have to use the `updateMattertagMediaUrl()` mutation. If you want to remove rich media content, you must use the `removeMattertagMedia()` mutation.

The GraphQL Schema does show that `addMattertag()` and `patchMattertag()` can update "media" and "mediaType." However, at this time, it's not possible to directly update these values if you're using rich media content.

  * GraphQL
  * Documentation
  * Generate API Keys
  * Connect to the Endpoints
  * Error Codes
  * FAQs


