<!-- source: https://developers.matterport.com/reference/conversion/ -->

On this page

Namespaces

  * [TransformType](/reference/conversion/transformtype/)



Methods

  * basisChange
  * worldToScreen



## Methods​

### basisChange​

basisChange: _method_ — _2 overloads_

basisChange(operand: [Vector3](/reference/#type-vector3), operation: [Conversion.TransformType.Coordinates](/reference/conversion/transformtype/#enum-coordinates)): [Vector3](/reference/#type-vector3)

Converts a 3D position or rotation between API and SDK orientations

Parameter| Type| operand| [Vector3](/reference/#type-vector3)| operation| [Conversion.TransformType.Coordinates](/reference/conversion/transformtype/#enum-coordinates)  
---|---  
  
**Returns:** [Vector3](/reference/#type-vector3)

An object containing the conversion functions for each operator
    
    
    // Convert API Coordinates to SDK Coordinates:  
    
    
    const apiCoords: Vector3 = { x: 1, y: 2, z: 3 };  
    
    
    const conversionFunction = mpSdk.Conversion.TransformType.Coordinates.TO_SDK;  
    
    
    const sdkCoords: Vector3 = mpSdk.Conversion.basisChange(apiCoords, conversionFunction);  
    
    
      
    
    
    // Convert SDK Sweep Rotation to API Sweep Rotation:  
    
    
    const sdkSweepRotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };  
    
    
    const conversionFunction = mpSdk.Conversion.TransformType.SweepRotation.TO_API;  
    
    
    const apiSweepRotation: Quaternion = mpSdk.Conversion.basisChange(sdkSweepRotation, conversionFunction);  
    

basisChange(operand: [Quaternion](/reference/#type-quaternion), operation: [Conversion.TransformType.SweepRotation](/reference/conversion/transformtype/#enum-sweeprotation) | [Conversion.TransformType.CameraRotation](/reference/conversion/transformtype/#enum-camerarotation)): [Quaternion](/reference/#type-quaternion)

Parameter| Type| operand| [Quaternion](/reference/#type-quaternion)| operation| [Conversion.TransformType.SweepRotation](/reference/conversion/transformtype/#enum-sweeprotation) | [Conversion.TransformType.CameraRotation](/reference/conversion/transformtype/#enum-camerarotation)  
---|---  
  
**Returns:** [Quaternion](/reference/#type-quaternion)

### worldToScreen​

worldToScreen(worldPos: [Vector3](/reference/#type-vector3), cameraPose: [Camera.Pose](/reference/camera/#type-pose), windowSize: [Size](/reference/#type-size), result?: [Vector3](/reference/#type-vector3)): [Vector3](/reference/#type-vector3)

Converts a position of an object in 3d to the pixel coordinate on the screen

Parameter| Type| worldPos| [Vector3](/reference/#type-vector3)  
Position of the object| cameraPose| [Camera.Pose](/reference/camera/#type-pose)  
The current pose of the Camera as received from Camera.pose.subscribe| windowSize| [Size](/reference/#type-size)  
The current size of the Showcase player| result?| [Vector3](/reference/#type-vector3)  
An optional, pre-allocated Vector3 to store the result  
---|---  
  
**Returns:** [Vector3](/reference/#type-vector3)

  * Namespaces
    * [TransformType](/reference/conversion/transformtype/)
  * Methods
    * basisChange
    * worldToScreen



  * Methods
    * basisChange
    * worldToScreen


