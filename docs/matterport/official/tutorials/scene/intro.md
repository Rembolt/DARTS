<!-- source: https://developers.matterport.com/tutorials/scene/intro/ -->

On this page

The [`Scene`](/reference/scene/) namespace provides the ability to create and add 3D objects and/or introduce new behavior to an SDK Application.

## Hierarchy​

The hierarachy within the Scene is fairly simple and contains three levels.

[`Object`](/reference/scene/): The root object that is responsible for creating and aggregating Nodes, and coordinating communication between them and their Components.

[`Node`](/reference/scene/): An object that aggregates Components and acts as a root 3D transform for them.

[`Component`](/reference/scene/): An object that defines behavior and/or 3D objects that will be part of the Scene. Most of the application code will be implemented here.

## Creating Your Own Scene​

To get started, we'll need to get some initial boilerplate out of the way by creating an Object and Node. Multiple Objects or Nodes can be created if necessary.
    
    
    const [sceneObject] = await mpSdk.Scene.createObjects(1);  
    
    
    // if we only want one node:  
    
    
    const node = sceneObject.addNode(/* optionally, we can set the node's id here */);  
    
    
      
    
    
    // ... we will be registering and adding components to nodes here in the following sections  
    
    
      
    
    
    // and finally start running the components in our scene  
    
    
    sceneObject.start();  
    

### Adding Basic Components​

To introduce Components, and get them up and running, we will start off with basic, non-3D Components.

The first step is to create the Component's class. Components support five lifecycle methods, including `onInit`, `onTick`, and `onDestroy`. The other two are related to inputs and events, which we'll discuss later.

  * [`onInit`](/reference/scene/) is called only once when the Component is started.
  * [`onDestroy`](/reference/scene/) is called only once just prior to the Component being stopped.
  * [`onTick`](/reference/scene/) is called every frame (similar to a `requestAnimationFrame`) with the time delta since the previous call.



A Component that implements those 3 lifecycles would looks like this.
    
    
    class BasicComponent {  
    
    
      onInit() {  
    
    
        console.log('`onInit`')  
    
    
      }  
    
    
      
    
    
      onTick(delta) {  
    
    
        console.log('`onTick`', delta);  
    
    
      }  
    
    
      
    
    
      onDestroy() {  
    
    
        console.log('`onDestroy`');  
    
    
      }  
    
    
    }  
    

**Running the BasicComponent**

Now that we have a BasicComponent with some lifecycles, we need to register it, add it to a node, and get it running.

First, registering is done through the [`Scene.register`](/reference/scene/) function. We provide a "name" (as a string) and a factory to create the component.
    
    
    await mpSdk.Scene.register('basic', () => new BasicComponent());  
    

Then, we'll add it to our `Node` we created earlier. We use the "name" of the component just registered. We can save a reference to the component returned by [`addComponent`](/reference/scene/).
    
    
    const basic = node.addComponent('basic');  
    
    
    // if we wanted to run more than one instance of the component, we can add more  
    
    
    const basic2 = node.addComponent('basic');  
    
    
    const basic3 = node.addComponent('basic');  
    
    
    const basic4 = node.addComponent('basic');  
    
    
    // ...  
    

After we've added as many BasicComponents as we want to our nodes, we'll start our scene using our previously created `Object`.
    
    
    sceneObject.start();  
    

At any time, we can stop our scene.
    
    
    // stop our Object after 1 second  
    
    
    setTimeout(() => sceneObject.stop(), 1000);  
    

Now that we've started, ran, and stopped our object, a few things should have happened.

  1. The component should have started and logged an "`onInit`" message.
  2. The component should have started printing an "`onTick`" message with a time delta numerous times.
  3. A final "`onDestroy`" message should have been logged and the "`onTick`" messages stopped.



### Aside: Component Constructor Functions​

While not necessary to understanding how Components work, there is at least one thing we glossed over (and didn't include in our class): the Component's constructor function and its relation to the factory passed to `register`. If a component needs to have some additional data that's separate from the "inputs" (that we'll introduce in the next lesson), we can add a constructor and pass data in through the factory. Another example of this is given in [Events, Emits](/tutorials/scene/connecting-components/#events-emits).
    
    
    class ComponentWithCtor {  
    
    
      constructor(private secretPass: string) {}  
    
    
    }  
    
    
      
    
    
    const secretPass = '1234';  
    
    
    await mpSdk.register('secretPassComponent', () => new ComponentWithCtor(secretPass));  
    

## Source​

[View or download the source here](/assets/files/basicComponent-277ae3923e5fde84ccc9737bdb70e9a7.js/)

To run this example, import the `startBasicComponents` function and pass the mpSdk instance to it.
    
    
    import { startBasicComponents } from './basicComponent';  
    
    
      
    
    
    const mpSdk; // initialized from a successful `connect` call  
    
    
    startBasicComponents(mpSdk);  
    

## Continue Reading​

To learn how to:

  * Push data into and out of Components
  * Connect data between components so they can automatically update and respond to changes
  * Spy on changes or events of a Component



Continue reading in [Connecting Components](/tutorials/scene/connecting-components/)

  * Hierarchy
  * Creating Your Own Scene
    * Adding Basic Components
    * Aside: Component Constructor Functions
  * Source
  * Continue Reading


