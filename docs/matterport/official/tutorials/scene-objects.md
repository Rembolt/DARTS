<!-- source: https://developers.matterport.com/tutorials/scene-objects/ -->

On this page

Now that you're familiar with [creating a scene](/tutorials/scene/intro/) and [connecting components](/tutorials/scene/connecting-components/), let's put it all together with some practical examples.

The Bundle SDK includes several built-in scene components — such as the [GLTF Loader](/bundle-sdk/components/gltf-loader/), [Directional Light](/bundle-sdk/components/directional-light/), and [Ambient Light](/bundle-sdk/components/ambient-light/) — to help you get started quickly. The examples below demonstrate how to use them in practice.

## Loading a 3D model​

This example creates a scene object, loads a GLTF model, and adds lighting.

### 1. Create the scene and load the model​
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
      
    
    
    const gltfNode = sceneObject.addNode();  
    
    
    gltfNode.position.set(0, -0.68, 0);  
    
    
      
    
    
    const gltfComponent = gltfNode.addComponent('mp.gltfLoader', {  
    
    
      url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Parrot.glb',  
    
    
      localScale: { x: 0.03, y: 0.03, z: 0.03 },  
    
    
    });  
    

### 2. Add lighting​
    
    
    const lightsNode = sceneObject.addNode();  
    
    
      
    
    
    const directionalLight = lightsNode.addComponent('mp.directionalLight', {  
    
    
      color: { r: 0.7, g: 0.7, b: 0.7 },  
    
    
    });  
    
    
      
    
    
    lightsNode.addComponent('mp.ambientLight', {  
    
    
      intensity: 0.5,  
    
    
      color: { r: 1.0, g: 1.0, b: 1.0 },  
    
    
    });  
    

### 3. Set up input paths and start​

Input paths provide a public interface to control component properties from outside the scene object.
    
    
    sceneObject.addInputPath(gltfComponent, 'url', 'gltfUrl');  
    
    
    const intensityPath = sceneObject.addInputPath(directionalLight, 'intensity', 'ambientIntensity');  
    
    
      
    
    
    sceneObject.start();  
    

## Animating properties​

Once a scene object is running, you can animate its properties through input paths. This example pulses the directional light intensity between 0.5 and 3.0:
    
    
    let intensity = 1;  
    
    
    let direction = 1;  
    
    
    const max = 3;  
    
    
    const min = 0.5;  
    
    
    const step = 0.02;  
    
    
      
    
    
    setInterval(() => {  
    
    
      intensity += step * direction;  
    
    
      
    
    
      if (intensity >= max || intensity <= min) {  
    
    
        intensity = Math.max(min, Math.min(max, intensity));  
    
    
        direction *= -1;  
    
    
      }  
    
    
      
    
    
      intensityPath.set(intensity);  
    
    
    }, 15);  
    

## Serialization​

Scene objects can be serialized to JSON, making it possible to save and restore configurations without manually reconstructing nodes and components.

### Saving​
    
    
    const json = await sdk.Scene.serialize(sceneObject);  
    

### Restoring​
    
    
    const restored = await sdk.Scene.deserialize(json);  
    
    
    restored.start();  
    

### Accessing paths after deserialization​

After deserializing, use the path iterator to find previously defined input paths by their IDs:
    
    
    let intensityPath: MpSdk.Scene.InputPath;  
    
    
    let gltfUrlPath: MpSdk.Scene.InputPath;  
    
    
      
    
    
    for (const { desc, path } of restored.pathIterator()) {  
    
    
      if (desc.id === 'ambientIntensity') intensityPath = path;  
    
    
      if (desc.id === 'gltfUrl') gltfUrlPath = path;  
    
    
    }  
    
    
      
    
    
    // Update properties via paths  
    
    
    intensityPath.set(1.5);  
    
    
    gltfUrlPath.set('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Stork.glb');  
    

## Putting it all together​

Here's the complete example — creating a scene, loading a model, adding lights, animating a property, and serializing the result:
    
    
    // Create the scene and load a GLTF model  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
      
    
    
    const gltfNode = sceneObject.addNode();  
    
    
    gltfNode.position.set(0, -0.68, 0);  
    
    
      
    
    
    const gltfComponent = gltfNode.addComponent('mp.gltfLoader', {  
    
    
      url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Parrot.glb',  
    
    
      localScale: { x: 0.03, y: 0.03, z: 0.03 },  
    
    
    });  
    
    
      
    
    
    // Add lighting  
    
    
    const lightsNode = sceneObject.addNode();  
    
    
      
    
    
    const directionalLight = lightsNode.addComponent('mp.directionalLight', {  
    
    
      color: { r: 0.7, g: 0.7, b: 0.7 },  
    
    
    });  
    
    
      
    
    
    lightsNode.addComponent('mp.ambientLight', {  
    
    
      intensity: 0.5,  
    
    
      color: { r: 1.0, g: 1.0, b: 1.0 },  
    
    
    });  
    
    
      
    
    
    // Set up input paths and start  
    
    
    sceneObject.addInputPath(gltfComponent, 'url', 'gltfUrl');  
    
    
    const intensityPath = sceneObject.addInputPath(directionalLight, 'intensity', 'ambientIntensity');  
    
    
      
    
    
    sceneObject.start();  
    
    
      
    
    
    // Animate the light intensity  
    
    
    let intensity = 1;  
    
    
    let direction = 1;  
    
    
    const max = 3;  
    
    
    const min = 0.5;  
    
    
    const step = 0.02;  
    
    
      
    
    
    setInterval(() => {  
    
    
      intensity += step * direction;  
    
    
      
    
    
      if (intensity >= max || intensity <= min) {  
    
    
        intensity = Math.max(min, Math.min(max, intensity));  
    
    
        direction *= -1;  
    
    
      }  
    
    
      
    
    
      intensityPath.set(intensity);  
    
    
    }, 15);  
    
    
      
    
    
    // Serialize for later use  
    
    
    const json = await sdk.Scene.serialize(sceneObject);  
    

  * Loading a 3D model
    * 1. Create the scene and load the model
    * 2. Add lighting
    * 3. Set up input paths and start
  * Animating properties
  * Serialization
    * Saving
    * Restoring
    * Accessing paths after deserialization
  * Putting it all together


