<!-- source: https://developers.matterport.com/reference/mattertag/imessenger/ -->

On this page

A messaging object to send and receive messages to and from your iframe sandbox.

Methods

  * off
  * on
  * send



## Methods​

### off​

off(eventType: string, eventHandler: (...args: any[]) => void): void

Remove a handler for messages of type `eventType` from the iframe sandbox

Parameter| Type| eventType| string| eventHandler| (...args: any[]) => void  
---|---  
  
### on​

on(eventType: string, eventHandler: (...args: any[]) => void): void

Add a handler for messages of type `eventType` from the iframe sandbox

Parameter| Type| eventType| string| eventHandler| (...args: any[]) => void  
---|---  
  
### send​

send(eventType: string, args: any[]): void

Send a messages of type `eventType` to the iframe sandbox with any optional data associated with the message

Parameter| Type| eventType| string| args| any[]  
---|---  
  
  * Methods
    * off
    * on
    * send



  * Methods
    * off
    * on
    * send


