<!-- source: https://developers.matterport.com/bundle-sdk/components/gltf-loader/ -->

**Type** : mp.gltfLoader

**Inputs**

Property| Type| **url**|  string — _default_ `""`  
The url to the fbx file.| **visible**|  boolean — _default_ `true`  
If true, the model is visible.| **localPosition**| { x: number, y: number, z: number } — _default_ `{ x: 0, y: 0, z: 0 }`  
The local offset of the model.| **localRotation**| { x: number, y: number, z: number } — _default_ `{ x: 0, y: 0, z: 0 }`  
The local rotation of model the in euler angles.| **localScale**| { x: number, y: number, z: number } — _default_ `{ x: 1, y: 1, z: 1 }`  
The local scale of the model.| **colliderEnabled**|  boolean — _default_ `true`  
When set, the collider output is set to the loaded model.  
---|---  
  
**Outputs**

Property| Type| **loadingState**|  string — _default_ `"Idle"`  
`"Idle"` - initialized, no url is set • `"Loading"` - url set, loading the model • `"Loaded"` - model has been loaded • `"Error"` - there was an error during loading| **objectRoot**|  Object3D — _default_ `null`  
`null` - no model loaded • `{Object3D}` - the root of the loaded model| **collider**|  Object3D — _default_ `{objectRoot}`  
`null` - no collider events if colliderEnabled is set to false • `{objectRoot}` - Raycasting will be performed against the loaded model  
---|---  
      
    
    var [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    var node = sceneObject.addNode();  
    
    
    var initial = {  
    
    
      url: "http://test.com/bunny.gltf",  
    
    
      visible: true,  
    
    
      localScale: {  
    
    
        x: 0.5, y: 0.5, z: 0.5  
    
    
      },  
    
    
      localPosition: {  
    
    
        x: 0.1, y: 0, z: 0  
    
    
      },  
    
    
    };  
    
    
      
    
    
    node.addComponent('mp.gltfLoader', initial);  
    
    
    node.start();  
    
