<!-- source: https://developers.matterport.com/reference/graph/vertex/ -->

On this page

A node in the graph.

Properties

  * data
  * id



Accessors

  * edgesIn
  * edgesInCount
  * edgesOut
  * edgesOutCount
  * neighbors



Methods

  * findEdgeIn
  * findEdgeOut



## Properties​

### data​

data: _(readonly)_ T

User data associated with the vertex.

### id​

id: _(readonly)_ string

The vertex's id.

## Accessors​

### edgesIn​

edgesIn: _(readonly)_ IterableIterator<[Graph.Edge](/reference/graph/edge/)<T>>

An iterable of all edges that have this vertex as its destination endpoint.
    
    
    const vertex = graph.vertex('a');  
    
    
    for (const edgeIn of vertex.edgesIn) {  
    
    
      console.log(`vertex "${edgeIn.dst.id}" has an edge coming in from a vertex "${edgeIn.src.id}"`);  
    
    
    }  
    

### edgesInCount​

edgesInCount: _(readonly)_ number

The nubmer of edges that have this vertex as its destination endpoint.
    
    
    const vertex = graph.vertex('a');  
    
    
    console.log(`vertex "${vertex.id}" has ${vertex.edgesInCount} edges out");  
    

### edgesOut​

edgesOut: _(readonly)_ IterableIterator<[Graph.Edge](/reference/graph/edge/)<T>>

An iterable of all edges that have this vertex as its source endpoint.
    
    
    const vertex = graph.vertex('a');  
    
    
    for (const edgeOut of vertex.edgesOut) {  
    
    
      console.log(`vertex "${edgeOut.src.id}" has an edge going to a vertex "${edgeOut.dst.id}"`);  
    
    
    }  
    

### edgesOutCount​

edgesOutCount: _(readonly)_ number

The nubmer of edges that have this vertex as its source endpoint.
    
    
    const vertex = graph.vertex('a');  
    
    
    console.log(`vertex "${vertex.id}" has ${vertex.edgeOutCount} edges out");  
    

### neighbors​

neighbors: _(readonly)_ IterableIterator<[Graph.Vertex](/reference/graph/vertex/)<T>>

An iterable of all vertices that can be traversed to from this vertex.
    
    
    const vertex = graph.vertex('a');  
    
    
    for (const neighbor of vertex.neighbors) {  
    
    
      console.log(`vertex "${vertex.id}" shares an edge with "${neighbor.id}");  
    
    
    }  
    

## Methods​

### findEdgeIn​

findEdgeIn(predicate: (edgeIn: [Graph.Edge](/reference/graph/edge/)<T>) => boolean, thisArg?: any): [Graph.Edge](/reference/graph/edge/)<T> | undefined

Find an edge into this vertex.
    
    
    const vertex = graph.vertex('a');  
    
    
    // find an edge into 'a' and out from 'b'  
    
    
    vertex.findEdgeIn(edge => edge.src.id === 'b');  
    

Parameter| Type| predicate| (edgeIn: [Graph.Edge](/reference/graph/edge/)<T>) => boolean  
The callback to run against each inward edge until one is found (by returning true.)| thisArg?| any  
The "this" argument to use in predicate  
---|---  
  
**Returns:** [Graph.Edge](/reference/graph/edge/)<`T`> | undefined

### findEdgeOut​

findEdgeOut(predicate: (edgeOut: [Graph.Edge](/reference/graph/edge/)<T>) => boolean, thisArg?: any): [Graph.Edge](/reference/graph/edge/)<T> | undefined

Find an edge out of this vertex.
    
    
    const vertex = graph.vertex('a');  
    
    
    // find an edge out from 'a' and into 'b'  
    
    
    vertex.findEdgeIn(edge => edge.src.id === 'b');  
    

Parameter| Type| predicate| (edgeOut: [Graph.Edge](/reference/graph/edge/)<T>) => boolean  
The callback to run against each outward edge until one is found (by returning true.)| thisArg?| any  
The "this" argument to use in predicate  
---|---  
  
**Returns:** [Graph.Edge](/reference/graph/edge/)<`T`> | undefined

  * Properties
    * data
    * id
  * Accessors
    * edgesIn
    * edgesInCount
    * edgesOut
    * edgesOutCount
    * neighbors
  * Methods
    * findEdgeIn
    * findEdgeOut



  * Properties
    * data
    * id
  * Accessors
    * edgesIn
    * edgesInCount
    * edgesOut
    * edgesOutCount
    * neighbors
  * Methods
    * findEdgeIn
    * findEdgeOut


