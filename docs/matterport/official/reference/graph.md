<!-- source: https://developers.matterport.com/reference/graph/ -->

On this page

Interfaces

  * [Edge](/reference/graph/edge/)
  * [IAStarRunner](/reference/graph/iastarrunner/)
  * [ICollectionAdaptor](/reference/graph/icollectionadaptor/)
  * [IDirectedGraph](/reference/graph/idirectedgraph/)
  * [SearchOptions](/reference/graph/searchoptions/)
  * [Vertex](/reference/graph/vertex/)



Types

  * AStarResult
  * EdgeDescriptor
  * VertexDescriptor
  * VertexIdDescriptor



Enumerations

  * AStarStatus



Methods

  * cloneGraph
  * createAStarRunner
  * createDirectedGraph
  * findCycle
  * findCycles



## Types​

### AStarResult​

AStarResult<T>: _object_

The result of doing an A* search.

Property| Type| cost| number  
The total cost of tranversing the path.| path| Array<[Graph.Vertex](/reference/graph/vertex/)<T>>  
On success, contains the path of vertices.| status| Graph.AStarStatus  
Whether the search was successful, timed out, or if there was no path found.  
---|---  
  
### EdgeDescriptor​

EdgeDescriptor<T>: _object_

A descriptor for a graph edge. Used when adding edges to a graph.

Property| Type| dst| [Graph.Vertex](/reference/graph/vertex/)<T>  
The destination vertex.| src| [Graph.Vertex](/reference/graph/vertex/)<T>  
The source vertex.| weight?| number | undefined  
The weight of the edge.  
---|---  
  
### VertexDescriptor​

VertexDescriptor<T>: _object_

A descriptor for a graph vertex. Used when adding vertices to a graph.

Property| Type| data| T  
Any user data to be associated with this vertex| id| string  
The id that can be used to lookup this vertex in the graph  
---|---  
  
### VertexIdDescriptor​

VertexIdDescriptor: _object_

A descriptor for a graph vertex when no extra data will be associated with each vertex. Used when adding vertices to a graph.

Property| Type| id| string  
The id that can be used to lookup this vertex in the graph  
---|---  
  
## Enumerations​

### AStarStatus​

AStarStatus: _enum_

The status of an A* search.

Member| Value| NO_END_VERTEX| "astar.status.no_end"  
The end vertex was not found in the graph.| NO_PATH| "astar.status.no_path"  
No path was found.| NO_START_VERTEX| "astar.status.no_start"  
The start vertex was not found in the graph.| SUCCESS| "astar.status.success"  
A path was found.| TIMEOUT| "astar.status.timeout"  
A path wasn't found in the time specified.  
---|---  
  
## Methods​

### cloneGraph​

cloneGraph(graph: [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>): [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>

_Introduced 25.6.1_

Clone a graph, creating new vertices and edges. Doesnt clone any of the vertices' `.data`.
    
    
    const graph = mpSdk.Graph.createDirectedGraph();  
    
    
    // ... setup graph vertices and edges  
    
    
    const clone = sdk.Graph.cloneGraph(graph);  
    

Parameter| Type| graph| [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>  
the directed graph to clone  
---|---  
  
**Returns:** [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<`T`>

### createAStarRunner​

createAStarRunner(graph: [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>, start: [Graph.Vertex](/reference/graph/vertex/)<T>, end: [Graph.Vertex](/reference/graph/vertex/)<T>, options?: Partial<[Graph.SearchOptions](/reference/graph/searchoptions/)<T>>): [Graph.IAStarRunner](/reference/graph/iastarrunner/)<T>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

Create a "runner" for the A* algorithm around a `graph`, and `start` and `end` vertices.

The runner encapsulates the details of the graph and search, caches the results of A*, and provides a way to subscribe to potential changes in the path signifying that the results of `Graph.AStarRunner.exec` may have changed.
    
    
    const graph = mpSdk.Graph.createDirectedGraph();  
    
    
    // ... setup graph vertices and edges  
    
    
    const start = graph.vertex('start');  
    
    
    const end = graph.vertex('end');  
    
    
    const aStarRunner = mpSdk.Graph.createAStarRunner(graph, start, end);  
    
    
    const result = aStarRunner.exec();  
    

Parameter| Type| graph| [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>  
The graph to traverse| start| [Graph.Vertex](/reference/graph/vertex/)<T>  
The start vertex.| end| [Graph.Vertex](/reference/graph/vertex/)<T>  
The end vertex.| options?| Partial<[Graph.SearchOptions](/reference/graph/searchoptions/)<T>>  
An optional heuristic function.  
---|---  
  
**Returns:** [Graph.IAStarRunner](/reference/graph/iastarrunner/)<`T`>

A runner for A* that can execute the search or be subscribed to.

### createDirectedGraph​

createDirectedGraph(onDispose?: () => void): [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>

Bundle Embed

_Introduced 3.1.55.2-34-ga9934ccd93_

Create an empty graph data structure.
    
    
    const graph = mpSdk.Graph.createDirectedGraph();  
    

Parameter| Type| onDispose?| () => void  
An optional callback to be called when [`IDirectedGraph.dispose`](/reference/graph/idirectedgraph#dispose) is called  
---|---  
  
**Returns:** [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<`T`>

### findCycle​

findCycle(graph: [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>): Iterable<[Graph.Vertex](/reference/graph/vertex/)<T>>

Bundle Embed

_Introduced 25.6.1_

Find a cycle in a graph.
    
    
    const graph = mpSdk.Graph.createDirectedGraph();  
    
    
    // assuming graph has edges A -> B, B -> C, C -> D, D -> B  
    
    
    // should find the cycle [B, C, D]  
    
    
    const cycle = sdk.Graph.findCyle(graph);  
    

Parameter| Type| graph| [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>  
the directed graph to search for a cycle  
---|---  
  
**Returns:** `Iterable`<[Graph.Vertex](/reference/graph/vertex/)<`T`>>

an Iterable of vertices that represent a found cycle or `[]` if none were found

### findCycles​

findCycles(graph: [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>): Iterable<Iterable<[Graph.Vertex](/reference/graph/vertex/)<T>>>

Bundle Embed

_Introduced 25.6.1_

Find multiple cycles in a graph. Note: If a vertex is in multiple cycles, only one will be reported.
    
    
    const graph = mpSdk.Graph.createDirectedGraph();  
    
    
    // assuming graph has edges A -> B, B -> C, C -> A, D -> E, E -> D  
    
    
    // should find cycles [A, B, C], and [D, E]  
    
    
    const cycle = sdk.Graph.findCyle(graph);  
    

Parameter| Type| graph| [Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>  
the directed graph to search for cycles  
---|---  
  
**Returns:** `Iterable`<`Iterable`<[Graph.Vertex](/reference/graph/vertex/)<`T`>>>

an iterbale of iterables (like an array of arrays) of vertices

  * Interfaces
    * [Edge](/reference/graph/edge/)
    * [IAStarRunner](/reference/graph/iastarrunner/)
    * [ICollectionAdaptor](/reference/graph/icollectionadaptor/)
    * [IDirectedGraph](/reference/graph/idirectedgraph/)
    * [SearchOptions](/reference/graph/searchoptions/)
    * [Vertex](/reference/graph/vertex/)
  * Types
    * AStarResult
    * EdgeDescriptor
    * VertexDescriptor
    * VertexIdDescriptor
  * Enumerations
    * AStarStatus
  * Methods
    * cloneGraph
    * createAStarRunner
    * createDirectedGraph
    * findCycle
    * findCycles



  * Types
    * AStarResult
    * EdgeDescriptor
    * VertexDescriptor
    * VertexIdDescriptor
  * Enumerations
    * AStarStatus
  * Methods
    * cloneGraph
    * createAStarRunner
    * createDirectedGraph
    * findCycle
    * findCycles


