<!-- source: https://developers.matterport.com/reference/scene/outputpath/ -->

On this page

A path to a component's output property

_Extends:_ [Scene.PathBase](/reference/scene/pathbase/)

Properties

  * id
  * object



Methods

  * bind
  * get



## Properties​

### id​

id: _(readonly)_ string

The id of this path. Set to a random string, or the id provided when creating the path

### object​

object: _(readonly)_ [Scene.IObject](/reference/scene/iobject/)

The object this path is associated with

## Methods​

### bind​

bind(inputPath: [Scene.InputPath](/reference/scene/inputpath/)): void

Bind this path to an [`InputPath`](/reference/scene/inputpath/). As the value of this output changes, the value returned by the bound [`InputPath.get`](/reference/scene/inputpath/#get) will also change

Parameter| Type| inputPath| [Scene.InputPath](/reference/scene/inputpath/)  
---|---  
  
### get​

get(): T

Get the value of the property associated with this path

**Returns:** `T`

  * Properties
    * id
    * object
  * Methods
    * bind
    * get



  * Properties
    * id
    * object
  * Methods
    * bind
    * get


