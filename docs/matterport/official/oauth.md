<!-- source: https://developers.matterport.com/oauth/ -->

On this page

note

OAuth is currently offered by invitation only for our Commercial Partners.

## Introduction​

OAuth allows third-party applications to access Matterport users' accounts directly, by secure authorization given to the application by the user. Matterport OAuth implementation is based on OAuth 2.0 standard.

### OAuth and Matterport APIs​

Matterport uses OAuth to provide user-authorized API resource access to third-party applications. More specifically, third-party partner applications can use our OAuth implementation to request customers to delegate temporary access to their Matterport assets through our Public APIs.

For example, consider a third party application that uses Matterport Cloud data or purchased assets. For the application to get this data automatically on behalf of the user, this application’s developer can create an OAuth integration with Matterport. The user then authenticates via the third party application and their account is connected, giving the application permission to retrieve this information.

### OAuth and Matterport SDK​

Traditionally, our Showcase SDK required that models be publicly viewable to be able to embed within an SDK application. Using our OAuth implementation, private models can now be embedded within an SDK application.

## Getting Access to OAuth​

Developers who have a Developer Tools Production License and who have a Commercial Partnership agreement can contact [](mailto:) to request access to OAuth in Development Mode.

When enabled, you can create Your OAuth Application from the Application Integration Management section on your account's [Developer Tools](https://my.matterport.com/settings/account/devtools) page

![Create / Edit an OAuth Application](/assets/images/OAuth_EditApplication-791ae245a4f9531f1cfcd879674e7d34.jpeg)

When you add an application, you will need the following information:

  * Access-token duration: The maximum duration for which the token access is authorized to access. By default, this is 60 minutes but can set set to up to 24 hours. We recommend that you limit the duration to what is necessary and use your refresh token whenever the access token has expired.

  * Redirect URL: The URL to redirect the user after access is authorized. For more information, refer to the OAuth Redirect URIs article.

  * Application name: A unique name to identify your application. This name will appear to end users.

  * Permissions: Select the permissions your app will need for customers’ assets. These permissions map directly to OAuth scopes.


Scope Name| Description| Permissions| `ViewDetails`| View Space details| Application can search for models within the resource owner's organization and view the public and private details of a model.| `EditDetails`| Edit Space details| Application can edit basic details of a model.| `DownloadAssets`| Download Assets| Application can download assets such as purchased Add-Ons and colormap imagery associated with a model| `PurchaseAssets`| Purchase Space assets| Application can purchase assets for a model on user's behalf.  
---|---|---  
  
Upon creation of the application, you will receive a Client ID and Client Secret that can be used to integrate OAuth into your application.

![OAuth Client Secret](/assets/images/OAuth_ClientSecret-e4625009a24e79d5e7cbe02da210680b.jpeg)

note

Matterport does not store the client secret. You can regenerate a new secret at a later point in time, but Matterport cannot retrieve your current secret if it's lost.

## Development Mode vs. Production Mode​

When you create a new OAuth Application, it will be in Development Mode. This allows your application to accept authorizations from your account, but not from other user's accounts.

When you have completed your application, you can "Request Approval for Production Access" from the Developer Tools page. We will then contact you to arrange a review of your application.

![OAuth Production Access Request](/assets/images/OAuth_Request_Production_Access-7b32da7cd1c51d71587e4f2d7edc45e7.jpeg)

## OAuth Application Guidelines​

When building your OAuth Application be sure to:

  * Protect the **Client Secret** and **Refresh Token** by not exposing them in client side requests
  * Properly identify that the user is granting the application access to their Matterport Account
  * Provide clarity that purchases will be charged to the user's account if using features with the 'Download Assets' scope.



  * Introduction
    * OAuth and Matterport APIs
    * OAuth and Matterport SDK
  * Getting Access to OAuth
  * Development Mode vs. Production Mode
  * OAuth Application Guidelines


