<!-- source: https://developers.matterport.com/bundle-sdk/components/transform-controls/ -->

On this page

## Type: mp.transformControls​

### Inputs​

Property| Type| **mode**|  string — default `'translate'`  
The transformation mode. Valid values are 'translate', 'rotate' and 'scale'.| **selection**|  ISceneNode | null — default `null`  
The node being controlled by this component.| **showX**|  boolean — default `true`  
X axis control visibility.| **showY**|  boolean — default `true`  
Y axis control visibility.| **showZ**|  boolean — default `true`  
Z axis control visibility.| **size**|  number — default `1`  
The size of the transform control.  
---|---  
  
### Usage​

This component wraps the three.js [transform controls component](https://threejs.org/docs/#examples/en/controls/TransformControls)

It can be used to change the position, orientation, or scale of a **scene node**.

The controls are only visible when they are attached to an object by setting its `input.selection`. A `null` value will hide the controls.

Please take note that transform controls will appear at the center of a node and if a 3D Object has a local transformation, the transform controls will not be aligned with your 3D Object.
    
    
    // Create a scene object and node with a model component.  
    
    
    // This node's transform will be changed by the transform control.  
    
    
    const [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    const modelNode = sceneObject.addNode();  
    
    
    modelNode.addComponent('mp.gltfLoader', {  
    
    
      url: "http://test.com/bunny.gltf",  
    
    
    });  
    
    
      
    
    
    // Create a scene node with a transform control component.  
    
    
    const node = sceneObject.addNode();  
    
    
    const myControl = node.addComponent('mp.transformControls', {  
    
    
      mode: 'translate',  
    
    
    });  
    
    
    node.start();  
    
    
      
    
    
    // Attach the model to the transform control  
    
    
    myControl.inputs.selection = modelNode;  
    
    
      
    

![SDK Bundle transform controls](/assets/images/sdkbundle-components-transform-controls-946fdd57716eca36ca5c526d575a758f.png)

  * Type: mp.transformControls
    * Inputs
    * Usage


