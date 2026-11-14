<!-- source: https://developers.matterport.com/reference/scene/ -->

On this page

The Scene namespace is currently only available for Bundle SDK distributions. [Learn more about the Bundle SDK](https://matterport.github.io/showcase-sdk/sdkbundle_home.html)

Interfaces

  * [EmitPath](/reference/scene/emitpath/)
  * [EventPath](/reference/scene/eventpath/)
  * [IComponent](/reference/scene/icomponent/)
  * [IComponentContext](/reference/scene/icomponentcontext/)
  * [IComponentDesc](/reference/scene/icomponentdesc/)
  * [IComponentEventSpy](/reference/scene/icomponenteventspy/)
  * [IComponentRuntimeMembers](/reference/scene/icomponentruntimemembers/)
  * [INode](/reference/scene/inode/)
  * [InputPath](/reference/scene/inputpath/)
  * [IObject](/reference/scene/iobject/)
  * [ISceneObjectSpy](/reference/scene/isceneobjectspy/)
  * [OutputPath](/reference/scene/outputpath/)
  * [PathBase](/reference/scene/pathbase/)
  * [PathInfo](/reference/scene/pathinfo/)



Types

  * ComponentProperties
  * EmitPathDescriptor
  * EventPathDescriptor
  * IComponentBase
  * IComponentFactory
  * IComponentThis
  * InputPathDescriptor
  * InteractionEvent
  * LightComponentCommonOptions
  * LoaderCommonOptions
  * OutputPathDescriptor
  * PredefinedOutputs
  * SceneComponentName
  * SceneComponentOptions



Enumerations

  * Component
  * InteractionType
  * PathType



Properties

  * THREE



Methods

  * configure
  * createNode
  * createNodes
  * createObjects
  * deserialize
  * register
  * registerComponents
  * serialize
  * unregisterComponents



## Types​

### ComponentProperties​

ComponentProperties: _Record <string, unknown>_

Default shape for a component's `inputs` / `outputs` dictionary: string-keyed properties of arbitrary value.
    
    
    type ComponentProperties = Record<string, unknown>  
    

### EmitPathDescriptor​

EmitPathDescriptor: _object_

A descriptor for an emit component property contained by a scene object.

Property| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
The component with the property.| id| string  
The user defined id of the path. This id must be a unique string for the scene object.| node| [Scene.INode](/reference/scene/inode/)  
The parent scene node of the component.| property| string  
The property name of the component.| type| PathType.EMIT  
The type of the path: PathType.EMIT  
---|---  
  
### EventPathDescriptor​

EventPathDescriptor: _object_

A descriptor for an event component property contained by a scene object.

Property| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
The component with the property.| id| string  
The user defined id of the path. This id must be a unique string for the scene object.| node| [Scene.INode](/reference/scene/inode/)  
The parent scene node of the component.| property| string  
The property name of the component.| type| PathType.EVENT  
The type of the path: PathType.EVENT  
---|---  
  
### IComponentBase​

IComponentBase<Inputs, Outputs>: _object_

Bundle

Defines a scene component's inputs, outputs, events, emits, and lifecycle hooks. The SDK augments each instance with runtime members at {@link INode.addComponent} time to produce a full {@link IComponent}.

Property| Type| emits?| Record<string, boolean> | undefined  
An optional dictionary of events emitted by this component. Setting an emit to a falsy value will prevent the component from emitting the event when using .notify. These properties can be changed by an external source at any time. If this dictionary is omitted, any and all events will be emitted from .notify.| events?| Record<string, boolean> | undefined  
An optional dictionary of events that this component handles through its onEvent. Setting an event to a falsy value temporarily stops this component from receiving said event.| inputs?| Inputs | undefined  
An optional dictionary of properties that affects the behavior of the component. These properties can be changed by an external source at any time. It is up to the component to respond appropriately to the changes. These input properties can also be bind targets to an observable source e.g. the output property of another component.| isMeasurable?| boolean | undefined  
Whether the outputs.collider of this component will be one of the meshes considered for intersection testing in the measurement tool. Put simply, is this component measurable. Manual and more granular control of pointer intersection can be done by setting the .userData.isMeasurable on each THREE.js mesh.| outputs?| Partial<Outputs> | undefined  
The values this component publishes. Declare any you have at registration; populate the rest from lifecycle hooks like onInit, where you can derive computed state. Observable; can serve as a bind source. objectRoot and collider are reserved keys: the value set to objectRoot is added to the scene graph as a child of the scene node, and the value set to collider is included in raycast hit detection.
    
    
    function Box() {  
       this.onInit = function() {  
         var THREE = this.context.three;  
         var geometry = new THREE.BoxGeometry(1, 1, 1);  
         this.material = new THREE.MeshBasicMaterial();  
         var mesh = new THREE.Mesh( geometry, this.material );  
      
         this.outputs.objectRoot = mesh;   // gets added to the scene node  
         this.outputs.collider = mesh;     // will now be part of raycast testing  
       }  
    }  
      
  
---|---  
  
### IComponentFactory​

IComponentFactory<Inputs, Outputs>: _function_

Bundle

The factory-function form accepted by {@link Scene.register}. The SDK calls it once per instance to produce a fresh {@link IComponentBase}. The `ThisType` annotation on the return type makes `this` inside lifecycle methods type as {@link IComponentThis}.

Enable `noImplicitThis` (or `strict`) for a typed `this` in lifecycle methods.
    
    
    type IComponentFactory<Inputs, Outputs> = () => IComponentBase<Inputs, Outputs> & ThisType<IComponentThis<Inputs, Outputs>>  
    

### IComponentThis​

IComponentThis<Inputs, Outputs>: _intersection_

The type of `this` inside {@link IComponentBase} lifecycle methods. Used to type `this` when extracting a lifecycle body into a standalone helper with typed inputs and outputs.
    
    
    function handleTick(this: Scene.IComponentThis<{ speed: number }, { position: THREE.Vector3 }>) {  
    
    
      this.outputs.position.x += this.inputs.speed;  
    
    
    }  
    
    
    
    type IComponentThis<Inputs, Outputs> = IComponentBase<Inputs, Outputs> & IComponentRuntimeMembers & { inputs: Inputs; outputs: Outputs & PredefinedOutputs; events: Record<string, boolean>; }  
    

### InputPathDescriptor​

InputPathDescriptor: _object_

A descriptor for an input component property contained by a scene object.

Property| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
The component with the property.| id| string  
The user defined id of the path. This id must be a unique string for the scene object.| node| [Scene.INode](/reference/scene/inode/)  
The parent scene node of the component.| property| string  
The property name of the component.| type| PathType.INPUT  
The type of the path: PathType.INPUT  
---|---  
  
### InteractionEvent​

InteractionEvent: _object_

The payload for a 3D interaction event.

Property| Type| collider| THREE.Object3D| hover?| boolean | undefined| input| unknown| normal| THREE.Vector3 | null| point| THREE.Vector3 | null  
---|---  
  
### LightComponentCommonOptions​

LightComponentCommonOptions: _object_

Property| Type| color?| [Color](/reference/#type-color) | undefined  
The color of the light. Each color component is a number between 0 and 1. Default { r: 1.0, g: 1.0, b: 1.0 }| enabled?| boolean | undefined  
If true the ambient light is active in the scene. Default true| intensity?| number | undefined  
The light intensity. Default 1.0 for ambient lights, 2 for others.  
---|---  
  
### LoaderCommonOptions​

LoaderCommonOptions: _object_

Property| Type| colliderEnabled?| boolean | undefined  
When set, the collider output is set to the loaded model. Default true| localPosition?| [Vector3](/reference/#type-vector3) | undefined  
The local offset of the model. Default { x: 0, y: 0, z: 0 }| localRotation?| [Vector3](/reference/#type-vector3) | undefined  
The local rotation of the model in euler angles. Default { x: 0, y: 0, z: 0 }| localScale?| [Vector3](/reference/#type-vector3) | undefined  
The local scale of the model. Default { x: 1, y: 1, z: 1 }| url?| string | undefined  
The url to the file. Default ''| visible?| boolean | undefined  
If true, the model is visible. Default true  
---|---  
  
### OutputPathDescriptor​

OutputPathDescriptor: _object_

A descriptor for an output component property contained by a scene object.

Property| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
The component with the property.| id| string  
The user defined id of the path. This id must be a unique string for the scene object.| node| [Scene.INode](/reference/scene/inode/)  
The parent scene node of the component.| property| string  
The property name of the component.| type| PathType.OUTPUT  
The type of the path: PathType.OUTPUT  
---|---  
  
### PredefinedOutputs​

PredefinedOutputs: _object_

Property| Type| collider| THREE.Object3D | null  
Set this to any Object3D and it will be interactable. See [IComponent.onEvent](/reference/scene/icomponent/#onevent)| objectRoot| THREE.Object3D | null  
Set this to any Object3D and it will be added to the scene.  
---|---  
  
### SceneComponentName​

SceneComponentName: _${Scene.Component} | (string & {})_
    
    
    type SceneComponentName = `${Component}` | (string & {})  
    

### SceneComponentOptions​

SceneComponentOptions: _union_

## Enumerations​

### Component​

Component: _enum_

Member| Value| AMBIENT_LIGHT| "mp.ambientLight"| CAMERA| "mp.camera"| DAE_LOADER| "mp.daeLoader"| DIRECTIONAL_LIGHT| "mp.directionalLight"| FBX_LOADER| "mp.fbxLoader"| GLTF_LOADER| "mp.gltfLoader"| INPUT| "mp.input"| LIGHTS_COMPONENT| "mp.lights"| OBJ_LOADER| "mp.objLoader"| POINT_LIGHT| "mp.pointLight"| SCROLLING_TUBE| "mp.scrollingTube"| TRANSFORM_CONTROLS| "mp.transformControls"| XR| "mp.xr"  
---|---  
  
### InteractionType​

InteractionType: _enum_

Member| Value| CLICK| "INTERACTION.CLICK"  
CLICK events| DRAG| "INTERACTION.DRAG"  
DRAG events (mousedown then move)| DRAG_BEGIN| "INTERACTION.DRAG_BEGIN"| DRAG_END| "INTERACTION.DRAG_END"| HOVER| "INTERACTION.HOVER"  
HOVER events| KEY| "INTERACTION.KEY"| LONG_PRESS_END| "INTERACTION.LONG_PRESS_END"| LONG_PRESS_START| "INTERACTION.LONG_PRESS_START"| MULTI_SWIPE| "INTERACTION.MULTI_SWIPE"| MULTI_SWIPE_END| "INTERACTION.MULTI_SWIPE_END"| PINCH| "INTERACTION.PINCH"| PINCH_END| "INTERACTION.PINCH_END"| POINTER_BUTTON| "INTERACTION.POINTER_BUTTON"| POINTER_MOVE| "INTERACTION.POINTER_MOVE"| ROTATE| "INTERACTION.ROTATE"| ROTATE_END| "INTERACTION.ROTATE_END"| SCROLL| "INTERACTION.SCROLL"  
---|---  
  
### PathType​

PathType: _enum_

The type of a path with regards to which property of a component it represents

Member| Value| EMIT| "emit"| EVENT| "event"| INPUT| "input"| OUTPUT| "output"  
---|---  
  
## Properties​

### THREE​

THREE: typeof Scene.THREE

Bundle

Direct access to the three.js instance used by Showcase.

The type `typeof THREE` is resolved from the `three` npm package's type definitions. Install `three` (or `@types/three`) in your project for full type support.
    
    
    const THREE = sdk.Scene.THREE;  
    
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);  
    

## Methods​

### configure​

configure(callback: (renderer: THREE.WebGLRenderer, three: typeof Scene.THREE, effectComposer: EffectComposer | null) => void): Promise<void>

Bundle

This is a convenience function that provides access to three.js framework objects. Typically used to configure global properties on the renderer or effect composer.
    
    
    await sdk.Scene.configure(function(renderer, three, effectComposer){  
    
    
      // configure PBR  
    
    
      renderer.physicallyCorrectLights = true;  
    
    
      
    
    
      // configure shadow mapping  
    
    
      renderer.shadowMap.enabled = true;  
    
    
      renderer.shadowMap.bias = 0.0001;  
    
    
      renderer.shadowMap.type = three.PCFSoftShadowMap;  
    
    
      
    
    
      if (effectComposer) {  
    
    
        // add a custom pass here  
    
    
      }  
    
    
    });  
    

Parameter| Type| callback| (renderer: THREE.WebGLRenderer, three: typeof Scene.THREE, effectComposer: EffectComposer | null) => void  
A function that receives the following arguments: renderer: Matterport's WebGLRenderer object. three: three.js module. effectComposer: Matterport's EffectComposer object. This value can be null. To enable the effect composer, you must set useEffectComposer: 1 in your application config. Please note that enabling effect composer disables renderer.antialias (&aa=1)  
---|---  
  
**Returns:** `Promise`<void>

### createNode​

createNode(): Promise<[Scene.INode](/reference/scene/inode/)>

Bundle

deprecated Use `createObjects` to create an object to then create nodes instead.

Creates a scene node.

**Returns:** `Promise`<[Scene.INode](/reference/scene/inode/)>

A promise that resolves with the new scene node.

### createNodes​

createNodes(count: number): Promise<[Scene.INode](/reference/scene/inode/)[]>

Bundle

deprecated Use `createObjects` to create an object to then create nodes instead.

Creates an array of scene nodes.

Parameter| Type| count| number  
The number of scene nodes to create.  
---|---  
  
**Returns:** `Promise`<[Scene.INode](/reference/scene/inode/)[]>

A promise that resolves with the array of scene nodes.

### createObjects​

createObjects(count: number): Promise<[Scene.IObject](/reference/scene/iobject/)[]>

Bundle

Creates an array of scene objects.

Parameter| Type| count| number  
The number of scene objects to create.  
---|---  
  
**Returns:** `Promise`<[Scene.IObject](/reference/scene/iobject/)[]>

A promise that resolves with the array of scene objects.
    
    
    // create a single object and destructure it from the returned array  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    // ...  
    

### deserialize​

deserialize(text: string): Promise<[Scene.IObject](/reference/scene/iobject/)>

Bundle

This function returns a scene object with all of its scene nodes from a serialized scene. The returned scene object has not been started yet.

Parameter| Type| text| string  
The serialized scene.  
---|---  
  
**Returns:** `Promise`<[Scene.IObject](/reference/scene/iobject/)>

A promise that resolves with a scene object.

### register​

register(name: string, fn: Scene.IComponentFactory<Inputs, Outputs>): Promise<[IDisposable](/reference/idisposable/) | null>

Bundle

Register a component factory. The SDK calls `fn()` once per instance to produce a fresh {@link Scene.IComponentBase}, then augments it into a full {@link Scene.IComponent} (attaching `this.context`, `this.notify`, etc.) before delivering it to scene nodes.
    
    
    sdk.Scene.register('myapp.box', () => ({  
    
    
      inputs: { visible: true },  
    
    
      outputs: {},  
    
    
      onInit() {  
    
    
        const THREE = this.context.three;  
    
    
        this.outputs.objectRoot = new THREE.Mesh(  
    
    
          new THREE.BoxGeometry(1, 1, 1),  
    
    
          new THREE.MeshBasicMaterial(),  
    
    
        );  
    
    
      },  
    
    
    }));  
    

Once registered, add instances to a scene node with `node.addComponent('myapp.box')`.

Parameter| Type| name| string  
A unique component name.| fn| Scene.IComponentFactory<Inputs, Outputs>  
A function that returns a new {@link Scene.IComponentBase} each time it is called.  
---|---  
  
**Returns:** `Promise`<[IDisposable](/reference/idisposable/) | null>

a disposable that can be used to unregister the component.

### registerComponents​

registerComponents(components: [Scene.IComponentDesc](/reference/scene/icomponentdesc/)[]): Promise<[IDisposable](/reference/idisposable/)[] | null>

Bundle

Register multiple components in a single call. Each entry pairs a component name with an {@link Scene.IComponentFactory} factory. Returns a disposable per entry; disposing unregisters that component.
    
    
    const disposables = await sdk.Scene.registerComponents([  
    
    
      { name: 'myapp.box', factory: () => ({ outputs: {}, onInit() { ... } }) },  
    
    
      { name: 'myapp.legacyWidget', factory: () => new LegacyWidget() },  
    
    
    ]);  
    
    
      
    
    
    // when you are done with the components, you can unregister the components by calling dispose on each item in the return result.  
    
    
    for (const disposable of disposables) {  
    
    
      disposable.dispose();  
    
    
    }  
    
    
      
    

Parameter| Type| components| [Scene.IComponentDesc](/reference/scene/icomponentdesc/)[]  
An array of [`IComponentDesc`](/reference/scene/icomponentdesc)  
---|---  
  
**Returns:** `Promise`<[IDisposable](/reference/idisposable/)[] | null>

an array of disposables that unregister the components when disposed.

### serialize​

serialize: _method_ — _2 overloads_

serialize(sceneObject: [Scene.IObject](/reference/scene/iobject/)): Promise<string>

Bundle

Serialize a scene object, its nodes, and their components to a string.

Parameter| Type| sceneObject| [Scene.IObject](/reference/scene/iobject/)  
the scene object to serialize  
---|---  
  
**Returns:** `Promise`<string>

A promise that resolves with the serialized string.

serialize(sceneNodes: [Scene.INode](/reference/scene/inode/)[]): Promise<string>

Bundle

deprecated Prefer to serialize an array of `Scene.INode` through their containing `Scene.IObject` instead.

This function serializes an array of scene nodes and their components to a string. This function is only provided to provide an upgrade path from nodes that were created before the introduction of `IObject`s.

Parameter| Type| sceneNodes| [Scene.INode](/reference/scene/inode/)[]  
An array of scene nodes.  
---|---  
  
**Returns:** `Promise`<string>

A promise that resolves with the serialized string.

### unregisterComponents​

unregisterComponents(components: [Scene.IComponentDesc](/reference/scene/icomponentdesc/)[]): Promise<void>

Parameter| Type| components| [Scene.IComponentDesc](/reference/scene/icomponentdesc/)[]  
---|---  
  
**Returns:** `Promise`<void>

  * Interfaces
    * [EmitPath](/reference/scene/emitpath/)
    * [EventPath](/reference/scene/eventpath/)
    * [IComponent](/reference/scene/icomponent/)
    * [IComponentContext](/reference/scene/icomponentcontext/)
    * [IComponentDesc](/reference/scene/icomponentdesc/)
    * [IComponentEventSpy](/reference/scene/icomponenteventspy/)
    * [IComponentRuntimeMembers](/reference/scene/icomponentruntimemembers/)
    * [INode](/reference/scene/inode/)
    * [InputPath](/reference/scene/inputpath/)
    * [IObject](/reference/scene/iobject/)
    * [ISceneObjectSpy](/reference/scene/isceneobjectspy/)
    * [OutputPath](/reference/scene/outputpath/)
    * [PathBase](/reference/scene/pathbase/)
    * [PathInfo](/reference/scene/pathinfo/)
  * Types
    * ComponentProperties
    * EmitPathDescriptor
    * EventPathDescriptor
    * IComponentBase
    * IComponentFactory
    * IComponentThis
    * InputPathDescriptor
    * InteractionEvent
    * LightComponentCommonOptions
    * LoaderCommonOptions
    * OutputPathDescriptor
    * PredefinedOutputs
    * SceneComponentName
    * SceneComponentOptions
  * Enumerations
    * Component
    * InteractionType
    * PathType
  * Properties
    * THREE
  * Methods
    * configure
    * createNode
    * createNodes
    * createObjects
    * deserialize
    * register
    * registerComponents
    * serialize
    * unregisterComponents



  * Types
    * ComponentProperties
    * EmitPathDescriptor
    * EventPathDescriptor
    * IComponentBase
    * IComponentFactory
    * IComponentThis
    * InputPathDescriptor
    * InteractionEvent
    * LightComponentCommonOptions
    * LoaderCommonOptions
    * OutputPathDescriptor
    * PredefinedOutputs
    * SceneComponentName
    * SceneComponentOptions
  * Enumerations
    * Component
    * InteractionType
    * PathType
  * Properties
    * THREE
  * Methods
    * configure
    * createNode
    * createNodes
    * createObjects
    * deserialize
    * register
    * registerComponents
    * serialize
    * unregisterComponents


