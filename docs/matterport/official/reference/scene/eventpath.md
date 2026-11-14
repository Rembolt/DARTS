<!-- source: https://developers.matterport.com/reference/scene/eventpath/ -->

On this page

A path to a component's event property

_Extends:_ [Scene.PathBase](/reference/scene/pathbase/)

Properties

  * id
  * object



Methods

  * bind
  * disable
  * emit
  * enable



## Properties​

### id​

id: _(readonly)_ string

The id of this path. Set to a random string, or the id provided when creating the path

### object​

object: _(readonly)_ [Scene.IObject](/reference/scene/iobject/)

The object this path is associated with

## Methods​

### bind​

bind(emitPath: [Scene.EmitPath](/reference/scene/emitpath/)): void

Bind this path to an [`EmitPath`](/reference/scene/emitpath/).

Parameter| Type| emitPath| [Scene.EmitPath](/reference/scene/emitpath/)  
---|---  
  
### disable​

disable(): void

Disable `this.emit` and the associated Component's `onEvent` from being triggered

### emit​

emit(payload: T): void

Emit the event associated with this path. This is similar to calling [`IComponent.onEvent`](/reference/scene/icomponent/#onevent) directly.

Parameter| Type| payload| T  
---|---  
  
### enable​

enable(): void

Enable `this.emit` and the associated Component's `onEvent` so it can receive the event again

  * Properties
    * id
    * object
  * Methods
    * bind
    * disable
    * emit
    * enable



  * Properties
    * id
    * object
  * Methods
    * bind
    * disable
    * emit
    * enable


