<!-- source: https://developers.matterport.com/tutorials/scene/connecting-components/ -->

On this page

Having singular, isolated Components isn't the most exciting. Luckily, we have ways to control and connect Components together. Along the way, we'll be introducing the last two lifecycle methods and the following concepts:

  * inputs
  * outputs
  * events
  * emits
  * Paths
  * Spies



## Inputs, Outputs​

Components have two properties representing a way to accept data and to output data called "inputs" and "outputs" respectively.

To demonstrate their use, we'll create a new Component: `Adder`. The `Adder` will have 2 inputs, that will be summed together to create a new value for its output. In order to do so, it will need to respond to changes in the inputs by implementing the lifecycle: `onInputsUpdated`.

  * For efficiency, [`onInputsUpdated`](/reference/scene/) is called **at most** once per frame if the Component's inputs have changed. It is called with the previous values of the inputs which can be used to compare the changes to the current `this.inputs` object. If inputs have changed multiple times within a single tick or frame, `onInputsUpdated` will still only be called once per frame.


    
    
    class Adder {  
    
    
      // define 2 inputs: "arg1" and "arg2"  
    
    
      inputs = {  
    
    
        arg1: 0,  
    
    
        arg2: 0,  
    
    
      };  
    
    
      
    
    
      // define a single output: "sum"  
    
    
      outputs = {  
    
    
        sum: 0,  
    
    
      }  
    
    
      
    
    
      onInit() {  
    
    
        // calculate the initial sum  
    
    
        this.outputs.sum = this.inputs.arg1 + this.inputs.arg2;  
    
    
        console.log('initial sum', this.outputs.sum);  
    
    
      }  
    
    
      
    
    
      onInputsUpdated(prevInputs) {  
    
    
        // log the previous sum by using the previous inputs values in `prevInputs`  
    
    
        console.log('previous sum', prevInputs.arg1 + prevInputs.arg2);  
    
    
      
    
    
        // recalculate the sum  
    
    
        this.outputs.sum = this.inputs.arg1 + this.inputs.arg2;  
    
    
        console.log('updated sum', this.outputs.sum);  
    
    
      }  
    
    
    }  
    

The `Adder` Component

  * has two inputs under its `inputs` object: `arg1` and `arg2`.
  * has a single output under its `outputs` object: `sum`. 
    * upon initialization, the component's `onInit` function calculates the initial `outputs.sum`
    * we also provide a default directly in the `outputs` object
  * implements an `onInputsUpdated` function to recalculate and log the new `outputs.sum`.
  * logs the previous sum using the `prevInputs` provided to `onInputsUpdated`.



### Running the Adder​

To see this new component in action we will

  1. register it
  2. add it to a node with some intial input data
  3. set its inputs
  4. check its logs


    
    
    // --- reuse code from the "intro" example that creates `sceneObject` and `node` ---  
    
    
    await mpSdk.Scene.register('adder', () => new Adder());  
    
    
    const adder = node.addComponent('adder', {  
    
    
      // this object is optional but sets the initial values of the Adder  
    
    
      arg1: 2,  
    
    
      arg2: 1,  
    
    
    });  
    
    
      
    
    
    sceneObject.start();  
    
    
      
    
    
    // set the inputs of `adder`  
    
    
    adder.inputs.arg1 = 40;  
    
    
    adder.inputs.arg2 = 2;  
    
    
      
    
    
    // ...some time later; this needs to be deferred until the next frame to get the updated sum  
    
    
    // we'll see how Spies can make this easier to manage later  
    
    
    console.log('outputs.sum', adder.outputs.sum);  
    

Note: If no values are passed into the `addComponent` for the initial inputs, the default values set in the class will be used (in the case of the `Adder` arg1: 0, arg2: 0).

Things should now be a little more interesting. With the `Adder` we should see a bit more interactivity through its logs.

  1. Our `Adder` computes and logs an initial sum from the initial inputs we provided in `addComponent` (3).
  2. We updated the inputs and the component recalculated and logged the previous and the new sums (3 and 42), and updated its output automatically. Notice there was only one call to the `onInputsUpdated` even though we update two values at two different times.
  3. Finally, we logged the output of the `Adder` from outside of the component.



## Paths​

Before introducing Events, we need to understand how to "bind" things together. In the previous example, we were setting input values manually, but binding values lets us update them automatically. Binding can be done between an input and an output and an emit and event. Binding is done through a concept called a "Path". Paths exist within an Object and represent a path to a property in one of its Components, something like "node/adder/input/arg1".

To demonstrate how to bind inputs and outputs we'll first introduce a new Component, `RNG`, that we will use to generate random numbers every second. Then we'll use two RNG Components' outputs to change the input of our `Adder`. Finally, we will set up the `onTick` lifecycle method to automatically compute the sum each frame.
    
    
    class RNG {  
    
    
      timeSinceUpdate = 0;  
    
    
      inputs = {  
    
    
        interval: 1000,  
    
    
      };  
    
    
      
    
    
      outputs = {  
    
    
        value: 0,  
    
    
      };  
    
    
      
    
    
      onTick(delta) {  
    
    
        this.timeSinceUpdate += delta;  
    
    
        if (this.timeSinceUpdate >= this.inputs.interval) {  
    
    
          this.timeSinceUpdate = this.timeSinceUpdate % this.inputs.interval;  
    
    
          this.outputs.value = Math.random();  
    
    
        }  
    
    
      }  
    
    
    }  
    

The Random Number Generator (`RNG`) Component

  * has an `inputs.interval` that defaults to 1 second (1000 milliseconds)
  * has an `outputs.value` for the values it will generate
  * uses an `onTick` to check if it needs to update its random value and does so if enough time has passed



### Running the Timer and the new RNG​

With the RNG Component, we can hook its output values directly into our `Adder` inputs. To do this we will:

  1. Create and add two `RNG` Components and one `Adder` Component.
  2. Create paths for the ouputs of each `RNG` (value) and the two inputs of the `Adder` (arg1, arg2).
  3. Bind the paths that we created together, to bind the Components' inputs and ouputs.


    
    
    // --- reuse code from the "intro" example that creates `sceneObject` and `node` ---  
    
    
    await sdk.Scene.register('adder', () => new Adder());  
    
    
    await sdk.Scene.register('rng', () => new RNG());  
    
    
      
    
    
    const adder = node.addComponent('adder');  
    
    
    const rng1 = node.addComponent('rng');  
    
    
    const rng2 = node.addComponent('rng');  
    
    
      
    
    
    // create paths to each of the RNGs' values  
    
    
    const randomOutput1 = sceneObject.addOutputPath(rng1, 'value');  
    
    
    const randomOutput2 = sceneObject.addOutputPath(rng2, 'value');  
    
    
    // create paths to the each of the inputs of the Adder  
    
    
    const adderInput1 = sceneObject.addInputPath(adder, 'arg1');  
    
    
    const adderInput2 = sceneObject.addInputPath(adder, 'arg2');  
    
    
      
    
    
    // bind the paths (inputs/outputs)  
    
    
    randomOutput1.bind(adderInput1); // we can bind an output to input ...  
    
    
    adderInput2.bind(randomOutput2); // ... or an input to an output (the result is the same)  
    
    
      
    
    
    sceneObject.start();  
    

Things should look a lot more interesting now.

  1. Our `Adder` will now be outputting new sums every second.
  2. We have two `RNG` Components generating and outputting values every second.
  3. Most importantly, the `Adder` is automatically **responding** to any changes in its inputs which are bound to the outputs of the `RNG` Components.



## Events, Emits​

Components can also emit and receive events. This is done through the use of `events` and `emits`. Events can carry a payload with them much like standard Javascript events.

To demonstrate how to send events between components, we'll introduce a new Component `Timer` that will "emit" every second through the use its [`notify`](/reference/scene/) function. We'll also refactor our `RNG` Component so that it doesn't track time, but is instead bound to and handles the emit from the `Timer` through the final lifecycle we need to introduce: `onEvent`.

  * [`onEvent`](/reference/scene/) is called once for each event emitted (that this component handles). `onEvent` is not called immediately but on the next tick/frame. This means that multiple `onEvent` calls can happen within the same frame.


    
    
    class Timer {  
    
    
      timeSinceUpdate = 0;  
    
    
      
    
    
      // define an event that can be emitted: "tick"  
    
    
      emits = {  
    
    
        tick: true,  
    
    
      }  
    
    
      
    
    
      constructor(interval) {  
    
    
        this.interval = interval;  
    
    
      }  
    
    
      
    
    
      onTick(delta) {  
    
    
        this.timeSinceUpdate += delta;  
    
    
        if (this.timeSinceUpdate >= this.interval) {  
    
    
          this.timeSinceUpdate = this.timeSinceUpdate % this.interval;  
    
    
          this.notify('tick', { /* This event has no payload but could be any arbitrary object */ });  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    class RNG {  
    
    
      outputs = {  
    
    
        value: 0,  
    
    
      };  
    
    
      
    
    
      // define an event that can be received: "regenerate"  
    
    
      events = {  
    
    
        regenerate: true,  
    
    
      };  
    
    
      
    
    
      onEvent(eventType, eventData) {  
    
    
        if (eventType === 'regenerate') {  
    
    
          this.outputs.value = Math.random();  
    
    
          console.log(eventData); // events receive data with them, though the 'regenerate' event doesn't use or expect one  
    
    
        }  
    
    
      }  
    
    
    }  
    

With this refactor, we split out the timing functionality of the `RNG` Component and created a separate `Timer` Component. The `Timer` Component

  * has a configurable interval that's set at construction time (not as an input)
  * emits a "tick" event through use of its `notify`



The `RNG` Component now

  * uses `event.regenerate` and `onEvent` to generate a new random number and set it as its output



With the new `RNG` and the `Timer` Components, it is possible to bind these Components' emits and events. We'll follow a similar pattern to what we used for inputs and outputs.

  1. setup all the boilerplate (register and add components)
  2. create the paths to the `RNG`'s event and the `Timer`'s emit
  3. bind the new paths


    
    
    // --- reuse code from the "intro" example that creates `sceneObject` and `node` ---  
    
    
    await sdk.Scene.register('adder', () => new Adder());  
    
    
    await sdk.Scene.register('rng', () => new RNG());  
    
    
      
    
    
    const adder = node.addComponent('adder');  
    
    
    const rng1 = node.addComponent('rng');  
    
    
    const rng2 = node.addComponent('rng');  
    
    
      
    
    
    const randomOutput1 = sceneObject.addOutputPath(rng1, 'value');  
    
    
    const randomOutput2 = sceneObject.addOutputPath(rng2, 'value');  
    
    
    const adderInput1 = sceneObject.addInputPath(adder, 'arg1');  
    
    
    const adderInput2 = sceneObject.addInputPath(adder, 'arg2');  
    
    
      
    
    
    randomOutput1.bind(adderInput1);  
    
    
    randomOutput2.bind(adderInput2);  
    
    
      
    
    
    // --- new code starts here ---  
    
    
    await sdk.Scene.register('timer', () => new Timer(1000));  
    
    
    const timer = node.addComponent('timer');  
    
    
    // create new paths to the emit and the event  
    
    
    const tick = sceneObject.addEmitPath(timer, 'tick');  
    
    
    const regenRNG1 = sceneObject.addEventPath(rng1, 'regenerate');  
    
    
    const regenRNG2 = sceneObject.addEventPath(rng2, 'regenerate');  
    
    
      
    
    
    tick.bind(regenRNG1);  // we can bind an emit to an event  
    
    
    regenRNG2.bind(tick); // ... or an event to emit (the result is the same)  
    
    
      
    
    
    sceneObject.start();  
    

To the end-user there hasn't been any change in behavior from the previous example but our code is now in much more manageable, reusable Components.

While a bit superficial, the example shows a few interesting concepts.

  1. Components can communicate between each other.
  2. The Timer we created can emit events to any number of other Components. A downside to this is that we have more Components to manage which involves more boilerplate: registering, adding, creating paths for, and binding them together.
  3. **Events and Emits don't need use the same property name** in order to be bound together ("tick" and "regenerate" were used in our example)



### Disabling Emits or Events​

So far our examples have set their emits or events properties to `true`. If at any time, a Component should no longer be able to emit events through `notify` or receive events through its `onEvent`, setting those properties to `false` will disable those events.
    
    
    // from here `timer` will no longer emit 'tick'  
    
    
    timer.emits.tick = false;  
    
    
    // from here `rng1` will no longer receive any 'regenerate' events  
    
    
    rng1.events.regenerate = false;  
    
    
      
    
    
    // we can also disable the emits through a path to it...  
    
    
    tick.disable();  
    
    
    // ... and re-enable it  
    
    
    tick.enable()  
    
    
      
    
    
    // and disable events though its path...  
    
    
    regenRNG1.disable();  
    
    
    // ... and re-enable it  
    
    
    regenRNG1.enable();  
    

### Aside: Additional Path Functionality​

While we showed how to bind paths in a 1:1 relationship, paths have a few extra capabilities like reading inputs and outputs, manually updating inputs, disabling and enabling events and emits, and manually triggering `onEvent` calls to components.

We can bind a single Output Path to multiple Input Paths.
    
    
    randomOutput1.bind(adderInput1);  
    
    
    randomOutput1.bind(adderInput2);  
    

However, binding multiple outputs to a single input is not allowed.
    
    
    // this is invalid -- `adderInput1` is already bound  
    
    
    randomOutput1.bind(adderInput1);  
    
    
    randomOutput2.bind(adderInput1);  
    

Input and Output Paths can be used to read their values. Input Paths also allow for setting their value.
    
    
    console.log('RNG1 has an output of', randomOutput1.get());  
    
    
    console.log(`Adder's first input is`, adderInput1.get());  
    
    
    // manually settng Adder's second input  
    
    
    adderInput2.set(1234);  
    

Similarly, with Event and Emit paths, multiple events (like outputs) can be bound to multiple emits (like inputs); however, unlike inputs and outputs, multiple emits can be bound to multiple events.
    
    
    // bind multiple events (`regenRNG1`, `regenRNG2`) to a single emit (`tick`)  
    
    
    tick.bind(regenRNG1);  
    
    
    tick.bind(regenRNG2);  
    
    
    // bind a single event (`regenRNG1`) to multiple emits (`tick`, `tick2`) -- notice that `tick2` is a hypothetical path we haven't created thus far  
    
    
    regenRNG1.bind(tick);  
    
    
    regenRNG1.bind(tick2);  
    

Event and Emit Paths can be used to trigger the `onEvent` of any and all Components it's associated with.
    
    
    // event payloads are optional  
    
    
    tick.emit(/* ... */);  
    
    
    rng1.emit(/* ... */);  
    

## Spies​

If at any time there's a need to work outside of the Scene framework, like bridging into another framework, Spies can be used. Spies allow for code that's not part of a Component to receive all the same events a Component normally would: changes to inputs or outputs, or when a Component emits or receives an event.

To demonstrate Spies, we'll create several different Spies, one for each Path type, using several of the Components we've created up until now.
    
    
    // spy on input changes to our Adder  
    
    
    // using class syntax  
    
    
    class AdderArg1Spy {  
    
    
      path = adderInput1;  
    
    
      onEvent(newValue) {  
    
    
        console.log(`spied change to "${this.path.property}" its new value is ${newValue}`);  
    
    
      }  
    
    
    }  
    
    
    sceneObject.spyOnEvent(new AdderArg1Spy());  
    
    
      
    
    
    // spy on an output from our Adder  
    
    
    const adderOutput = sceneObject.addOutputPath(adder, 'sum');  
    
    
    // using inline syntax  
    
    
    sceneObject.spyOnEvent({  
    
    
      path: adderOutput,  
    
    
      onEvent(newSum) {  
    
    
        console.log(`spied change to "${this.path.property}" its new value is ${newSum}`);  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // spy on an emit from our Timer  
    
    
    sceneObject.spyOnEvent({  
    
    
      path: tick,  
    
    
      onEvent(eventData) {  
    
    
        console.log(`spied that an event "${this.path.emitName}" was emitted`);  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // spy on an event  
    
    
    sceneObject.spyOnEvent({  
    
    
      path: regenRNG1,  
    
    
      onEvent(eventData) {  
    
    
        console.log(`spied "${this.path.eventName}" received with data ${eventData}`);  
    
    
      },  
    
    
    });  
    

So, Spies are a small wrapper around Paths with a single extra `onEvent`. As the properties of each of the Paths changes, the associated Spy's `onEvent` will be called with the new input/output value or data associated with the event/emit.

`spyOnEvent` returns an `ISubscription`; call its `cancel` function to stop spying.
    
    
    const sumSubscription = sceneObject.spyOnEvent({  
    
    
      path: adderOutput,  
    
    
      onEvent(newSum) {  
    
    
        console.log(`spied sum: ${newSum}`);  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // later, stop spying  
    
    
    sumSubscription.cancel();  
    

## Source​

[View or download the source here](/assets/files/boundComponents-43f0439c041ca1e0837b21532d608fe7.js/)

To run this example, import the `startBoundComponents` function and pass the mpSdk instance to it.
    
    
    import { startBoundComponents } from './basicComponent';  
    
    
      
    
    
    const mpSdk; // initialized from a successful `connect` call  
    
    
    startBoundComponents(mpSdk);  
    

## Continue Reading​

Look forward to upcoming documentation on how to:

  * Render 3D components
  * Add interactivity



  * Inputs, Outputs
    * Running the Adder
  * Paths
    * Running the Timer and the new RNG
  * Events, Emits
    * Disabling Emits or Events
    * Aside: Additional Path Functionality
  * Spies
  * Source
  * Continue Reading


