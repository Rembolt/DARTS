<!-- source: https://developers.matterport.com/reference/scene/inputpath/ -->

On this page

A path to a component's input property

_Extends:_ [Scene.PathBase](/reference/scene/pathbase/)

Properties

  * id
  * object



Methods

  * bind
  * get
  * set



## Properties​

### id​

id: _(readonly)_ string

The id of this path. Set to a random string, or the id provided when creating the path

### object​

object: _(readonly)_ [Scene.IObject](/reference/scene/iobject/)

The object this path is associated with

## Methods​

### bind​

bind(outputPath: [Scene.OutputPath](/reference/scene/outputpath/)): void

Bind this path to an [`OutputPath`](/reference/scene/outputpath/). As the value of the bound output path changes, the value returned by `get` will also change

Parameter| Type| outputPath| [Scene.OutputPath](/reference/scene/outputpath/)  
the output path to bind to  
---|---  
  
### get​

get(): T

Get the value of the property associated with this path

**Returns:** `T`

### set​

set(newVal: T): void

Set the value of the property associated with this path

Parameter| Type| newVal| T  
the new value to set  
---|---  
  
  * Properties
    * id
    * object
  * Methods
    * bind
    * get
    * set



  * Properties
    * id
    * object
  * Methods
    * bind
    * get
    * set


