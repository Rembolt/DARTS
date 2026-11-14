<!-- source: https://developers.matterport.com/reference/graph/icollectionadaptor/ -->

On this page

An adaptor for an observable collection to automatically generate and update a graph. Used in [`IDirectedGraph.watch`](/reference/graph/idirectedgraph/#watch).

Properties

  * collection



Methods

  * isNeighborOf
  * neighborsOf
  * shouldAdd
  * weightBetween



## Observables​

### collection​

collection: [IObservableMap](/reference/iobservablemap/)<T>

A observable collection from the sdk, e.g. `mpSdk.Sweep.data`.

## Methods​

### isNeighborOf​

isNeighborOf(src: [Graph.Vertex](/reference/graph/vertex/)<T>, dst: [Graph.Vertex](/reference/graph/vertex/)<T>): boolean

Determines whether or not an item from the collection should be considered a neighbor of another item.

Parameter| Type| src| [Graph.Vertex](/reference/graph/vertex/)<T>  
A vertex containing the source item| dst| [Graph.Vertex](/reference/graph/vertex/)<T>  
A vertex containing the destination item  
---|---  
  
**Returns:** boolean

### neighborsOf​

neighborsOf(item: [Graph.Vertex](/reference/graph/vertex/)<T>): IterableIterator<string>

Get a list of ids for other vertices that should be considered neighbors to an item in the collection.

Parameter| Type| item| [Graph.Vertex](/reference/graph/vertex/)<T>  
a vertex to find neighbors for  
---|---  
  
**Returns:** `IterableIterator`<string>

### shouldAdd​

shouldAdd(item: T): boolean

Determines whether or not an item from the collection will be added as a graph vertex.

Parameter| Type| item| T  
the collection item to evaluate  
---|---  
  
**Returns:** boolean

### weightBetween​

weightBetween(src: [Graph.Vertex](/reference/graph/vertex/)<T>, dst: [Graph.Vertex](/reference/graph/vertex/)<T>): number

Get the weight between two items in the collection to use as the connecting edges weight.

Parameter| Type| src| [Graph.Vertex](/reference/graph/vertex/)<T>  
the source vertex| dst| [Graph.Vertex](/reference/graph/vertex/)<T>  
the destination vertex  
---|---  
  
**Returns:** number

  * Properties
    * collection
  * Methods
    * isNeighborOf
    * neighborsOf
    * shouldAdd
    * weightBetween



  * Observables
    * collection
  * Methods
    * isNeighborOf
    * neighborsOf
    * shouldAdd
    * weightBetween


