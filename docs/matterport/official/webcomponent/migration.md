<!-- source: https://developers.matterport.com/webcomponent/migration/ -->

On this page

note

The Matterport Web Component is currently in public beta - interface and syntax are subject to change.

You can follow the [existing bundle steps](/bundle-sdk/#iframe-method) exactly as written using the new webcomponent package, **with one exception** : you’ll download the zipped file by following these instructions:

  1. Install npm on your machine if it isn't already. (Run `npm -v` in your terminal to check if it is - if you see a number, you're all set.)
  2. Run `npm view @matterport/webcomponent`.
  3. Download the .tarball file linked in that command's output.
  4. Move the `built-bundle` directory to your project, not `bundle`.



From there, follow these steps:

  1. Add the `dist` directory from the .tgz you downloaded in the previous step to your project.
  2. Add Three to your project from the bundle's vendored copy — use the version directory present under `built-bundle/vendors/three/`: `<script src="built-bundle/vendors/three/<version>/three.min.js"></script>` (assuming you moved built-bundle to your project).
  3. Add the webcomponent to your project: `<script src="dist/matterport-viewer.umd.js"></script>`
  4. Change the `iframe` tag to a `matterport-viewer` tag. (You can leave the `src` attribute as-is on `matterport-viewer`).



That’s it! The webcomponent should now be running instead of the iframe.

### URL parameters/iframe migration​

Any [URL parameter](https://support.matterport.com/s/article/URL-Parameters?language=en_US&ardId=kA05d000001DWztCAG) can be added as an attribute to the `<matterport-viewer>` component. For example, to turn on quickstart (`qs`) and set MLS (`mls`) to option 2:
    
    
    <matterport-viewer m="SxQL3iGyoDo" qs="1" mls="2"></matterport-viewer>  
    

If you’re migrating from the old iframe-based workflow, you can also reuse your `src` attribute in the new viewer and preserve the same options:
    
    
    <!-- You can turn this: -->  
    
    
    <iframe  
    
    
      src="/bundle/showcase.html?m=22Ub5eknCVx&play=1&qs=1&log=0&applicationKey=PUT_APPLICATION_KEY_HERE">  
    
    
      
    
    
    <!-- into this, and keep the same functionality: -->  
    
    
    <matterport-viewer  
    
    
      src="/bundle/showcase.html?m=22Ub5eknCVx&play=1&qs=1&log=0&applicationKey=PUT_APPLICATION_KEY_HERE">  
    

  * URL parameters/iframe migration


