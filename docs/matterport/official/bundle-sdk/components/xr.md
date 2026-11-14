<!-- source: https://developers.matterport.com/bundle-sdk/components/xr/ -->

**Type** : "mp.xr"

**Inputs**

None

**Outputs**

Property| Type| **session**|  XRSession — _default_ `null`  
Set to a valid session when the user has entered webxr immersive mode. When not in immersive mode, this session is null.  
---|---  
  
**Usage**

See [XRSession](https://developer.mozilla.org/en-US/docs/Web/API/XRSession) for the current specification.

Binding to the mp.xr component from another component.
    
    
    // Assumes MyComponent has a session input and handled  
    
    
    // onInputsChanged()  
    
    
      
    
    
    var [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    var node = sceneObject.addNode();  
    
    
    var xr = node.addComponent('mp.xr');  
    
    
    var my = node.addComponent('myComponent');  
    
    
    my.bind('session', xr, 'session');  
    
    
    node.start();  
    

Observing the mp.xr session from outside the component system.
    
    
    var [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    var node = sceneObject.addNode();  
    
    
    var xr = node.addComponent('mp.xr');  
    
    
    node.start();  
    
    
      
    
    
    // The outputs object is an ObservableProxy which supports observing property changes.  
    
    
    // See @mp/core/src/observable/ObservableProxy.ts in the sdk examples repo.  
    
    
    xr.onPropertyChanged('session', (session: any) => {  
    
    
      console.log(`session changed:`, session);  
    
    
    });  
    
    
      
    
