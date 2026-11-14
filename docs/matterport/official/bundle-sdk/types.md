<!-- source: https://developers.matterport.com/bundle-sdk/types/ -->

On this page

TypeScript type definitions are included in the showcase-bundle.zip.

## Finding the Type Declarations​

Type declarations are included as part of the showcase-bundle.zip. After unzipping:
    
    
    > ls ./bundle/sdk.d.ts  
    
    
    ./bundle/sdk.d.ts  
    

## Getting Started with Type Declarations​

To use the types in your project you will need to import and cast the window of your Showcase iframe.
    
    
    import { ShowcaseBundleWindow } from './bundle/sdk';  
    
    
      
    
    
    const showcaseIframe = document.getElementById('showcase') as HTMLIFrameElement;  
    
    
    const showcaseWindow = showcaseElement.contentWindow as ShowcaseBundleWindow;  
    
    
    // connect the sdk and get the sdk object  
    
    
    const mpSdk = await showcaseWindow.MP_SDK.connect(showcaseIframe, '{YOUR SDK KEY}');  
    
    
      
    
    
    // start using mpSdk  
    
    
    mpSdk.Sweep.moveTo('sweep1234', { transition: mpSdk.Sweep.TransitionType.FADEOUT });  
    

## Using Individual Namespaces​

Once you have your `mpSdk` object, you'll likely want to pass it around and/or use other types provided by the sdk. All namespaces and their types are also available through the root `MpSdk` type.
    
    
    // tourControls.ts  
    
    
    import { Tour } from './bundle/sdk'  
    
    
      
    
    
    export function startTour(tour: Tour) {  
    
    
      tour.start();  
    
    
    }  
    
    
      
    
    
    // use the Snapshot type through the Tour type  
    
    
    export function getTourSnapshots(tour: Tour): Promise<Tour.Snapshot[]> {  
    
    
      return tour.getData();  
    
    
    }  
    
    
      
    
    
    // index.ts  
    
    
    import { MpSdk } from './bundle/sdk';  
    
    
    import { startTour } from './tourControls.ts'  
    
    
      
    
    
    async function useTourControls(mpSdk: MpSdk) {  
    
    
      startTour(mpSdk.Tour);  
    
    
      // use the Snapshot type through the MpSdk type  
    
    
      const tourSnapshots: MpSdk.Tour.Snapshot[] = await getTourSnapshots(mpSdk.Tour);  
    
    
    }  
    

  * Finding the Type Declarations
  * Getting Started with Type Declarations
  * Using Individual Namespaces


