<!-- source: https://developers.matterport.com/reference/graph/idirectedgraph/ -->

On this page

A directed, weighted graph data structure.

Accessors

  * edgeCount
  * edges
  * vertexCount
  * vertices



Methods

  * addVertex
  * clear
  * commit
  * dispose
  * edge
  * filterVertices
  * findVertex
  * hasEdge
  * hasVertex
  * onEdgesChanged
  * onVerticesChanged
  * removeEdge
  * removeVertex
  * setEdge
  * vertex
  * watch



## Accessors​

### edgeCount​

edgeCount: _(readonly)_ number

The number of edges in the graph.
    
    
    console.log(`the graph has ${graph.edgeCount} edges`);  
    

### edges​

edges: _(readonly)_ IterableIterator<[Graph.Edge](/reference/graph/edge/)<T>>

An iterable of all edges in the graph.
    
    
    for (const edge of graph.edges) {  
    
    
      console.log(`edge: ${edge.src.id} -> ${edge.dst.id}`);  
    
    
    }  
    

### vertexCount​

vertexCount: _(readonly)_ number

The number of vertices in the graph.
    
    
    console.log(`the graph has ${graph.vertexCount} vertices`);  
    

### vertices​

vertices: _(readonly)_ IterableIterator<[Graph.Vertex](/reference/graph/vertex/)<T>>

An iterable of all vertices in the graph.
    
    
    for (const vertex of graph.vertices) {  
    
    
      console.log(`vertex: ${vertex.id}`);  
    
    
    }  
    

## Methods​

### addVertex​

addVertex(vertexData: T extends undefined | void ? [VertexIdDescriptor](/reference/graph/#type-vertexiddescriptor)[] : Array<[VertexDescriptor](/reference/graph/#type-vertexdescriptor)<T>>): void

Add a vertex or set of vertices to the graph.
    
    
    // for vertices with undefined "data" (no data associated with each vertex)  
    
    
    const undefGraph = mpSdk.Graph.createDirectedGraph<undefined>();  
    
    
    graph.addVertex(  
    
    
      { id: 'a' },  
    
    
      { id: 'b' },  
    
    
    );  
    
    
      
    
    
    // for vertices with any other data  
    
    
    const graph = mpSdk.Graph.createDirectedGraph<number>();  
    
    
    graph.addVertex(  
    
    
      { id: 'a', data: 1 },  
    
    
      { id: 'b', data: 2 },  
    
    
    );  
    

Parameter| Type| vertexData| T extends undefined | void ? [VertexIdDescriptor](/reference/graph/#type-vertexiddescriptor)[] : Array<[VertexDescriptor](/reference/graph/#type-vertexdescriptor)<T>>  
A variable number of [`VertexDescriptor`](/reference/graph#type-vertexdescriptor)s to use to create nodes in the graph.  
---|---  
  
### clear​

clear(): void

Remove all vertices and edges from the graph.
    
    
    graph.clear();  
    
    
    // graph.vertexCount === 0  
    
    
    // graph.edgeCount === 0  
    

### commit​

commit(): void

Trigger any attached observers if there were changes to this graph. If there are no changes to the graph, this is a no-op and no callbacks will be triggered.
    
    
    graph.commit();  
    

### dispose​

dispose(): void

Remove all vertices and edges from the graph. Also call an optional `onDispose` provided at construction.
    
    
    graph.dispose();  
    
    
    // graph.vertexCount === 0  
    
    
    // graph.edgeCount === 0  
    

### edge​

edge(src: [Graph.Vertex](/reference/graph/vertex/)<T>, dst: [Graph.Vertex](/reference/graph/vertex/)<T>): [Graph.Edge](/reference/graph/edge/)<T> | undefined

Get the edge that connects one vertex to another.
    
    
    const edge = graph.edge(a, b);  
    
    
    if (edge) {  
    
    
      console.log(`Found an edge from "${edge.src.id}" to "${edge.dst.id}" with weight ${edge.weight}`);  
    
    
    }  
    

Parameter| Type| src| [Graph.Vertex](/reference/graph/vertex/)<T>  
The source vertex.| dst| [Graph.Vertex](/reference/graph/vertex/)<T>  
The destination vertex.  
---|---  
  
**Returns:** [Graph.Edge](/reference/graph/edge/)<`T`> | undefined

If an edge from `src` to `dst` exists, returns the `Edge`. Otherwise, `undefined`.

### filterVertices​

filterVertices(predicate: (vertex: [Graph.Vertex](/reference/graph/vertex/)<T>) => boolean, thisArg?: any): Array<[Graph.Vertex](/reference/graph/vertex/)<T>>

Filter the vertices of this graph to ones that meet the condition specified.
    
    
    // find all vertices that are islands (have no edges in nor out)  
    
    
    graph.filterVertices(verex => (vertex.edgesOutCount + vertex.edgesInCount) > 10);  
    

Parameter| Type| predicate| (vertex: [Graph.Vertex](/reference/graph/vertex/)<T>) => boolean  
The callback to run against each vertex to determine whether to include it in the returned array.| thisArg?| any  
The "this" argument to use in predicate  
---|---  
  
**Returns:** `Array`<[Graph.Vertex](/reference/graph/vertex/)<`T`>>

### findVertex​

findVertex(predicate: (vertex: [Graph.Vertex](/reference/graph/vertex/)<T>) => boolean, thisArg?: any): [Graph.Vertex](/reference/graph/vertex/)<T> | undefined

Find a vertex of this graph.
    
    
    // find a highly connected vertex with more than 10 edges  
    
    
    graph.findVertex(vertex => (vertex.edgesOutCount + vertex.edgesInCount) > 10);  
    

Parameter| Type| predicate| (vertex: [Graph.Vertex](/reference/graph/vertex/)<T>) => boolean  
The callback to run against each vertex until one is found (by returning true.)| thisArg?| any  
The "this" argument to use in predicate  
---|---  
  
**Returns:** [Graph.Vertex](/reference/graph/vertex/)<`T`> | undefined

### hasEdge​

hasEdge(src: [Graph.Vertex](/reference/graph/vertex/)<T>, dst: [Graph.Vertex](/reference/graph/vertex/)<T>): boolean

Test if an edge from one vertex to another is present in the graph.
    
    
    if (graph.hasEdge(a, b)) {  
    
    
      console.log('an edge from "a" to "b" was found');  
    
    
    }  
    

Parameter| Type| src| [Graph.Vertex](/reference/graph/vertex/)<T>  
The source vertex.| dst| [Graph.Vertex](/reference/graph/vertex/)<T>  
The destination vertex.  
---|---  
  
**Returns:** boolean

If an edge from `src` to `dst` exists, returns `true`. Otherwise, `false`.

### hasVertex​

hasVertex(id: string): boolean

Test if a vertex associated with `id` is present in the graph.
    
    
    if (graph.hasVertex('a')) {  
    
    
      console.log('a vertex with id "a" was found');  
    
    
    }  
    

Parameter| Type| id| string  
The vertex's id.  
---|---  
  
**Returns:** boolean

If a vertex with `id` exists, returns `true`. Otherwise, `false`.

### onEdgesChanged​

onEdgesChanged(observer: [IObserver](/reference/iobserver/)<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>>): [ISubscription](/reference/isubscription/)

Subscribe to edge changes.

After this graph's edges have been updated using `setEdge` or `removeEdge`, the `observer` attached will have its `onChanged` function called when `commit` is called.
    
    
    graph.onEdgesChanged({  
    
    
      onChanged() {  
    
    
        console.log(`this graph's edges have changed`);  
    
    
      }  
    
    
    });  
    

Parameter| Type| observer| [IObserver](/reference/iobserver/)<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>>  
an observer notified when the graph's edges change  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

### onVerticesChanged​

onVerticesChanged(observer: [IObserver](/reference/iobserver/)<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>>): [ISubscription](/reference/isubscription/)

Subscribe to vertex changes.

After this graph's vertices have been updated using `addVertex` or `removeVertex`, the `observer` attached will have its `onChanged` function called when `commit` is called.
    
    
    graph.onVerticesChanged({  
    
    
      onChanged() {  
    
    
        console.log(`this graph's vertices have changed`);  
    
    
      }  
    
    
    });  
    

Parameter| Type| observer| [IObserver](/reference/iobserver/)<[Graph.IDirectedGraph](/reference/graph/idirectedgraph/)<T>>  
an observer notified when the graph's vertices change  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

### removeEdge​

removeEdge(edges: Array<[Graph.Edge](/reference/graph/edge/)<T>>): void

Remove an edge or a set of edges from the graph.
    
    
    graph.removeEdge(e1, e2);  
    

Parameter| Type| edges| Array<[Graph.Edge](/reference/graph/edge/)<T>>  
A variable number of edges to remove.  
---|---  
  
### removeVertex​

removeVertex(vertices: Array<[Graph.Vertex](/reference/graph/vertex/)<T>>): void

Remove a vertex or a set of vertices from the graph.
    
    
    graph.removeVertex(a, b);  
    

Parameter| Type| vertices| Array<[Graph.Vertex](/reference/graph/vertex/)<T>>  
A variable number of vertices to remove.  
---|---  
  
### setEdge​

setEdge(edgeDescs: Array<[EdgeDescriptor](/reference/graph/#type-edgedescriptor)<T>>): void

Set the weight of an edge or set of edges between pairs of vertices representing the connections from `src` to `dst`.

If an error is thrown, the graph is left untouched, no edges are added.
    
    
    graph.setEdge(  
    
    
      { src: a, dst: b, weight: 5  },  
    
    
      { src: b, dst: c, weight: 10 },  
    
    
    );  
    
    
      
    
    
    // update edge ab  
    
    
    graph.setEdge(  
    
    
      { src: a, dst: b, weight: 10 },  
    
    
    );  
    

Parameter| Type| edgeDescs| Array<[EdgeDescriptor](/reference/graph/#type-edgedescriptor)<T>>  
One or more [`EdgeDescriptor`](/reference/graph#type-edgedescriptor)s describing the edges to set.  
---|---  
  
### vertex​

vertex(id: string): [Graph.Vertex](/reference/graph/vertex/)<T> | undefined

Get the vertex associated with `id`.
    
    
    const a = graph.vertex('a');  
    
    
    if (a) {  
    
    
      console.log(`Found a vertex with id "${a.id}"`);  
    
    
    }  
    

Parameter| Type| id| string  
The vertex's id.  
---|---  
  
**Returns:** [Graph.Vertex](/reference/graph/vertex/)<`T`> | undefined

If a vertex with `id` exists, returns the `Vertex`. Otherwise, `undefined`.

### watch​

watch(collectionAdaptor: [Graph.ICollectionAdaptor](/reference/graph/icollectionadaptor/)<T>): [ISubscription](/reference/isubscription/)

Watch a collection and update the graph as the collection changes.

**Note:** If you need a graph of enabled sweeps, use [`Sweep.createGraph`](/reference/sweep/#creategraph) instead of the code snippet below
    
    
    // create a graph of enabled sweeps  
    
    
    const graph = mpSdk.createGraph();  
    
    
    const sub = graph.watch({  
    
    
      collection: mpSdk.Sweep.collection,  
    
    
      isNeighborOf(sweepSrc, sweepDst) {  
    
    
        return sweepSrc.data.neighbors.includes(sweepDst.id);  
    
    
      },  
    
    
      neighborsOf(sweepVertex) {  
    
    
        return sweepVertex.data.neighbors.values();  
    
    
      },  
    
    
      weightBetween(sweepSrc, sweepDst) {  
    
    
        const dx = sweepDst.data.position.x - sweepSrc.data.position.x;  
    
    
        const dy = sweepDst.data.position.y - sweepSrc.data.position.y;  
    
    
        const dz = sweepDst.data.position.z - sweepSrc.data.position.z;  
    
    
        return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);  
    
    
      },  
    
    
      shouldAdd(sweep) {  
    
    
        return sweep.enabled;  
    
    
      },  
    
    
    });  
    
    
      
    
    
    // some time later when the graph no longer needs updating  
    
    
    sub.cancel();  
    

Parameter| Type| collectionAdaptor| [Graph.ICollectionAdaptor](/reference/graph/icollectionadaptor/)<T>  
the adaptor that maps an observable collection to graph vertices and edges  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

ISubscription

  * Accessors
    * edgeCount
    * edges
    * vertexCount
    * vertices
  * Methods
    * addVertex
    * clear
    * commit
    * dispose
    * edge
    * filterVertices
    * findVertex
    * hasEdge
    * hasVertex
    * onEdgesChanged
    * onVerticesChanged
    * removeEdge
    * removeVertex
    * setEdge
    * vertex
    * watch



  * Accessors
    * edgeCount
    * edges
    * vertexCount
    * vertices
  * Methods
    * addVertex
    * clear
    * commit
    * dispose
    * edge
    * filterVertices
    * findVertex
    * hasEdge
    * hasVertex
    * onEdgesChanged
    * onVerticesChanged
    * removeEdge
    * removeVertex
    * setEdge
    * vertex
    * watch


