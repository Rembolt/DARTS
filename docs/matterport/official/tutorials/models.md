<!-- source: https://developers.matterport.com/tutorials/models/ -->

On this page

The Showcase Bundle SDK supports loading dae, fbx, obj and gltf scene and model assets. Internally, we use the three.js asset loaders. The loader components download and instantiate the models within the matterport scene. We will be using `async/await` instead of promises in the following examples.

## Select a model​

The following is a list of urls that you can use for this tutorial.

Type| Component| Scale| URL| gltf binary| `GLTF_LOADER`| 0.01| [Duck.glb](https://github.com/KhronosGroup/glTF-Sample-Models/blob/master/2.0/Duck/glTF-Binary/Duck.glb)| gltf| `GLTF_LOADER`| 0.01| [CesiumMan.gltf](https://github.com/KhronosGroup/glTF-Sample-Models/blob/master/2.0/CesiumMan/glTF/CesiumMan.gltf)| obj| `OBJ_LOADER`| 0.01| [female02.obj](https://github.com/mrdoob/three.js/blob/dev/examples/models/obj/female02/female02.obj) ([.mtl](https://github.com/mrdoob/three.js/blob/dev/examples/models/obj/female02/female02.mtl))| dae| `DAE_LOADER`| 0.3| [stormtrooper.dae](https://github.com/mrdoob/three.js/blob/dev/examples/models/collada/stormtrooper/stormtrooper.dae)| fbx| `FBX_LOADER`| 0.00002| [stanford-bunny.fbx](https://github.com/mrdoob/three.js/blob/dev/examples/models/fbx/stanford-bunny.fbx)  
---|---|---|---  
  
## Setup your scene​

Add some lights to your scene, otherwise, your models will be black. We provide a basic lighting component.

Start after [](https://github.com/matterport/showcase-sdk-tutorial/blob/master/src/index.ts#L25)<https://github.com/matterport/showcase-sdk-tutorial/blob/master/src/index.ts#L25>
    
    
    const [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    const lights = sceneObject.addNode();  
    
    
    lights.addComponent('mp.lights');  
    
    
    lights.start();  
    

## Add your component to the scene node​

The component type will depend on the model you choose. We will use the stanford bunny.
    
    
    const modelNode = sceneObject.addNode();  
    
    
      
    
    
    // Store the fbx component since we will need to adjust it in the next step.  
    
    
    const fbxComponent = modelNode.addComponent(sdk.Scene.Component.FBX_LOADER, {  
    
    
      url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/fbx/stanford-bunny.fbx',  
    
    
    });  
    

## Scale your model​

Some models aren't calibrated to real world units so you may have to adjust the model to be a more realistic size. We provide an adjustable position, rotation and scale for each model instance. See the inputs property for [FbxLoader](/bundle-sdk/components/fbx-loader/).
    
    
    fbxComponent.inputs.localScale = {  
    
    
      x: 0.00002,  
    
    
      y: 0.00002,  
    
    
      z: 0.00002  
    
    
    };  
    

## Position your model within view​

We will lower the scene node a bit. The default position is 0, 0, 0
    
    
    modelNode.position.set(0,-1,0); // drop ~3 feet  
    

## Start it​

See [SDK Architecture - Scene Nodes](/bundle-sdk/architecture/#scene-nodes) for an explanation of what happens when you start a scene node.
    
    
    modelNode.start();  
    

## Animate it​

We would like to see all sides of the model so we will rotate the bunny around the **Y** axis.
    
    
    const axis = new THREE.Vector3(0, 1, 0);  
    
    
    const tick = function() {  
    
    
      requestAnimationFrame(tick);  
    
    
      modelNode.quaternion.multiply(  
    
    
        new THREE.Quaternion().setFromAxisAngle(axis, 0.02)  
    
    
      );  
    
    
    }  
    
    
    tick();  
    

## Launch your browser​

Launch [](http://localhost:8000/)<http://localhost:8000/>

You may see a delay at startup since the showcase tries to preload geometry and textures.

![Tutorial model 1](/assets/images/tutorial_model_1-377c2ac76c4a0a4ae7455de3e200c590.png)

_Rotating Bunny_

  * Select a model
  * Setup your scene
  * Add your component to the scene node
  * Scale your model
  * Position your model within view
  * Start it
  * Animate it
  * Launch your browser


