<!-- source: https://developers.matterport.com/reference/scene/isceneobjectspy/ -->

On this page

A spy allows for spying on events triggered on a component from outside of the component system

Properties

  * path



Methods

  * onEvent



## Properties​

### path​

path: _(readonly)_ [Scene.InputPath](/reference/scene/inputpath/) | [Scene.OutputPath](/reference/scene/outputpath/) | [Scene.EventPath](/reference/scene/eventpath/) | [Scene.EmitPath](/reference/scene/emitpath/)

The path to spy on

## Methods​

### onEvent​

onEvent(eventData: T): void

Triggered when the data at `path` changes or when its event is triggered

Parameter| Type| eventData| T  
The data sent with event from a [`IComponent.notify`](/reference/scene/icomponent#notify) call or the new value of the input or output referenced by the path.  
---|---  
  
  * Properties
    * path
  * Methods
    * onEvent



  * Properties
    * path
  * Methods
    * onEvent


