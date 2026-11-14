<!-- source: https://developers.matterport.com/oauth/model-api/ -->

On this page

note

OAuth is currently offered by invitation only for our Commercial Partners.

## Introduction​

This scenario is useful for accessing **Model API** on a client's account via an OAuth **`access_token`**. This may be useful for:

  * Editing metadata and annotations
  * Archiving / Unarchiving Models
  * Changing Model Visibility (Private, Link Sharing, Public)
  * Searching for a specific model or set of models



_Note there is a model selector component supplied to assist in the common case of selecting a model for further action._

## Actors​

  * Application Server (Resource Grantee)
  * Client Browser (Resource Owner)
  * Matterport Authorization Server (Authorization Server)
  * Matterport API Server (Resource Server)



## Workflow​

## **1. Client requests the application**​

The application has a page that is used to initiate the OAuth flow. The user clicks on a control on this page that indicates they give your application access to their Matterport spaces.

## **2. Redirect the client to the authorization server**​

After the user gave your application the access to their spaces, it should redirect them to `https://authn.matterport.com/oauth/authorize` with the following query parameters:

**parameter** | **description** `client_id` |This is available from the OAuth settings page. `response_type` |code `redirect_uri` |This is optional. If specified, hostname and path (must match the configured value from the OAuth settings page). Additional query parameters are allowed. `scope` |A space separated set of permissions to request. The application cannot request any scopes that have not been configured in the OAuth settings page. However, it can request fewer scopes than it is allowed to.For example, if the application is approved for `ViewDetails` and `PurchaseAssets` it can ask for access to just ViewDetails. Note that the client will be notified of all permission scopes requested, so applications should take care to request only the necessary scopes.

A URL for this sample would look like this: `https://authn.matterport.com/oauth/authorize?client_id=uud3wfustchhap01yzia7nddb&response_type=code&scope=ViewDetails%20PurchaseAssets`

A client’s access to a model is not static. They might have their access rejected or a model might be deleted. In these cases, attempts to access the model will fail with a **"not.found"** error code, as the system does not discern between a model that doesn’t exist and a model that the user doesn’t have access to.

## **3. Client accepts the authorization request**​

The user will be asked to log in to their Matterport account and select the organization to grant access to the models in. They will see the following prompt:

![OAuth Authorization Prompt](/assets/images/OAuth_Authorization_Prompt-432e0ed423c5ba57a61f45d833bb49be.jpg)

If the user authorizes the access, the system will generate the requested tokens.

## **4. Client is redirected to the configured URL**​

After authorization is granted, the authorization server will send a redirect to the client browser based on either the configured redirect URI or the one specified in the authorize URL. For a response_type of code, this will include a code query parameter, which can be used to generate the necessary access tokens.

Assuming the OAuth application has a configured redirect URL of `https://myoauthapp.test/matterport/oauth-granted/` the resulting redirect would look like this: `https://myoauthapp.test/matterport/oauth-granted/?code=wdi42eyt7pugyxze3i9ushz5d`

## **5. Client follows the redirect**​

The client browser will follow the redirect, at which point the application server will have access to the code query parameter.

## **6. Request the access tokens**​

To retrieve the access tokens, an HTTP POST must be sent to `https://api.matterport.com/api/oauth/token` with a form urlencoded body containing the following parameters:

**Key** |**Value** `grant_type` | authorization_code `code` | The authorization code received when the user authorized the application (the code from the previous step).Given the sample redirect URL from step 4, it would be: wdi42eyt7pugyxze3i9ushz5d `scope` | A space-separated set of OAuth scopes being requested. Generally, this will be the same value from step 2. This should match with what the user authorized. `client_id` | The client id from the OAuth settings. Given the sample URL for step 2, this would be: uud3wfustchhap01yzia7nddb `client_secret` | The client secret generated when the OAuth application was first created.

Sample curl for generating this request:
    
    
    curl -X POST https://api.matterport.com/api/oauth/token  
    
    
         -H "Content-Type: application/x-www-form-urlencoded"  
    
    
         -d "grant_type=authorization_code&code=wdi42eyt7pugyxze3i9ushz5d&scope=ViewPublic%20PurchaseAssets&client_id=uud3wfustchhap01yzia7nddb&client_secret=****************"  
    

This will return a response similar to the following:
    
    
    {  
    
    
         "access_token": "3mwbyppm4u0gz1z14ktqtiteb",  
    
    
          "token_type": "Bearer",  
    
    
          "expires_in": 3599,  
    
    
          "refresh_token": "ichxdbm59z74m6tkcbqi092rc:  
    
    
    }  
    

The **`access_token`** can be used when making requests to the model API, in the Authorization header, using the standard OAuth format of: **`Authorization: Bearer<token>`**. Generally, it should not be stored and new access tokens should be generated using the refresh_token in the future.

The **refresh_token** value can be used to request a new access token when the expiration time is near. Be sure to store the returned refresh_token as it will change after 24 hours. The first request for a new access_token after 24 hours will return a new refresh_token that will be required for subsequent access_token refreshes.

The **expires_in** value indicates how long the access token is valid in seconds. By default, this is 1 day.

The **refresh_token** must be stored and transmitted securely and should not be included in any remote applications, such as browsers or mobile apps.

The **access_token** must be transmitted securely, but is safe to use in trusted remote applications, such as browsers or mobile apps.

## **7. Use the access token to access model data**​

Once an access token has been generated it may be used to query the Model API. This is done by including an **`Authorization: Bearer access_token`** header, where **`access_token`** would be replaced by the value of the access token.

Using the token from the previous step the header would look like:

`Authorization: Bearer 3mwbyppm4u0gz1z14ktqtiteb`

A sample curl graph query would look like:
    
    
    curl -X POST https://qa3-api.matterport.com/api/models/graph  
    
    
         -H "Authorization: Bearer 3mwbyppm4u0gz1z14ktqtiteb"  
    
    
         -H "Content-Type: application/graphql"  
    
    
         -d '{  
    
    
            models {  
    
    
              nextOffset  
    
    
              results {  
    
    
                 id  
    
    
                 name  
    
    
             }  
    
    
           }  
    
    
         }'  
    

This will work until the access token expires, covered in the next step.

## **8. Access token expires**​

Eventually, the access token will expire. The application server can choose to be proactive and discard the token before it expires, based on the **expires_in** attribute from step 6 or it can detect the condition when it happens.

After a token expires, rather than returning a graph response, the API server will return an HTTP 400 with the Content-Type of `application/json` and the error body of `{ "error": "invalid_grant" }`. When this is received, the application should discard the current access token and generate a new one if needed.

Note: The Model API will generally return a graphql compatible response. However, the OAuth 2.0 specification supersedes that behavior in this case.

## **9. Refresh the access token**​

To generate a new access token from an existing refresh token, make an HTTP POST request to <https://api.matterport.com/api/oauth/token> with a form urlencoded body containing the following parameters:

**Key** | **Value** `grant_type` | `refresh_token` `refresh_token` | The refresh token generated in step 6. For this example: `ichxdbm59z74m6tkcbqi092rc` `client_id` | The client id from the OAuth settings. Given the sample URL for step 2, this would be `uud3wfustchhap01yzia7nddb` `client_secret` | The client secret generated when the OAuth application was first created. Note that you can reset this value from the settings page, but it cannot be retrieved.

A sample curl request would look like:
    
    
    curl -X POST https://api.matterport.com/api/oauth/token  
    
    
       -H "Content-Type: application/x-www-form-urlencoded"  
    
    
       -d "grant_type=refresh_token&refresh_token=ichxdbm59z74m6tkcbqi092rc&client_id=uud3wfustchhap01yzia7nddb&client_secret=****************"  
    

A sample response would then look like:
    
    
    {  
    
    
         "access_token": "r3gxncgp4xksmdtectyzw1s8c",  
    
    
         "token_type": "Bearer",  
    
    
         "expires_in": 3599,  
    
    
         "refresh_token": "ichxdbm59z74m6tkcbqi092rc"  
    
    
    }  
    

## **10. Use the access token to access model data**​

This step looks the same as step 7 only the new access token value **`r3gxncgp4xksmdtectyzw1s8c`** should be used in the authorization header.

## **11. Access expires or is revoked**​

Eventually, the refresh token will expire or the user will revoke the application’s access. This can be detected when attempting to generate a new access token via the refresh token.

If access has expired or been revoked, then the call to generate the access token will return an HTTP 400 with an error code of **`invalid_grant`**. At this point, the refresh token should be discarded and the client will need to reauthorize the application.

  * Introduction
  * Actors
  * Workflow
  * **1. Client requests the application**
  * **2. Redirect the client to the authorization server**
  * **3. Client accepts the authorization request**
  * **4. Client is redirected to the configured URL**
  * **5. Client follows the redirect**
  * **6. Request the access tokens**
  * **7. Use the access token to access model data**
  * **8. Access token expires**
  * **9. Refresh the access token**
  * **10. Use the access token to access model data**
  * **11. Access expires or is revoked**


