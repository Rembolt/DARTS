<!-- source: https://developers.matterport.com/reference/scene/iobject/ -->

On this page

A factory and container for a collection of scene nodes and components connected via property bindings.

Methods

  * addEmitPath
  * addEventPath
  * addInputPath
  * addNode
  * addNodes
  * addOutputPath
  * addPath
  * bind
  * bindPath
  * getValueAtPath
  * nodeIterator
  * pathIterator
  * setValueAtPath
  * spyOnEvent
  * start
  * stop



## Methods​

### addEmitPath​

addEmitPath(component: [Scene.IComponent](/reference/scene/icomponent/), property: string, id?: string): [Scene.EmitPath](/reference/scene/emitpath/)

_Introduced 3.1.71.14-0-gaf77add383_

Add and receive an [`EmitPath`](/reference/scene/emitpath/) for an [`IComponent`](/reference/scene/icomponent/). It is also possible to spy when an event is emitted by creating an [`ISceneObjectSpy`](/reference/scene/isceneobjectspy/) and calling `spyOnEvent`. The path can be bound to an [`EventPath`](/reference/scene/eventpath/) of another (or the same) component to automatically trigger the component's [`IComponent.onEvent`](/reference/scene/icomponent/#onevent).
    
    
     class Clickable {  
    
    
       public events = {  
    
    
         clicked: true,  
    
    
       };  
    
    
     }  
    
    
     // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)  
    
    
     const [object, node, component];  
    
    
      
    
    
     // create the path  
    
    
     const emitPath = object.addEmitPath(component, 'clicked');  
    
    
      
    
    
     // bind the emit path so that it triggers the `emitPath`'s associated component's onEvent when an event is emitted  
    
    
     object.bindPath(eventPath, emitPath);  
    
    
      
    
    
     // observe emissions of 'clicked' events in component  
    
    
     object.spyOnEvent({  
    
    
       path: emitPath,  
    
    
       onEvent(eventData) {  
    
    
         console.log(`a 'clicked' event was emitted with the data: ${eventData}`);  
    
    
       },  
    
    
     });  
    

Parameter| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
the component containing the emit property| property| string  
the name of the emit property| id?| string  
an optional unique identifier for the path  
---|---  
  
**Returns:** [Scene.EmitPath](/reference/scene/emitpath/)

### addEventPath​

addEventPath(component: [Scene.IComponent](/reference/scene/icomponent/), property: string, id?: string): [Scene.EventPath](/reference/scene/eventpath/)

_Introduced 3.1.71.14-0-gaf77add383_

Add and receive an [`EventPath`](/reference/scene/eventpath/) for an [`IComponent`](/reference/scene/icomponent/). The path can be bound to an [`EmitPath`](/reference/scene/emitpath/) of another (or the same) component to automatically trigger the component's [`IComponent.onEvent`](/reference/scene/icomponent/#onevent).
    
    
     class Renderable {  
    
    
       public events = {  
    
    
         rerender: true,  
    
    
       };  
    
    
     }  
    
    
     // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)  
    
    
     const [object, node, component];  
    
    
      
    
    
     // create the path  
    
    
     const eventPath = object.addEventPath(component, 'rerender');  
    
    
      
    
    
     // bind the event path so that it triggers the component's onEvent when `emitPath` emits an event  
    
    
     object.bindPath(eventPath, emitPath);  
    

Parameter| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
the component containing the event property| property| string  
the name of the event property| id?| string  
an optional unique identifier for the path  
---|---  
  
**Returns:** [Scene.EventPath](/reference/scene/eventpath/)

### addInputPath​

addInputPath(component: [Scene.IComponent](/reference/scene/icomponent/), property: string, id?: string): [Scene.InputPath](/reference/scene/inputpath/)

_Introduced 3.1.71.14-0-gaf77add383_

Add and receive an [`InputPath`](/reference/scene/inputpath/) to the property of an [`IComponent`](/reference/scene/icomponent/). The returned [`InputPath`](/reference/scene/inputpath/) can be used to read or set the value of `property` on `component`'s inputs. Changes to the value can also be observed by creating an [`ISceneObjectSpy`](/reference/scene/isceneobjectspy/) and calling `spyOnEvent`. The path can also be bound to an [`OutputPath`](/reference/scene/outputpath/) of another (or the same) component to automatically update a component's input value.
    
    
     class Counter {  
    
    
       public inputs = {  
    
    
         count: 1,  
    
    
       };  
    
    
     }  
    
    
     // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)  
    
    
     const [object, node, component];  
    
    
      
    
    
     // create the path  
    
    
     const inputPath = object.addInputPath(component, 'count');  
    
    
      
    
    
     // observe changes to the value of `inputs.count` in component  
    
    
     object.spyOnEvent({  
    
    
       path: inputPath,  
    
    
       onEvent(newValue) {  
    
    
         console.log(`component.input.count's new value is ${newValue}`);  
    
    
       },  
    
    
     });  
    
    
     // read and change the value of the input in the component  
    
    
     const countValue = inputPath.get();  
    
    
     inputPath.set(count + 1);  
    
    
      
    
    
    // bind the path to the value from another (output) path  
    
    
     object.bindPath(inputPath, outputPath);  
    

Parameter| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
the component containing the input property| property| string  
the name of the input property| id?| string  
an optional unique identifier for the path  
---|---  
  
**Returns:** [Scene.InputPath](/reference/scene/inputpath/)

### addNode​

addNode(id?: string): [Scene.INode](/reference/scene/inode/)

Adds a scene node to this scene object and returns it. If an id isn't provided, one will be autogenerated.

Parameter| Type| id?| string  
a optional unique id  
---|---  
  
**Returns:** [Scene.INode](/reference/scene/inode/)

The new scene node.

### addNodes​

addNodes(nodeCount: number): [Scene.INode](/reference/scene/inode/)[]

Create an array of scene nodes.

Parameter| Type| nodeCount| number  
the number of nodes to create. This value must be greater than zero.  
---|---  
  
**Returns:** [Scene.INode](/reference/scene/inode/)[]

An array of nodes.

### addOutputPath​

addOutputPath(component: [Scene.IComponent](/reference/scene/icomponent/), property: string, id?: string): [Scene.OutputPath](/reference/scene/outputpath/)

_Introduced 3.1.71.14-0-gaf77add383_

Add and receive an [`OutputPath`](/reference/scene/outputpath/) to the property of an [`IComponent`](/reference/scene/icomponent/). The returned [`OutputPath`](/reference/scene/outputpath/) can be used to read the value of `component`'s output `property`. Changes to the value can also be observed by creating an [`ISceneObjectSpy`](/reference/scene/isceneobjectspy/) and calling `spyOnEvent`. The path can also be bound to an [`InputPath`](/reference/scene/inputpath/) of another (or the same) component to automatically update a component's input value.
    
    
     class NumberGenerator {  
    
    
       public outputs = {  
    
    
         current: 1,  
    
    
       };  
    
    
     }  
    
    
     // create an `IObject`, add an `INode` and an `IComponent` to the node, see the relevant functions (createObject, addNode, addComponent)  
    
    
     const [object, node, component];  
    
    
      
    
    
     // create the path  
    
    
     const outputPath = object.addOutputPath(component, 'current');  
    
    
      
    
    
     // observe changes to the value of `outputs.current` in component  
    
    
     object.spyOnEvent({  
    
    
       path: outputPath,  
    
    
       onEvent(newValue) {  
    
    
         console.log(`component.output.current's new value is ${newValue}`);  
    
    
       },  
    
    
     });  
    
    
     // read and bind the value of the output to another component's input value  
    
    
     const currentValue = outputPath.get();  
    
    
     object.bindPath(inputPath, outputPath);  
    

Parameter| Type| component| [Scene.IComponent](/reference/scene/icomponent/)  
the component containing the output property| property| string  
the name of the output property| id?| string  
an optional unique identifier for the path  
---|---  
  
**Returns:** [Scene.OutputPath](/reference/scene/outputpath/)

### addPath​

addPath: _method_ — _4 overloads_

addPath(pathDesc: [InputPathDescriptor](/reference/scene/#type-inputpathdescriptor)): [Scene.InputPath](/reference/scene/inputpath/)

deprecated Use one of `addInputPath`, `addOutputPath`, `addEventPath`, or `addEmitPath`

Add a path identified by a unique string. They `pathDesc.type` will determine which path type is returned.

Parameter| Type| pathDesc| [InputPathDescriptor](/reference/scene/#type-inputpathdescriptor)  
The path descriptor to the component property.  
---|---  
  
**Returns:** [Scene.InputPath](/reference/scene/inputpath/)

addPath(pathDesc: [OutputPathDescriptor](/reference/scene/#type-outputpathdescriptor)): [Scene.OutputPath](/reference/scene/outputpath/)

Parameter| Type| pathDesc| [OutputPathDescriptor](/reference/scene/#type-outputpathdescriptor)  
---|---  
  
**Returns:** [Scene.OutputPath](/reference/scene/outputpath/)

addPath(pathDesc: [EventPathDescriptor](/reference/scene/#type-eventpathdescriptor)): [Scene.EventPath](/reference/scene/eventpath/)

Parameter| Type| pathDesc| [EventPathDescriptor](/reference/scene/#type-eventpathdescriptor)  
---|---  
  
**Returns:** [Scene.EventPath](/reference/scene/eventpath/)

addPath(pathDesc: [EmitPathDescriptor](/reference/scene/#type-emitpathdescriptor)): [Scene.EmitPath](/reference/scene/emitpath/)

Parameter| Type| pathDesc| [EmitPathDescriptor](/reference/scene/#type-emitpathdescriptor)  
---|---  
  
**Returns:** [Scene.EmitPath](/reference/scene/emitpath/)

### bind​

bind(targetComponent: [Scene.IComponent](/reference/scene/icomponent/), targetProp: string, sourceComponent: [Scene.IComponent](/reference/scene/icomponent/), sourceProp: string): void

deprecated Use `IObject.bindPath` instead.

Call this function to bind an input property of the target component to an output property of the source component between any nodes contained by this scene object.

Parameter| Type| targetComponent| [Scene.IComponent](/reference/scene/icomponent/)  
The component listening to property changes.| targetProp| string  
The component input property name.| sourceComponent| [Scene.IComponent](/reference/scene/icomponent/)  
The component broadcasting property changes.| sourceProp| string  
The component output property name.  
---|---  
  
### bindPath​

bindPath: _method_ — _2 overloads_

bindPath(inputPath: [Scene.InputPath](/reference/scene/inputpath/), outputPath: [Scene.OutputPath](/reference/scene/outputpath/)): void

Bind the value referenced by `inputPath` to the value of `outputPath`. As the value at `outputPath` changes, the value of `inputPath` will reflect it.
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
      
    
    
    // mp.objLoader has an outputs.visible property  
    
    
    const comp1 = node.addComponent('mp.objLoader');  
    
    
    const outputPath = sceneObject.addOutputPath(comp1, 'visible', 'objLoader-visible');  
    
    
      
    
    
    // myComponent has an inputs.toggleState property  
    
    
    const comp2 = node.addComponent('myComponent');  
    
    
    const inputPath = sceneObject.addInputPath(comp2, 'toggleState', 'myComponent-toggle');  
    
    
    sceneObject.bindPath(inputPath, outputPath);  
    
    
      
    
    
    node.start();  
    
    
    // comp1.inputs.visible will now always equal comp2.outputs.toggleState  
    

Parameter| Type| inputPath| [Scene.InputPath](/reference/scene/inputpath/)  
the input path to receive value updates| outputPath| [Scene.OutputPath](/reference/scene/outputpath/)  
the output path providing value updates  
---|---  
  
bindPath(eventPath: [Scene.EventPath](/reference/scene/eventpath/), emitPath: [Scene.EmitPath](/reference/scene/emitpath/)): void

Bind an event referenced by `eventPath` to a [`IComponent.notify`](/reference/scene/icomponent/#notify) call at `emitPath`
    
    
    const [sceneObject] = await sdk.Scene.createObject(1);  
    
    
    const node = sceneObject.addNode();  
    
    
      
    
    
    // myReceiver has an `onEvent` lifecycle function and an `events['do.update']` property  
    
    
    const receiver = node.addComponent(`myReceiver');  
    
    
    const eventPath = sceneObject.addEventPath(receiver, 'do.update', 'my-reciever-update');  
    
    
      
    
    
    // myEmitter calls notify with an 'updated' event and has an `emits['updated']` property  
    
    
    const emitter = node.addComponent('myEmitter');  
    
    
    const emitPath = sceneObject.addEmitPath(emitter, 'updated', 'my-component-updated');  
    
    
    sceneObject.bindPath(eventPath, emitPath);  
    
    
      
    
    
    node.start();  
    
    
    // receiver.onEvent('do.update', ...) will now be called whenever emitter calls notify('updated')  
    

Parameter| Type| eventPath| [Scene.EventPath](/reference/scene/eventpath/)  
the event path to receive emitted events| emitPath| [Scene.EmitPath](/reference/scene/emitpath/)  
the emit path that triggers events  
---|---  
  
### getValueAtPath​

getValueAtPath(pathId: string): unknown

deprecated Use [`InputPath.get`](/reference/scene/inputpath/#get) or [`OutputPath.get`](/reference/scene/outputpath/#get) instead.

Reads the output property of a path. The path must be added prior to calling this function.

Parameter| Type| pathId| string  
the path id to read from  
---|---  
  
**Returns:** unknown

the value of the output property.

### nodeIterator​

nodeIterator(): IterableIterator<[Scene.INode](/reference/scene/inode/)>

Returns in iterator iterating over all the nodes contained by this object.

**Returns:** `IterableIterator`<[Scene.INode](/reference/scene/inode/)>

### pathIterator​

pathIterator(): IterableIterator<[Scene.PathInfo](/reference/scene/pathinfo/)>

Returns an iterator containing a path and its descriptor. Typically used to access the paths from a deserialized scene object.
    
    
    // This example sets the values of all input paths provided by deserialized scene object.  
    
    
      
    
    
    const deserialized = await sdk.Scene.deserialize(myString);  
    
    
    const paths = deserialized.pathIterator();  
    
    
    for (const { desc, path } of paths) {  
    
    
      if (desc.type === Scene.PathType.INPUT) {  
    
    
        // we know this path is an input path  
    
    
        const inputPath = desc.path as Scene.InputPath;  
    
    
      
    
    
        // Now you can set the value at the path  
    
    
        // You can cache the returned input path to use it later.  
    
    
        inputPath.set(10);  
    
    
      }  
    
    
    }  
    

**Returns:** `IterableIterator`<[Scene.PathInfo](/reference/scene/pathinfo/)>

### setValueAtPath​

setValueAtPath(pathId: string, value: unknown): void

deprecated Use [`InputPath.set`](/reference/scene/inputpath/#set) instead.

Sets the input property of a path. The path must be added prior to calling this function.

Parameter| Type| pathId| string  
The path id.| value| unknown  
The value to set.  
---|---  
  
### spyOnEvent​

spyOnEvent(spy: [Scene.ISceneObjectSpy](/reference/scene/isceneobjectspy/)): [ISubscription](/reference/isubscription/)

Spy on events or input and output value changes
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
      
    
    
    // mp.objLoader has an outputs.visible property  
    
    
    const comp1 = node.addComponent('mp.objLoader');  
    
    
    const outputPath = sceneObject.addOutputPath(comp1, 'visible', 'objLoader-visible');  
    
    
      
    
    
    const outputSpy = {  
    
    
      path: outputPath,  
    
    
      onEvent(type, data) {  
    
    
        console.log('outputs updated', type, data);  
    
    
      }  
    
    
    };  
    
    
      
    
    
    sceneObject.spyOnEvent(outputSpy);  
    
    
      
    
    
    node.start();  
    
    
    // outputSpy.onEvent('outputsUpdated', comp1.outputs.visible) will now be called whenever comp1.outputs.visible changes  
    

Parameter| Type| spy| [Scene.ISceneObjectSpy](/reference/scene/isceneobjectspy/)  
the spy object to attach for event or value change notifications  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

### start​

start(): void

Starts all nodes referenced by this scene object.

### stop​

stop(): void

Stops all nodes referenced by this scene object. The scene object cannot be restarted after this function has been called.

  * Methods
    * addEmitPath
    * addEventPath
    * addInputPath
    * addNode
    * addNodes
    * addOutputPath
    * addPath
    * bind
    * bindPath
    * getValueAtPath
    * nodeIterator
    * pathIterator
    * setValueAtPath
    * spyOnEvent
    * start
    * stop



  * Methods
    * addEmitPath
    * addEventPath
    * addInputPath
    * addNode
    * addNodes
    * addOutputPath
    * addPath
    * bind
    * bindPath
    * getValueAtPath
    * nodeIterator
    * pathIterator
    * setValueAtPath
    * spyOnEvent
    * start
    * stop


