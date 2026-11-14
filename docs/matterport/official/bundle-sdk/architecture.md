<!-- source: https://developers.matterport.com/bundle-sdk/architecture/ -->

  
    On this page

## Scene Objects​

[Scene Object Reference Documentation](/reference/scene/)

Scene objects aggregate nodes and are the central place where nodes are created, and data and events between components are connected and managed.
    
    
    // Create a scene object. `createObjects` can create multiple objects and returns an array with that number of objects  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    // Starts all nodes referenced by this scene object  
    
    
    sceneObject.start()  
    
    
    // Stops all nodes referenced by this scene object. The scene object cannot be restarted after this function has been called  
    
    
    sceneObject.stop()  
    

## Scene Nodes​

[Scene Node Reference Documentation](/reference/scene/)

Scene nodes contain and manage the lifecycle of their child components. Scene nodes have a 3D transform that parent child components.

Scene node have the following states:

  * **Initializing** - The scene node is not part of the scene graph during this state. Components can be added and property bindings can be created.
  * **Operating** - The scene node becomes active and is part of the scene graph. Child components are also operating.
  * **Destroyed** - The scene node and its components are removed from the scene graph and destroyed.


    
    
    // Create a scene object. `createObjects` can create multiple objects and returns an array with that number of objects  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1)  
    
    
      
    
    
    // Create a scene node with an optional unique id  
    
    
    const node = sceneObject.addNode('my-node')  
    
    
      
    
    
    // Transitions the node to Operating if it is in the Initializing state. Calling this function has no effect if the node is already Operating  
    
    
    node.start()  
    
    
      
    
    
    // Transitions the node to Destroyed state if it is in any state. Calling this function has no effect if the node is already Destroyed  
    
    
    node.stop()  
    

## Components​

[Scene Component Reference Documentation](/reference/scene/)

Components are associated to a single scene node. They are used to build appearance, behavior, and events in 3D. Components adhere to a standard interface making them reusable and shareable across multiple applications.

### Component Lifecycle​

Components have five callbacks,

  * **onInit** - This function is called when the scene node is started. Peer components are called in the order they were added to the scene node.
  * **onEvent** - This function is called once for each event that occured during the last frame.
  * **onInputsChanged** - This function is called prior to `onTick` but after `onEvent`. It is called once if any `inputs` property has changed during the last frame.
  * **onTick** - This function is called every frame.
  * **onDestroyed** - This function is called when the scene node is stopped. Component `onDestroy` callbacks are called in the reverse order they are added to the scene node.



During the `Initializing` state, components can be added and property bindings can be created. Calling `start` triggers `onInit` to be called on each component prior to entering the `Operating` state.

During the `Operating` state, events, input changes and ticks are handled by each component.

Upon entering the `Destroyed` state, components should free allocated resources.
    
    
    // Create a scene object. `createObjects` can create multiple objects and returns an array with that number of objects  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1)  
    
    
      
    
    
    // Create a scene node with an optional unique id  
    
    
    const node = sceneObject.addNode('my-node')  
    
    
      
    
    
    // Adding a component to 'my-node' with optional initialInputs and option id  
    
    
    const initialInputs = {  
    
    
      url: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/fbx/stanford-bunny.fbx',  
    
    
    }  
    
    
    const component = node.addComponent('mp.fbxLoader', initialInputs, "my-component")  
    
    
      
    
    
    // Start 'my-node'  
    
    
    node.start()  
    
    
      
    
    
      
    
    
    // Destroying a scene node  
    
    
    node.stop()  
    

### Input and Output Dictionaries​

Components have properties named `inputs` and `outputs`. These properties are dictionaries defined by the component. The `inputs` dictionary represents properties that affect the components behavior or appearance. The `outputs` dictionary represents properties computed by the component.

An example of a computed output,
    
    
    function Sum() {  
    
    
      this.inputs = {  
    
    
        augend: 0,  
    
    
        addend: 0,  
    
    
      };  
    
    
      
    
    
      this.outputs = {  
    
    
        sum: 0,  
    
    
      };  
    
    
      
    
    
      // if any input changes, recompute the sum.  
    
    
      this.onInputsUpdated = function() {  
    
    
        this.outputs.sum = this.inputs.augend + this.inputs.addend;  
    
    
      };  
    
    
    }  
    

### Context​

Every component has a `context` property implicitly defined for it. The `context` contains access to

  * `root`, the node the component is attached to
  * `three`, the currently loaded THREE.js script from Showcase
  * `renderer`, Showcase's active `THREE.WebGLRenderer`



note

Any webgl objects, including `Material` or `Geometry`, MUST be created using `THREE.js` provided by `context.three` because of THREE.js's internal id system used to uniquely identify objects.
    
    
    class Renderable {  
    
    
      onInit() {  
    
    
        const THREE = this.context.three;  
    
    
        this.outputs.objectRoot = new THREE.Mesh(  
    
    
          new THREE.BoxBufferGeometry( 1, 1, 1 ),  
    
    
          new THREE.MeshBasicMaterial( { color: 0xffff00 } ));  
    
    
      }  
    
    
    }  
    

### Emits and Event Subscriptions​

Components also have properties named `events` and `emits`, and a function `notify`.

The `events` dictionary defines which type of events the component subscribes to. The keys of the dictionary define the event types. The values determine if the component receives those events -- truthy values mean the component will, falsy values mean it won't. Event subscriptions can be changed at will at any time.

The `emits` dictionary defines which events the component can emit through a call to its `notify` function. If the value of an event in `emits` is falsy, then it will not `notify` other components of that event. Otherwise, each call to `notify` triggers a call to `onEvent` of the component bound to it on the next iteration through the component lifecycle.

Receiving user input from the mouse or touch is possible using built-in event types like: `INTERACTION.HOVER`, `INTERACTION.CLICK`, `INTERACTION.DRAG`. For all supported input events, see [InteractionType](/reference/scene/).

note

A component will only receive input if they also set their `collider` output.
    
    
    class Clickable {  
    
    
      events = {  
    
    
        // subscribe to click events  
    
    
        [ComponentInteractionType.CLICK]: true,  
    
    
      }  
    
    
      
    
    
      emits = {  
    
    
        // emit a clicked events  
    
    
        clicked: true,  
    
    
      
    
    
      };  
    
    
      
    
    
      onInit() {  
    
    
        var THREE = this.context.three;  
    
    
        this.outputs.collider = new THREE.Mesh();  
    
    
      }  
    
    
      
    
    
      onEvent(eventType: string) {  
    
    
        if (this.eventType === ComponentInteractionType.CLICK) {  
    
    
          console.log('Clickable component was clicked!');  
    
    
          // cancel the click event subscription, this component will no longer receive clicks  
    
    
          this.events[ComponentInteractionType.CLICK] = false;  
    
    
      
    
    
          // tell other components that this component was clicked  
    
    
          this.notify('clicked', { /* an optional payload */});  
    
    
      
    
    
          // disable the 'clicked' emit  
    
    
          this.emits.clicked = false;  
    
    
          // this will NOT notify other components since `emits.clicked` was set to `false`  
    
    
          this.notify('clicked');  
    
    
        }  
    
    
      }  
    
    
    }  
    

## Paths​

Paths create references to a property of a component's inputs, outputs, events, or emits.

Paths are the primary mechanism used to connect two components together and to setup spies (more on spies in the next section). They can also be used to set values on inputs, and read values from outputs.
    
    
    interface InputPath<T> {  
    
    
      get(): T;  
    
    
      set(newVal: T): void;  
    
    
    }  
    
    
      
    
    
    interface OutputPath<T> {  
    
    
      get(): T;  
    
    
    }  
    

### Creating a Path​

Paths are created through a scene object that they will be associated with.
    
    
    // Create a scene object, node, and component  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    const component = node.addComponent('sum');  
    
    
      
    
    
    // create and add a path that references the component's output  
    
    
    const sumOutputPath = sceneObject.addOutputPath(component, 'sum');  
    

### Binding Properties using Paths​

A property binding is a connection from a component's `inputs` property to another component's `outputs` property. The `inputs` property is called the **Binding Target** and the `outputs` property is called the **Binding Source**. Changes to the **Binding Source** value will propagate to the **Binding Target**. **Binding Targets** should be treated as `read-only`.
    
    
    // assume Sum() class from Inputs and Outputs Dictionaries section  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    var node = await sceneObject.addNode();  
    
    
    var comp1 = node.addComponent('sum');  
    
    
    var comp2 = node.addComponent('sum');  
    
    
    var comp3 = node.addComponent('sum');  
    
    
      
    
    
    // create a path to comp1.inputs.augend  
    
    
    const comp1Augend = sceneObject.addInputPath(comp1, 'augend');  
    
    
    // create a path to comp1.inputs.addend  
    
    
    const comp1Addend = sceneObject.addInputPath(comp1, 'addend')  
    
    
    // create a path to comp2.outputs.sum  
    
    
    const comp2Sum = sceneObject.addOutputPath(comp2, 'sum');  
    
    
    // create a path to comp3.outputs.sum  
    
    
    const comp3Sum = sceneObject.addInputPath(comp3, 'sum');  
    
    
      
    
    
    // bind the the output (sum) of comp2 to the input (augend) of comp1  
    
    
    comp1Augend.bind(comp2Sum);  
    
    
    // bind the the output (sum) of comp3 to the input (addend) of comp1  
    
    
    comp1Addend.bind(comp3Sum);  
    
    
      
    
    
    node.start();  
    
    
      
    
    
    // start modifying comp2's and comp3's inputs to automatically modify comp1's sum  
    
    
    comp2.inputs.augend = 5;  
    
    
    console.log(comp1.outputs.sum);  
    
    
    // output: 5  
    
    
      
    
    
    comp3.inputs.addend = 6;  
    
    
    console.log(comp1.outputs.sum);  
    
    
    // output: 11  
    
    
      
    

### Event Bindings​

An event binding is an alternative means of connecting two components. A component can notify other components an event has occurred by calling its `notify` function. The components that broadcast events are called **Event Sources** and components that recieve events are called **Event Sinks**. A source's event name doesn't have to match the sink's name. The binding will map between the two. Event Bindings are implemented this way in order to facilitate the creation of components that are more reusable, easily swappable, and more decoupled.
    
    
    class Clickable {  
    
    
      emits = {  
    
    
        clicked: true,  
    
    
      };  
    
    
      // ...  
    
    
      onEvent(eventType: string) {  
    
    
        this.notify('clicked');  
    
    
      }  
    
    
    }  
    
    
    
    class Random {  
    
    
      events = {  
    
    
        randomize: true  
    
    
      }  
    
    
      
    
    
      outputs = {  
    
    
        num: 0  
    
    
      }  
    
    
      
    
    
      onEvent(eventType: string) {  
    
    
        if (eventType === 'randomize') {  
    
    
          this.outputs.num = Math.random();  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
    
    // assume the previous two components have been registered  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.createNode();  
    
    
    const clickable = node.addComponent('clickable');  
    
    
    const random = node.addComponent('random');  
    
    
      
    
    
    // bind Random's 'randomize' event to Clickable's 'clicked' event  
    
    
    const emitPath = sceneObject.addEmitPath(clickable, 'clicked');  
    
    
    const eventPath = sceneObject.addEventPath(random, 'randomize');  
    
    
      
    
    
    sceneObject.bindPath(eventPath, emitPath);  
    
    
      
    
    
    // from now on when `clickable` is clicked, `random` updates its `output.num` value  
    

## Spies​

Spies create ways to receive callbacks when a component's inputs or outputs change, or when it calls `notify` to emit an event. Spies work outside of Matterport's component system so it is a way to bridge to other frameworks.

Calling `spyOnEvent` on a scene object will attach a spy to the path it is associated with. `spyOnEvent` returns an `ISubscription` which is used to remove the spy by calling its `cancel` function.

### Spying on Emits​

It is possible to spy on components' events from outside of a component. A spy can listen for an emit with a specific eventType and will have its `onEvent` function called when the component it is attached to calls its `notify` function with that eventType.
    
    
    // assume Clickable class from "Event Subscriptions" section  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    const clickComponent = node.addComponent('clickable');  
    
    
      
    
    
    const clickPath = sceneObject.addEmitPath(clickComponent, 'clicked');  
    
    
    class ClickSpy implements MpSdk.Scene.ISceneObjectSpy<Intersect> {  
    
    
      readonly path = clickPath;  
    
    
      onEvent(type, data) {  
    
    
        console.log('spied a notify. Event type:', type, 'w/ data', data);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    // attach spies  
    
    
    const clickSubscription = sceneObject.spyOnEvent(new ClickSpy());  
    
    
      
    
    
    node.start();  
    
    
      
    
    
    // from here, any time the Clickable component calls `notify('clicked')`, `ClickSpy.onEvent` will be called  
    
    
      
    
    
    // stop spying on the click events  
    
    
    clickSubscription.cancel();  
    

### Spying on Events​

### Spying on Inputs and Outputs​

It is also possible to spy on inputs and outputs and watch them for changes. The `type` in the callback will either be `'inputsUpdated'` or `'outputsUpdated'` depending on which property the spy is attached to.
    
    
    // assume Sum class from "Input and Output Dictionaries" section  
    
    
    const [sceneObject] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    const sumComponent = node.addComponent('sum');  
    
    
      
    
    
    class SumSpy implements MpSdk.Scene.ISceneObjectSpy {  
    
    
      readonly path = sumPath;  
    
    
      onEvent(data) {  
    
    
        console.log('spied a change to outputs.sum. New sum:', data);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    class AddendSpy implements MpSdk.Scene.ISceneObjectSpy {  
    
    
      readonly path = addendPath;  
    
    
      onEvent(data) {  
    
    
        console.log('spied change to inputs.addend. New addend value:', data);  
    
    
      }  
    
    
    }  
    
    
      
    
    
    // create the output path  
    
    
    const sumPath = sceneObject.addOutputPath(sumComponent, 'sum');  
    
    
    // create the input path  
    
    
    const addendPath = sceneObject.addInputPath(sumComponent, 'addend');  
    
    
      
    
    
    // attach spies  
    
    
    const sumSubscription = sceneObject.spyOnEvent(new SumSpy());  
    
    
    const addendSubscription = sceneObject.spyOnEvent(new AddendSpy());  
    
    
      
    
    
    node.start();  
    
    
      
    
    
    // making a change to the "Sum" component's `inputs.augend` will recompute its `output.sum` which will trigger the SumSpy's `onEvent` with the new sum value  
    
    
    sumComponent.inputs.augend = 1;  
    
    
      
    
    
    // making an input change is possible through paths  
    
    
    addendPath.set(4); // will trigger the AddendSpy's `onEvent`  
    
    
      
    
    
    // after the Sum component updates its `outputs.sum`  
    
    
    console.log(sumPath.get()); // will have a value of 5 (augend: 1 + addend: 4)  
    
    
      
    
    
    // stop spying on the input changes  
    
    
    addendSubscription.cancel();  
    
    
      
    
    
    // stop spying on the output changes  
    
    
    sumSubscription.cancel();  
    

  * Scene Objects
  * Scene Nodes
  * Components
    * Component Lifecycle
    * Input and Output Dictionaries
    * Context
    * Emits and Event Subscriptions
  * Paths
    * Creating a Path
    * Binding Properties using Paths
    * Event Bindings
  * Spies
    * Spying on Emits
    * Spying on Events
    * Spying on Inputs and Outputs


