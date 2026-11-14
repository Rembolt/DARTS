<!-- source: https://developers.matterport.com/reference/graph/iastarrunner/ -->

On this page

An object that encapsulates a graph and can be used to execute A* or subscribe to A* for potential changes.

Methods

  * dispose
  * exec
  * subscribe



## Methods​

### dispose​

dispose(): void

Release resources associated with the runner. This function should be called once you are done with the runner.

### exec​

exec(timeout?: number): [AStarResult](/reference/graph/#type-astarresult)<T>

Do the A* search.

Parameter| Type| timeout?| number  
The amount of time to spend trying to find a path. Defaults to 5000ms.  
---|---  
  
**Returns:** [AStarResult](/reference/graph/#type-astarresult)<`T`>

The results of running A*.
    
    
    const aStarRunner = mpSdk.Graph.createAStarRunner(...);  
    
    
    const result = aStarRunner.exec();  
    
    
    if (result.status === mpSdk.Graph.AStarStatus.SUCCESS) {  
    
    
    console.log('found a path of length', result.path.length);  
    
    
    }  
    

### subscribe​

subscribe(observer: [IObserver](/reference/iobserver/)<[Graph.IAStarRunner](/reference/graph/iastarrunner/)<T>> | [ObserverCallback](/reference/#type-observercallback)<[Graph.IAStarRunner](/reference/graph/iastarrunner/)<T>>): [ISubscription](/reference/isubscription/)

Subscribe to changes in the underlying graph and receive a callback in `observer` when changes are detected.

Parameter| Type| observer| [IObserver](/reference/iobserver/)<[Graph.IAStarRunner](/reference/graph/iastarrunner/)<T>> | [ObserverCallback](/reference/#type-observercallback)<[Graph.IAStarRunner](/reference/graph/iastarrunner/)<T>>  
an observer or callback notified when the underlying graph changes  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

A subscription to stop listening for changes to the graph.
    
    
    const aStarRunner = mpSdk.Graph.createAStarRunner(...);  
    
    
    const subscription = aStarRunner.subscribe({  
    
    
    onChanged(runner) {  
    
    
    const result = runner.exec();  
    
    
    if (result.status === mpSdk.Graph.AStarStatus.SUCCESS) {  
    
    
    console.log('found a path of length', result.path.length);  
    
    
    }  
    
    
    }  
    
    
    });  
    
    
    // ... some time later when the runner is no longer needed  
    
    
    subscription.cancel();  
    

  * Methods
    * dispose
    * exec
    * subscribe



  * Methods
    * dispose
    * exec
    * subscribe


