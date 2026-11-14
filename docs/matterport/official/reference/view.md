<!-- source: https://developers.matterport.com/reference/view/ -->

On this page

Interfaces

  * [Layer](/reference/view/layer/)
  * [View](/reference/view/view/)



Types

  * CreateLayerOptions



Enumerations

  * LayerType
  * ViewType



Observables

  * current
  * layers
  * viewsOn this page

Interfaces

    * [Layer](/reference/view/layer/)
    * [View](/reference/view/view/)

Types

    * CreateLayerOptions

Enumerations

    * LayerType
    * ViewType

Observables

    * current
    * layers
    * views

Methods

    * createLayer
    * deleteLayer

## Types​

### CreateLayerOptions​

CreateLayerOptions: _object_

Property| Type| common| boolean  
---|---  
  
## Enumerations​

### LayerType​

LayerType: _enum_

Member| Value| BASE| "layertype.base"| IN_MEMORY| "layertype.inmemory"| OTHER| "layertype.other"| USER| "layertype.user"| VIEW_DATA| "layertype.viewdata"  
---|---  
  
### ViewType​

ViewType: _enum_

Member| Value| BASE| "viewtype.base"| DEFURNISH| "viewtype.defurnish"| LAYERED_BASE| "viewtype.layeredbase"| OTHER| "viewtype.other"| USER| "viewtype.user"  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<[View.View](/reference/view/view/)>

Early Access

The currently active view
    
    mpSdk.View.current.subscribe((currentView) => {  
    
    
      console.log('the currently active view is', currentView.name);  
    
    
    });  
    

### layers​

layers: [IObservableMap](/reference/iobservablemap/)<[View.Layer](/reference/view/layer/)>

All layers associated with the current space.

Layers in inactive Views may not populate right away. Activating a View will trigger the Layers to populate.
    
    mpSdk.View.layers.subscribe({  
    
    
      onAdded(index, layer, collection) {  
    
    
        console.log('a layer with id', layer.id, 'named', layer.name);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('all layers', collection);  
    
    
      },  
    
    
    });  
    

### views​

views: [IObservableMap](/reference/iobservablemap/)<[View.View](/reference/view/view/)>

Early Access

All views associated with the current space.
    
    mpSdk.View.views.subscribe({  
    
    
      onAdded(index, view, collection) {  
    
    
        console.log('a view with id', view.id, 'named', view.name);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('all views', collection);  
    
    
      },  
    
    
    });  
    

## Methods​

### createLayer​

createLayer(name: string, options?: Partial<View.CreateLayerOptions>): Promise<[View.Layer](/reference/view/layer/)>

Create a layer that can be later added to a View or Views
    
    // create a standard Layer to be added to a View  
    
    
    const layer = await mpSdk.View.createLayer('my layer');  
    
    
    // create a common Layer that is in all Views  
    
    
    const layer = await mpSdk.View.createLayer('my layer', { common: true });  
    

Parameter| Type| name| string  
the human-readable name for the new layer| options?| Partial<View.CreateLayerOptions>  
optional settings such as whether the layer is common across all views  
---|---  
  
**Returns:** `Promise`<[View.Layer](/reference/view/layer/)>

### deleteLayer



Methods

  * createLayer
  * deleteLayer



## Types​

### CreateLayerOptions​

CreateLayerOptions: _object_

Property| Type| common| boolean  
---|---  
  
## Enumerations​

### LayerType​

LayerType: _enum_

Member| Value| BASE| "layertype.base"| IN_MEMORY| "layertype.inmemory"| OTHER| "layertype.other"| USER| "layertype.user"| VIEW_DATA| "layertype.viewdata"  
---|---  
  
### ViewType​

ViewType: _enum_

Member| Value| BASE| "viewtype.base"| DEFURNISH| "viewtype.defurnish"| LAYERED_BASE| "viewtype.layeredbase"| OTHER| "viewtype.other"| USER| "viewtype.user"  
---|---  
  
## Observables​

### current​

current: [IObservable](/reference/iobservable/)<[View.View](/reference/view/view/)>

Early Access

The currently active view
    
    
    mpSdk.View.current.subscribe((currentView) => {  
    
    
      console.log('the currently active view is', currentView.name);  
    
    
    });  
    

### layers​

layers: [IObservableMap](/reference/iobservablemap/)<[View.Layer](/reference/view/layer/)>

All layers associated with the current space.

Layers in inactive Views may not populate right away. Activating a View will trigger the Layers to populate.
    
    
    mpSdk.View.layers.subscribe({  
    
    
      onAdded(index, layer, collection) {  
    
    
        console.log('a layer with id', layer.id, 'named', layer.name);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('all layers', collection);  
    
    
      },  
    
    
    });  
    

### views​

views: [IObservableMap](/reference/iobservablemap/)<[View.View](/reference/view/view/)>

Early Access

All views associated with the current space.
    
    
    mpSdk.View.views.subscribe({  
    
    
      onAdded(index, view, collection) {  
    
    
        console.log('a view with id', view.id, 'named', view.name);  
    
    
      },  
    
    
      onCollectionUpdated(collection) {  
    
    
        console.log('all views', collection);  
    
    
      },  
    
    
    });  
    

## Methods​

### createLayer​

createLayer(name: string, options?: Partial<View.CreateLayerOptions>): Promise<[View.Layer](/reference/view/layer/)>

Create a layer that can be later added to a View or Views
    
    
    // create a standard Layer to be added to a View  
    
    
    const layer = await mpSdk.View.createLayer('my layer');  
    
    
    // create a common Layer that is in all Views  
    
    
    const layer = await mpSdk.View.createLayer('my layer', { common: true });  
    

Parameter| Type| name| string  
the human-readable name for the new layer| options?| Partial<View.CreateLayerOptions>  
optional settings such as whether the layer is common across all views  
---|---  
  
**Returns:** `Promise`<[View.Layer](/reference/view/layer/)>

### deleteLayer​

deleteLayer(layer: [View.Layer](/reference/view/layer/)): Promise<void>

_Introduced 25.3.4_

Delete a layer. The Layer will be removed from all views that it is in.
    
    
    const layer = await mpSdk.View.createLayer('my layer');  
    
    
    await mpSdk.View.deleteLayer(layer);  
    

Parameter| Type| layer| [View.Layer](/reference/view/layer/)  
---|---  
  
**Returns:** `Promise`<void>

  * Interfaces
    * [Layer](/reference/view/layer/)
    * [View](/reference/view/view/)
  * Types
    * CreateLayerOptions
  * Enumerations
    * LayerType
    * ViewType
  * Observables
    * current
    * layers
    * views
  * Methods
    * createLayer
    * deleteLayer



  * Types
    * CreateLayerOptions
  * Enumerations
    * LayerType
    * ViewType
  * Observables
    * current
    * layers
    * views
  * Methods
    * createLayer
    * deleteLayer


