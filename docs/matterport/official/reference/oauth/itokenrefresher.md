<!-- source: https://developers.matterport.com/reference/oauth/itokenrefresher/ -->

On this page

A helper to automatically refresh tokens

Methods

  * dispose
  * on



## Methods​

### dispose​

dispose(): void

Shut down, stop refreshing, and clean up resources

### on​

on: _method_ — _3 overloads_

on(event: 'refresh', callback: () => void): [ISubscription](/reference/isubscription/)

Listen for successful refreshes of the token

Parameter| Type| event| 'refresh'  
The 'refresh' event type| callback| () => void  
The callback to call on a refresh  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

on(event: 'error', callback: (e: Error) => void): [ISubscription](/reference/isubscription/)

Listen for errors when refreshing the token

Parameter| Type| event| 'error'  
The 'error' event type| callback| (e: Error) => void  
The callback to call on error  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

on(refreshObserver: [OAuth.IRefreshObserver](/reference/oauth/irefreshobserver/)): [ISubscription](/reference/isubscription/)

Attach an observer that can listen for refresh or error events

Parameter| Type| refreshObserver| [OAuth.IRefreshObserver](/reference/oauth/irefreshobserver/)  
an observer for refresh and error events  
---|---  
  
**Returns:** [ISubscription](/reference/isubscription/)

  * Methods
    * dispose
    * on



  * Methods
    * dispose
    * on


