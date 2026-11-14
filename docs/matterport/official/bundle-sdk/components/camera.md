<!-- source: https://developers.matterport.com/bundle-sdk/components/camera/ -->

**Type** : mp.camera

**Inputs**

Property| Type| **enabled**|  boolean — default `false`  
If true, this components acquires control of the camera.| **camera**|  Camera | null — default `null`  
A three.js camera object.  
---|---  
  
**Events**

Property| ONACCESSGRANTED| ONACCESSREVOKED  
---  
  
**Usage**

This component can be used to take control of the showcase camera by providing it with a three.js camera object. Currently, control can only be applied while in dollhouse mode since that is the only mode with six degrees of freedom. Transitioning to other modes will not work as expected while this component has control. This component fires two events indicating when access has been granted or revoked.
    
    
    // Create a three.js camera object that will be the acting as the source for the camera component.  
    
    
    const myCamera = new THREE.PerspectiveCamera( 45, 1.333, 1, 1000 );  
    
    
      
    
    
    // Create a scene object and node with a camera component.  
    
    
    // Set it up to request control after  
    
    
    // the node is started by setting enabled to true.  
    
    
    const [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    const cameraComponent = node.addComponent('mp.camera', {  
    
    
      enabled: true,  
    
    
      camera: myCamera,  
    
    
    });  
    
    
      
    
    
    // Define a spy that intercepts ONACCESSGRANTED events  
    
    
    class AccessGrantedSpy {  
    
    
      public eventType: 'ONACCESSGRANTED';  
    
    
      public onEvent(payload: unknown) {  
    
    
        // myCamera is now enabled, changes to your camera will  
    
    
        // be reflected on the showcase camera.  
    
    
      }  
    
    
    }  
    
    
      
    
    
    // spy on the camera before it starts.  
    
    
    cameraComponent.spyOnEvent( new AccessGrantedSpy());  
    
    
      
    
    
    // start the camera node  
    
    
    node.start();  
    
