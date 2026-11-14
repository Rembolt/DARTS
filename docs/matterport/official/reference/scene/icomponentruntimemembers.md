<!-- source: https://developers.matterport.com/reference/scene/icomponentruntimemembers/ -->

On this page

Members the SDK attaches to each component instance at {@link INode.addComponent} time. Authors do not declare these — they appear on the runtime {@link IComponent} and on `this` inside lifecycle methods (see {@link IComponentThis}).

Properties

  * componentType
  * context



Methods

  * bind
  * bindEvent
  * notify
  * spyOnEvent



## Properties​

### componentType​

componentType: _(readonly)_ string

The component type. This value is the same string used to identify the component factory.

### context​

context: [Scene.IComponentContext](/reference/scene/icomponentcontext/)

The context provides access to the underlying rendering engine. The sdk framework adds it to the component during construction.

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
  
### spyOnEvent​

spyOnEvent(spy: [Scene.IComponentEventSpy](/reference/scene/icomponenteventspy/)): [ISubscription](/reference/isubscription/)

deprecated Use [`IObject.spyOnEvent`](/reference/scene/iobject/#spyonevent) instead.

Spy on a component's notify from outside of the component system

Parameter| Type| spy| [Scene.IComponentEventSpy](/reference/scene/icomponenteventspy/)  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

an object responsible for removing the spy

  * Properties
    * componentType
    * context
  * Methods
    * bind
    * bindEvent
    * notify
    * spyOnEvent



  * Properties
    * componentType
    * context
  * Methods
    * bind
    * bindEvent
    * notify
    * spyOnEvent


