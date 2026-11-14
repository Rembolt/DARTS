<!-- source: https://developers.matterport.com/bundle-sdk/components/ambient-light/ -->

[**Type** : "mp.ambientLight"

**Inputs**

Property| Type| **enabled**|  boolean — default `true`  
If true the ambient light is active in the scene.| **color**| { r: number, g: number, b: number } — default `{ r: 0.2, g: 0.2, b: 0.2 }`  
The color of the ambient light. Each color component is a number between 0 and 1.| **intensity**|  number — default `1.0`  
The light intensity.  
---|---  
      
    
    var [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    var node = sceneObject.addNode();  
    
    
    var initial = {  
    
    
      enabled: false,  
    
    
      color: {  
    
    
        r: 1, g: 0, b: 0  
    
    
      },  
    
    
      intensity: 0.8,  
    
    
    };  
    
    
      
    
    
    node.addComponent('mp.ambientLight', initial);  
    
    
    node.start();  
    
