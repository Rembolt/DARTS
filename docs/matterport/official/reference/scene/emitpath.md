<!-- source: https://developers.matterport.com/reference/scene/emitpath/ -->

On this page

A path to a component's emit property

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

bind(eventPath: [Scene.EventPath](/reference/scene/eventpath/)): void

Bind this path to an [`EventPath`](/reference/scene/eventpath/).

Parameter| Type| eventPath| [Scene.EventPath](/reference/scene/eventpath/)  
---|---  
  
### disable​

disable(): void

Disable `this.emit` and the associated Component's `notify`

### emit​

emit(payload: T): void

Emit the event associated with this path. This is similar to [`IComponent.notify`](/reference/scene/icomponent/#notify)

Parameter| Type| payload| T  
---|---  
  
### enable​

enable(): void

Enable `this.emit` and the associated Component's ability to `notify`

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


