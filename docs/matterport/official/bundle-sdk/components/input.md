<!-- source: https://developers.matterport.com/bundle-sdk/components/input/ -->

On this page

## Type: mp.input​

### Inputs​

Property| Type| **eventsEnabled**|  boolean — default `true`  
If true, emitted events will be available for binding or spying. If false, no events will be emitted.| **userNavigationEnabled**|  boolean — default `true`  
If set to false, all showcase user based navigation will be turned off.| **unfiltered**|  boolean — default 'true'  
If set to false, the input component will only receive unhandled events.  
---|---  
  
### Emmited Events​

Property| INTERACTION.CLICK| INTERACTION.DRAG_BEGIN| INTERACTION.DRAG| INTERACTION.DRAG_END| INTERACTION.POINTER_MOVE| INTERACTION.POINTER_BUTTON| INTERACTION.SCROLL| INTERACTION.KEY| INTERACTION.LONG_PRESS_START| INTERACTION.LONG_PRESS_END| INTERACTION.MULTI_SWIPE| INTERACTION.MULTI_SWIPE_END| INTERACTION.PINCH| INTERACTION.PINCH_END| INTERACTION.ROTATE| INTERACTION.ROTATE_END  
---  
  
### Usage​

This component dispatches _input_ and _gesture_ events via **emits**. These events can be used by bindings and spies. In addition, this component can disable default user navigation to facilitate integration with a custom navigation scheme.
    
    
    // Create a scene object and node with an input component.  
    
    
    // Note you will probably only need one instance of an input component  
    
    
    // for your entire application.  
    
    
    const [ sceneObject ] = await sdk.Scene.createObjects(1);  
    
    
    const node = sceneObject.addNode();  
    
    
    const inputComponent = node.addComponent('mp.input', {  
    
    
      eventsEnabled: true,  
    
    
      userNavigationEnabled: false,  
    
    
    });  
    
    
    sceneObject.start();  
    
    
      
    
    
    // Define an emit path to listen for mouse click emits  
    
    
    const clickEmitPath = sceneObject.addEmitPath(  
    
    
      inputComponent,  
    
    
      "INTERACTION.CLICK"  
    
    
    );  
    
    
      
    
    
    // Define a click event spy  
    
    
    const clickSpy = sceneObject.spyOnEvent({  
    
    
      path: clickEmitPath,  
    
    
      onEvent(payload: any) {  
    
    
          console.log('received', payload);  
    
    
      }  
    
    
    });  
    
    
      
    
    
    // Define an emit path to listen for keyboard interaction  
    
    
    const keyEmitPath = sceneObject.addEmitPath(  
    
    
      inputComponent,  
    
    
      "INTERACTION.KEY"  
    
    
    );  
    
    
      
    
    
    // Define a keypress event spy  
    
    
    const keySpy = sceneObject.spyOnEvent({  
    
    
      path: keyEmitPath,  
    
    
      onEvent(payload: any) {  
    
    
        // Log the key to the browser console.  
    
    
        console.log(payload.key);  
    
    
        if (payload.key === 90 && payload.state === 2) {  
    
    
          // Bind to keydown state for 'z'  
    
    
          console.log('z');  
    
    
        }  
    
    
        if (payload.key === 88 && payload.state === 2) {  
    
    
          // Bind to keydown state for 'x'  
    
    
          console.log('x');  
    
    
        }  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // You can enable navigation after starting the node.  
    
    
    inputComponent.inputs.userNavigationEnabled = true;  
    
    
      
    
    
    // You can turn off all events and the spy wont receive any callbacks.  
    
    
    inputComponent.inputs.eventsEnabled = false;  
    
    
      
    

  * Type: mp.input
    * Inputs
    * Emmited Events
    * Usage


