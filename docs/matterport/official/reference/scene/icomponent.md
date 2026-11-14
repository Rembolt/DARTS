<!-- source: https://developers.matterport.com/reference/scene/icomponent/ -->

On this page

The runtime shape of a scene component instance, as returned by {@link INode.addComponent} or yielded by {@link INode.componentIterator}.

TypeScript users: see {@link IComponentFactory} to define a component.
    
    
    function Box() {  
    
    
       this.inputs = {  
    
    
         visible: false,  
    
    
       };  
    
    
      
    
    
       this.onInit = function() {  
    
    
         var THREE = this.context.three;  
    
    
         var geometry = new THREE.BoxGeometry(1, 1, 1);  
    
    
         this.material = new THREE.MeshBasicMaterial();  
    
    
         var mesh = new THREE.Mesh( geometry, this.material );  
    
    
         this.outputs.objectRoot = mesh;  
    
    
       };  
    
    
      
    
    
       this.onEvent = function(type, data) {  
    
    
       }  
    
    
      
    
    
       this.onInputsUpdated = function(previous) {  
    
    
       };  
    
    
      
    
    
       this.onTick = function(tickDelta) {  
    
    
       }  
    
    
      
    
    
       this.onDestroy = function() {  
    
    
         this.material.dispose();  
    
    
       };  
    
    
    }  
    
    
      
    
    
    function BoxFactory() {  
    
    
       return new Box();  
    
    
    }  
    
    
      
    
    
    // Registering the component with the sdk  
    
    
    sdk.Scene.register('box', BoxFactory);  
    
    
      
    

_Extends:_ [IComponentBase](/reference/scene/#type-icomponentbase), [Scene.IComponentRuntimeMembers](/reference/scene/icomponentruntimemembers/)

Properties

  * componentType
  * context
  * emits
  * events
  * inputs
  * isMeasurable
  * outputs



Methods

  * bind
  * bindEvent
  * notify
  * onDestroy
  * onEvent
  * onInit
  * onInputsUpdated
  * onTick
  * spyOnEvent



## Properties​

### componentType​

componentType: _(readonly)_ string

The component type. This value is the same string used to identify the component factory.

### context​

context: [Scene.IComponentContext](/reference/scene/icomponentcontext/)

The context provides access to the underlying rendering engine. The sdk framework adds it to the component during construction.

### emits​

emits: _(optional)_ Record<string, boolean> | undefined

An optional dictionary of events emitted by this component. Setting an emit to a falsy value will prevent the component from emitting the event when using `.notify`. These properties can be changed by an external source at any time. If this dictionary is omitted, any and all events will be emitted from `.notify`.

### events​

events: Record<string, boolean>

Declared events; SDK initializes to `{}` when omitted

### inputs​

inputs: _(optional)_ { [x: string]: unknown; } | undefined

An optional dictionary of properties that affects the behavior of the component. These properties can be changed by an external source at any time. It is up to the component to respond appropriately to the changes. These input properties can also be bind targets to an observable source e.g. the output property of another component.

### isMeasurable​

isMeasurable: _(optional)_ boolean | undefined

Whether the `outputs.collider` of this component will be one of the meshes considered for intersection testing in the measurement tool. Put simply, is this component measurable.

Manual and more granular control of pointer intersection can be done by setting the `.userData.isMeasurable` on each THREE.js mesh.

### outputs​

outputs: [ComponentProperties](/reference/scene/#type-componentproperties) & [PredefinedOutputs](/reference/scene/#type-predefinedoutputs)

Declared outputs, plus SDK-reserved outputs

## Methods​

### bind​

bind(prop: string, src: [Scene.IComponent](/reference/scene/icomponent/), srcProp: string): void

deprecated Use [`IObject.bindPath`](/reference/scene/iobject/#bindpath) instead.

Call this function to bind an input property to an output property on another component.

Parameter| Type| prop| string  
inputs property name| src| [Scene.IComponent](/reference/scene/icomponent/)  
source component| srcProp| string  
source outputs property name  
---|---  
  
### bindEvent​

bindEvent(eventType: string, src: [Scene.IComponent](/reference/scene/icomponent/), srcEventType: string): void

deprecated Use [`IObject.bindPath`](/reference/scene/iobject/#bindpath) instead.

Notifies this component of an `eventType` when the `src` Component calls `notify` with a `srcEventType` event

Parameter| Type| eventType| string| src| [Scene.IComponent](/reference/scene/icomponent/)| srcEventType| string  
---|---  
  
### notify​

notify(eventType: string, eventData?: unknown): void

Emit an event to other components

Parameter| Type| eventType| string| eventData?| unknown  
---|---  
  
### onDestroy​

onDestroy(): void

This function is called once right before the scene node has stopped.

### onEvent​

onEvent(eventType: string, eventData?: unknown): void

This function is called once for each interaction or event that occurred during the last frame. The component must set outputs.collider with an Object3D to get interaction callbacks or bindEvent to receive other events.

Parameter| Type| eventType| string| eventData?| unknown  
---|---  
  
### onInit​

onInit(): void

This function is called once after the scene node its attached to has started.

### onInputsUpdated​

onInputsUpdated(previousInputs: { [x: string]: unknown; }): void

This function is called after one or more input properties have changed. It will be called at most once a frame.

Parameter| Type| previousInputs| { [x: string]: unknown; }  
---|---  
  
### onTick​

onTick(tickDelta: number): void

This function is called once a frame after input changes have been detected.

Parameter| Type| tickDelta| number  
---|---  
  
### spyOnEvent​

spyOnEvent(spy: [Scene.IComponentEventSpy](/reference/scene/icomponenteventspy/)<unknown>): [ISubscription](/reference/isubscription/)

deprecated Use [`IObject.spyOnEvent`](/reference/scene/iobject/#spyonevent) instead.

Spy on a component's notify from outside of the component system

Parameter| Type| spy| [Scene.IComponentEventSpy](/reference/scene/icomponenteventspy/)<unknown>  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

an object responsible for removing the spy

  * Properties
    * componentType
    * context
    * emits
    * events
    * inputs
    * isMeasurable
    * outputs
  * Methods
    * bind
    * bindEvent
    * notify
    * onDestroy
    * onEvent
    * onInit
    * onInputsUpdated
    * onTick
    * spyOnEvent



  * Properties
    * componentType
    * context
    * emits
    * events
    * inputs
    * isMeasurable
    * outputs
  * Methods
    * bind
    * bindEvent
    * notify
    * onDestroy
    * onEvent
    * onInit
    * onInputsUpdated
    * onTick
    * spyOnEvent


