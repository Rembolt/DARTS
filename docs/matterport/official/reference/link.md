<!-- source: https://developers.matterport.com/reference/link/ -->

On this page

Types

  * CreateLinkOptions
  * OpenPolicyOptions



Enumerations

  * CreationPolicy
  * DestinationPolicy
  * OpenPolicy



Methods

  * createDeepLink
  * createLink
  * setExternalLinkPolicy
  * setModelLinkPolicy
  * setNavigationLinkPolicy
  * setSameOriginLinkPolicy
  * setShareLinkPolicy



## Types​

### CreateLinkOptions​

CreateLinkOptions: _object_

Property| Type| includeParams| string[]  
The list of URL parameters to include in the share link  
---|---  
  
### OpenPolicyOptions​

OpenPolicyOptions: _object_

Property| Type| templateHref| string  
An optional template for the link to use when the policy is not set to SAME_FRAME, that will have any ${[param]} substrings interpolated using the current set of URL parameters. If ${[param]} is included in the path of the URL, it will be replaced by the current URL parameter's value or undefined (${m}/show: abc123/show). If ${[param]} is included in the search parameters of the URL, it and it's value wil be appended ot the URL (${m}: m=abc123). URL parameters that are unset will be appended without a value. (${unset}: unset) Note: ${m} or ${model} are special cases in model links. Instead of the current window's "model" param, the model ID from the link will be used instead. As an example, the string "[https://my.domain.com/${m}/show.html?${play}&${unset}](https://my.domain.com/$%7Bm%7D/show.html?$%7Bplay%7D&$%7Bunset%7D)" interpolated at the URL [https://my.domain.com/show/?m=abc123&play=1](https://my.domain.com/show/?m=abc123&play=1) will result in a URL like "[https://my.domain.com/abc123/show.html?play=1&unset&m=abc123](https://my.domain.com/abc123/show.html?play=1&unset&m=abc123)".  
---|---  
  
## Enumerations​

### CreationPolicy​

CreationPolicy: _enum_

The behavior to use when creating a link.

Member| Value| MATTERPORT| "link.creationpolicy.matterport"  
Use the original Matterport link as the base of the link| REFERRER| "link.creationpolicy.referrer"  
Use the embedder's window.location as the base of the link| WINDOW| "link.creationpolicy.window"  
Use Showcase's current window.location as the base of the link  
---|---  
  
### DestinationPolicy​

DestinationPolicy: _enum_

Member| Value| DEFAULT| "link.destination.default"  
Navigate to the default destination for links; likely the Showcase embedder's domain| MATTERPORT| "link.destination.matterport"  
Navigate directly to the Showcase of a Matterport space  
---|---  
  
### OpenPolicy​

OpenPolicy: _enum_

The behavior to use when clicking a link

Member| Value| CURRENT_WINDOW| "link.openpolicy.current"  
Navigate the window that is the current embedder of Showcase| DEFAULT| "link.openpolicy.default"  
Use the default behavior for the associated link type| NEW_WINDOW| "link.openpolicy.newwindow"  
Open a new tab or window| SAME_FRAME| "link.openpolicy.sameframe"  
Open in the current iframe  
---|---  
  
## Methods​

### createDeepLink​

createDeepLink(): Promise<string>

Bundle 3.1.60.12+ Embed

Create a deep link to the current location of the current Showcase player.
    
    
    const deepLink = await sdk.Link.createDeepLink();  
    

**Returns:** `Promise`<string>

### createLink​

createLink(): Promise<string>

Bundle 3.1.60.12+ Embed

Create a shareable link to the current Showcase player.
    
    
    const link = await sdk.Link.createLink();  
    

**Returns:** `Promise`<string>

### setExternalLinkPolicy​

setExternalLinkPolicy(openInNewWindow: boolean): Promise<void>

Bundle 3.1.60.12+ Embed

Change the behavior of clicking a link to a different origin.
    
    
    sdk.Link.setExternalLinkPolicy(false);  
    
    
    // clicking an external link will now navigate the current page (not the Showcase iframe) to the link  
    
    
      
    

Parameter| Type| openInNewWindow| boolean  
Open the link in a new tab or window; otherwise, replace the embedder's window. true is the default behavior.  
---|---  
  
**Returns:** `Promise`<void>

### setModelLinkPolicy​

setModelLinkPolicy: _method_ — _2 overloads_

setModelLinkPolicy(policy: Link.OpenPolicy, options?: Partial<Link.OpenPolicyOptions>): Promise<void>

Bundle 3.1.60.12+ Embed

Change the behavior of clicking a link to another model.
    
    
    sdk.Link.setModelLinkPolicy(sdk.Link.OpenPolicy.NEW_WINDOW);  
    
    
    // clicking a link to another model will now open a new window  
    

Parameter| Type| policy| Link.OpenPolicy  
the open policy for model links| options?| Partial<Link.OpenPolicyOptions>  
additional options such as a template href  
---|---  
  
**Returns:** `Promise`<void>

setModelLinkPolicy(policy: Link.OpenPolicy, destination: Link.DestinationPolicy): Promise<void>

Parameter| Type| policy| Link.OpenPolicy| destination| Link.DestinationPolicy  
---|---  
  
**Returns:** `Promise`<void>

### setNavigationLinkPolicy​

setNavigationLinkPolicy(policy: Link.OpenPolicy, options?: Partial<Link.OpenPolicyOptions>): Promise<void>

Bundle 3.1.60.12+ Embed

Change the behavior of clicking a link to a location within the current model.
    
    
    // when clicking a link with a location within the current model, open a new window with the model at the location  
    
    
    // instead of navigating the current model to the new location  
    
    
    sdk.Link.setNavigationLinkPolicy(sdk.Link.OpenPolicy.NEW_WINDOW, {  
    
    
      templateHref: 'https://example.com/${m}/show.html?',  
    
    
    });  
    
    
      
    
    
    // revert the navigation link behavior to the default  
    
    
    sdk.Link.setNavigationLinkPolicy(sdk.Link.OpenPolicy.DEFAULT);  
    

Parameter| Type| policy| Link.OpenPolicy  
The open policy to apply| options?| Partial<Link.OpenPolicyOptions>  
Additional options for the policy  
---|---  
  
**Returns:** `Promise`<void>

### setSameOriginLinkPolicy​

setSameOriginLinkPolicy(policy: Link.OpenPolicy): Promise<void>

Bundle 3.1.60.12+ Embed

Change the behavior of clicking a link to a page from the same origin as the one hosting Showcase.
    
    
    sdk.Link.setSameOriginLinkPolicy(sdk.Link.OpenPolicy.CURRENT_WINDOW);  
    
    
    // clicking a link with the same origin as Showcase's embedder will now navigate the embedding page  
    
    
      
    
    
    sdk.Link.setSameOriginLinkPolicy(sdk.Link.OpenPolicy.SAME_FRAME);  
    
    
    // clicking a link with the same origin as Showcase's embedder will now navigate Showcase's iframe to that page  
    

Parameter| Type| policy| Link.OpenPolicy  
the open policy for same-origin links  
---|---  
  
**Returns:** `Promise`<void>

### setShareLinkPolicy​

setShareLinkPolicy(policy: Link.CreationPolicy, options?: Partial<Link.CreateLinkOptions>): Promise<void>

Bundle 3.1.60.12+ Embed

Change how the link the share dialog and the `createLink` and `createDeepLink` links are created.
    
    
    await sdk.Link.setShareLinkPolicy(sdk.Link.CreationPolicy.REFERRER);  
    
    
    const link = await sdk.Link.createLink();  
    
    
    console.log(link); // should log a link to your page that embeds Showcase  
    

Parameter| Type| policy| Link.CreationPolicy  
the creation policy for generating share links| options?| Partial<Link.CreateLinkOptions>  
additional options such as URL parameters to include  
---|---  
  
**Returns:** `Promise`<void>

  * Types
    * CreateLinkOptions
    * OpenPolicyOptions
  * Enumerations
    * CreationPolicy
    * DestinationPolicy
    * OpenPolicy
  * Methods
    * createDeepLink
    * createLink
    * setExternalLinkPolicy
    * setModelLinkPolicy
    * setNavigationLinkPolicy
    * setSameOriginLinkPolicy
    * setShareLinkPolicy



  * Types
    * CreateLinkOptions
    * OpenPolicyOptions
  * Enumerations
    * CreationPolicy
    * DestinationPolicy
    * OpenPolicy
  * Methods
    * createDeepLink
    * createLink
    * setExternalLinkPolicy
    * setModelLinkPolicy
    * setNavigationLinkPolicy
    * setSameOriginLinkPolicy
    * setShareLinkPolicy


