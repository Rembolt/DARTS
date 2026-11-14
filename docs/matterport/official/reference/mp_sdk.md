<!-- source: https://developers.matterport.com/reference/mp_sdk/ -->

On this page

The entrypoint for connecting to the SDK and creating an [`MpSdk`](/reference/#type-mpsdk) interface.

Methods

  * connect



## Methods​

### connect​

connect: _method_ — _3 overloads_

connect(target: [ShowcaseBundleWindow](/reference/#type-showcasebundlewindow), options?: Partial<[ConnectOptions](/reference/#type-connectoptions)>): Promise<[MpSdk](/reference/#type-mpsdk)>

Bundle

Connect to the Bundle SDK and create an [`MpSdk`](/reference/#type-mpsdk) interface.
    
    
    const bundleIframe = document.getElementById<HTMLIFrameElement>('showcase');  
    
    
    const showcaseWindow = bundleIframe.contentWindow as ShowcaseBundleWindow;  
    
    
    showcaseWindow.MP_SDK.connect(showcaseWindow);  
    

Parameter| Type| target| [ShowcaseBundleWindow](/reference/#type-showcasebundlewindow)  
The window that Showcase was opened within. Can be the contentWindow of an iframe| options?| Partial<[ConnectOptions](/reference/#type-connectoptions)>  
Additional, optional options to include while connect like auth tokens  
---|---  
  
**Returns:** `Promise`<[MpSdk](/reference/#type-mpsdk)>

connect(target: HTMLIFrameElement, options?: Partial<[ConnectOptions](/reference/#type-connectoptions)>): Promise<[MpSdk](/reference/#type-mpsdk)>

Embed

Connect to the Embed SDK and create an [`MpSdk`](/reference/#type-mpsdk) interface.
    
    
    const showcaseIframe = document.getElementById<HTMLIFrameElement>('showcase');  
    
    
    const embeddingWindow = window as ShowcaseEmbedWindow;  
    
    
    embeddingWindow.MP_SDK.connect(showcaseIframe);  
    

Parameter| Type| target| HTMLIFrameElement  
The iframe of the embedded Showcase| options?| Partial<[ConnectOptions](/reference/#type-connectoptions)>  
Additional, optional options to include while connect like auth tokens  
---|---  
  
**Returns:** `Promise`<[MpSdk](/reference/#type-mpsdk)>

connect(target: HTMLIFrameElement, applicationKey: string, unused: ''): Promise<[MpSdk](/reference/#type-mpsdk)>

Embed

Connect to the Embed SDK and create an [`MpSdk`](/reference/#type-mpsdk) interface.
    
    
    const showcaseIframe = document.getElementById<HTMLIFrameElement>('showcase');  
    
    
    const embeddingWindow = window as ShowcaseEmbedWindow;  
    
    
    embeddingWindow.MP_SDK.connect(showcaseIframe, `${APPLICATION_KEY}, '');  
    

Parameter| Type| target| HTMLIFrameElement  
the iframe element containing the Showcase player| applicationKey| string  
the application key for SDK authorization| unused| ''  
unused, pass an empty string  
---|---  
  
**Returns:** `Promise`<[MpSdk](/reference/#type-mpsdk)>

  * Methods
    * connect



  * Methods
    * connect


