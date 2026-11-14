<!-- source: https://developers.matterport.com/bundle-sdk/components/point-light/ -->

**Type** : "mp.pointLight"

**Inputs**

Property| Type| **enabled**|  boolean — _default_ `true`  
If true the point light is active in the scene.| **color**| { r: number, g: number, b: number } — _default_ `{ r: 1.0, g: 1.0, b: 1.0 }`  
The color of the light. Each color component is a number between 0 and 1.| **intensity**|  number — _default_ `2`  
The light intensity.| **position**| { x: number, y: number, z: number } — _default_ `{ x: 1, y: 5, z: 1 }`  
The world space position of the point light.| **distance**|  number — _default_ '0'  
Maximum range of the light. Default is 0 (no limit).| **decay**|  number — _default_ `1`  
The amount the light dims from the point light.| **debug**|  boolean — _default_ `false`  
Enables debugging visuals.  
---|---  
      
    
    var [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    var node = sceneObject.addNode();  
    
    
    var initial = {  
    
    
      enabled: false,  
    
    
      color: {  
    
    
        r: 0, g: 1, b: 0  
    
    
      },  
    
    
      intensity: 0.8,  
    
    
      position: {  
    
    
        x: 0, y: 1, z: 0  
    
    
      },  
    
    
      distance: 10,  
    
    
      decay: 1,  
    
    
      debug: false,  
    
    
    };  
    
    
      
    
    
    node.addComponent('mp.pointLight', initial);  
    
    
    node.start();  
    
