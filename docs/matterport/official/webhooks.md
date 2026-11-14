<!-- source: https://developers.matterport.com/webhooks/ -->

On this page

note

Webhooks are only available for Enterprise-level Matterport Subscriptions

Webhooks, sometimes referred to as “reverse APIs,” function like an API that’s triggered by events rather than requests. Matterport’s webhook framework lets you subscribe to events so that you can get real-time notifications and updates. This way, instead of your system having to repeatedly ask Matterport’s system whether an event occurred, you can set up a webhook so that you’re notified when it happens.

## Getting Started​

The ability to register Webhook callbacks with the Matterport system requires:

  * Account Feature Unlock
  * Developer License Unlock and API Tokens
  * Enterprise Subscription Plan



Once enabled, Webhook callbacks can be registered and managed through the our [Model API](/api/).

## Registering a Model Event Callback​

Webhook callback registration and management for model events is handled through various mutations to the [Model API](https://api.matterport.com/model/docs/reference).

The **`addModelEventWebhookCallback`** mutation registers a callback URL through a WebhookCallbackInput object for specified eventTypes. Optional query parameters can be included, as well as basic or token credentials for authentication.

For security reasons, it’s recommended to provide credentials for the Webhook callback registration.

addModelEventWebhookCallback
    
    
    mutation addWebhook {  
    
    
      addModelEventWebhookCallback(  
    
    
        input: {  
    
    
          eventTypes: [created, deleted]  
    
    
          callback: {  
    
    
            scheme: "http"  
    
    
            host: "myawesomeapi.com",  
    
    
            port: 9090  
    
    
            path: "testWebhook"  
    
    
            credType: basic  
    
    
            credKey: "Your API Key"  
    
    
            credSecret: "Your API Secret"  
    
    
            additionalHeaders: [  
    
    
              { key: "key1", value: "value1" }  
    
    
              { key: "key2", value: "value2" }  
    
    
            ]  
    
    
            queryParams: [  
    
    
              { key: "key1", value: "value1" }  
    
    
              { key: "key2", value: "value2" }  
    
    
            ]  
    
    
          }  
    
    
          version: 2  
    
    
        }  
    
    
      ) {  
    
    
        id  
    
    
        eventTypes  
    
    
        callback {  
    
    
          scheme  
    
    
          host  
    
    
          port  
    
    
          path  
    
    
        }  
    
    
        version  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "addModelEventWebhookCallback": {  
    
    
          "id": "887n9rwrdxytnttms0t1h02mc",  
    
    
          "eventTypes": [  
    
    
            "created",  
    
    
            "deleted"  
    
    
          ],  
    
    
          "callback": {  
    
    
             ...   
    
    
          },  
    
    
          version: 2  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20addWebhook%20%7B%0A%20%20addModelEventWebhookCallback\(%0A%20%20%20%20input%3A%20%7B%0A%20%20%20%20%20%20eventTypes%3A%20%5Bcreated%2C%20deleted%5D%0A%20%20%20%20%20%20callback%3A%20%7B%0A%20%20%20%20%20%20%20%20scheme%3A%20%22http%22%0A%20%20%20%20%20%20%20%20host%3A%20%22myawesomeapi.com%22%2C%0A%20%20%20%20%20%20%20%20port%3A%209090%0A%20%20%20%20%20%20%20%20path%3A%20%22testWebhook%22%0A%20%20%20%20%20%20%20%20credType%3A%20basic%0A%20%20%20%20%20%20%20%20credKey%3A%20%22Your%20API%20Key%22%0A%20%20%20%20%20%20%20%20credSecret%3A%20%22Your%20API%20Secret%22%0A%20%20%20%20%20%20%20%20additionalHeaders%3A%20%5B%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key1%22%2C%20value%3A%20%22value1%22%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key2%22%2C%20value%3A%20%22value2%22%20%7D%0A%20%20%20%20%20%20%20%20%5D%0A%20%20%20%20%20%20%20%20queryParams%3A%20%5B%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key1%22%2C%20value%3A%20%22value1%22%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key2%22%2C%20value%3A%20%22value2%22%20%7D%0A%20%20%20%20%20%20%20%20%5D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20version%3A%202%0A%20%20%20%20%7D%0A%20%20\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20eventTypes%0A%20%20%20%20callback%20%7B%0A%20%20%20%20%20%20scheme%0A%20%20%20%20%20%20host%0A%20%20%20%20%20%20port%0A%20%20%20%20%20%20path%0A%20%20%20%20%7D%0A%20%20%20%20version%0A%20%20%7D%0A%7D)

You may use the _queryParams_ object to define additional parameters that will be passed to your endpoint. If your endpoint requires additional headers, you may also pass them as key/value pairs.

For reference, please review the [schema](https://static.matterport.com/api-doc/2024.11.50-main-g99fa2e3/reference/graphdoc/model/modeleventcallbackinput.doc) for this mutation.

## Versions​

The _version_ field allows a user to select the version of Webhooks that they are wishing to implement. Webhooks version 2 was introduced in November 2024 and is documented on this page. For reference materials on the prior version, please visit the [Webhooks v1.0](/webhooks/v1/) (deprecated) reference guide.

## Event Types​

The following events can subscribed to with WebHooks v2.0.

**Event**| **Description**|  activation_state_changed| The activation state of the model changed (active, archived or pending)| bundle_updated| The state of an addon bundle for this model changed (requested or delivered)| created| A model has been created after upload| deleted| A model has been deleted| details_changed| A model's details object has been modified| processed| A model has completed processing| restored| A model has been restored| transferred_in| A model has been transferred into your account| transferred_out| A model has been transferred out of your account| visibility_changed| A model's privacy has changed  
---|---  
  
## Webhook Callback Payload​

Common attributes, all webhook events will have these properties at the root level.

**Name**| **Type**| **Description**|  modelId| ID!| The model associated with the event.| version| Long!| The version associated with the model at this point.| webhookId| ID!| The ID of the webhook that was registered with this event.| webhookCustomKey| String| Optional user data associated with the webhook.| timestamp| DateTime!| The time the event was generated at.| type| String!| One of the event types from the following table| body| JSON Object| Defined by the following table  
---|---|---  
  
## Webhook Body Object​

**Event Type**| **Body**|  activation_state_changed| { previous: { state: pending | active | inactive }current: { state: pending | active | inactive } }| bundle_updated| { status: requested | delivered | canceled | failed,bundleId: string }| created| { type: copy | demo | transfer | processing | unknown }| deleted| { }| details_changed| { previous: { ... },current: { ... } }| processed| { status: succeeded|failed, error: string }| restored| { type: copy | demo | transfer | processing | unknown }| transferred_in| { source: OrgID }| transferred_out| { destination: OrgID}| visibility_changed| { previous: { accessVisibility: privat | public | unlisted | active },current: { accessVisibility: private | public | unlisted | active } }  
---|---  
  
The ModelDetailsChanged payload will not be propagated until model processing completes. The events that would trigger a ModelDetailsChanged event and would be included in the previous/current payloads:

  * address { * }
  * description
  * image { id }
  * internalId
  * mls { id name }
  * name
  * publication { description, externalUrl, presentedby, summary }



## Model Processed & Activation State Changed​

When a model has finished processing it may not immediately be active and ready to accept mutations.

For the majority of our users, a model will begin with a pending status. Our platform will analyze the number of scans to determine the number of active spaces that the model will consume and will check the available spaces left for your account. If the account has the capacity to store this new model, the model will then be set to active.

Performing a mutation immediately after a model has processed may result in an error. This race condition can be mitigated by subscribing to both the processed and activation_state_changed events and waiting until both the processed and active conditions have been met.

## List Registered Model Event Callbacks​

A list of registered Model Event callbacks can be acquired through the **`modelEventWebhookCallbacks`** query search. Like other search operations, results are paginated and can be iterated though by specifying the returned offset value for the next page.

modelEventWebhookCallbacks
    
    
    query getModelEventCallbacks {  
    
    
      modelEventWebhookCallbacks {  
    
    
        nextOffset  
    
    
        totalResults  
    
    
        results {  
    
    
          id  
    
    
          eventTypes  
    
    
          callback {  
    
    
            scheme  
    
    
            port  
    
    
            path  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response:

(Note the ids, as these will be used in the mutation to make any changes to the registered callback.)
    
    
    {  
    
    
      "data": {  
    
    
        "modelEventWebhookCallbacks": {  
    
    
          "totalResults": 1,  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "887n9rwrdxytnttms0t1h02mc",  
    
    
              "eventTypes": ["inserted", "updated", "deleted"],  
    
    
              "callback": {  
    
    
                "scheme": "https",  
    
    
                "port": 80,  
    
    
                "path": "myawesomeapi.com"  
    
    
              }  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getModelEventCallbacks%20%7B%0A%20%20modelEventWebhookCallbacks%7B%0A%20%20%20%20nextOffset%0A%20%20%20%20totalResults%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20eventTypes%0A%20%20%20%20%20%20callback%20%7B%0A%20%20%20%20%20%20%20%20scheme%0A%20%20%20%20%20%20%20%20port%0A%20%20%20%20%20%20%20%20path%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&operationName=getModelEventCallbacks)

## Update a Model Event Callback​

Once the callback id is received, the **`patchModelEventWebhookCallback`** mutation can be used to make updates to an already-registered callback.

patchModelEventWebhookCallback
    
    
    mutation updateModelEventCallback($callbackId: ID!) {  
    
    
      patchModelEventWebhookCallback(  
    
    
        id: $callbackId  
    
    
        input: {  
    
    
          callback: {  
    
    
            scheme: "https"  
    
    
            host: "myawesomeapi.com"  
    
    
            path: "v2/my/api/path"  
    
    
            queryParams: [  
    
    
              { key: "key1", value: "value1" }  
    
    
              { key: "key2", value: "value2" }  
    
    
            ]  
    
    
            credType: basic  
    
    
            credKey: "username"  
    
    
            credSecret: "password"  
    
    
          }  
    
    
          version: 2  
    
    
        }  
    
    
      ) {  
    
    
        id  
    
    
        eventTypes  
    
    
        callback {  
    
    
          scheme  
    
    
          host  
    
    
          path  
    
    
        }  
    
    
      }  
    
    
    }  
    

Variables
    
    
    {  
    
    
      "callbackId": "XYZ"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "patchModelEventWebhookCallback": {  
    
    
          "id": "887n9rwrdxytnttms0t1h02mc",  
    
    
          "eventTypes": ["inserted", "updated", "deleted"],  
    
    
          "callback": {  
    
    
            "scheme": "https",  
    
    
            "host": "myawesomeapi.com",  
    
    
            "path": "v2/my/api/path"  
    
    
            ...  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20updateModelEventCallback\(%24callbackId%3A%20ID!\)%20%7B%0A%20%20patchModelEventWebhookCallback\(%0A%20%20%20%20id%3A%20%24callbackId%0A%20%20%20%20input%3A%20%7B%0A%20%20%20%20%20%20callback%3A%20%7B%0A%20%20%20%20%20%20%20%20scheme%3A%20%22https%22%0A%20%20%20%20%20%20%20%20host%3A%20%22myawesomeapi.com%22%0A%20%20%20%20%20%20%20%20path%3A%20%22v2%2Fmy%2Fapi%2Fpath%22%0A%20%20%20%20%20%20%20%20queryParams%3A%20%5B%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key1%22%2C%20value%3A%20%22value1%22%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7B%20key%3A%20%22key2%22%2C%20value%3A%20%22value2%22%20%7D%0A%20%20%20%20%20%20%20%20%5D%0A%20%20%20%20%20%20%20%20credType%3A%20basic%0A%20%20%20%20%20%20%20%20credKey%3A%20%22username%22%0A%20%20%20%20%20%20%20%20credSecret%3A%20%22password%22%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20version%3A%202%0A%20%20%20%20%7D%0A%20%20\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20eventTypes%0A%20%20%20%20callback%20%7B%0A%20%20%20%20%20%20scheme%0A%20%20%20%20%20%20host%0A%20%20%20%20%20%20path%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22callbackId%22%3A%20%22XYZ%22%0A%7D)

## Remove a Model Event Callback​

Model Event Callbacks can be removed using the **`removeModelEventWebhookCallback`** mutation.

removeModelEventWebhookCallback
    
    
    mutation removeModelEventCallback($callbackId: ID!) {  
    
    
      removeModelEventWebhookCallback(id: $callbackId)  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "removeModelEventWebhookCallback": true  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20testModelEvent\(%24callbackId%3A%20ID!\)%7B%0A%20%20pingModelEventWebhookCallback\(id%3A%20%24callbackId\)%0A%7D&variables=%7B%0A%20%20%22callbackId%22%3A%20%22%22%0A%7D&operationName=testModelEvent)

## Testing Model Event Callbacks​

Tests for specific Model Events can be triggered using the **`pingModelEventWebhookCallback`** mutation. The mutation can be used to ping and event that would trigger the registered callback. A collection of mutations and queries used for testing a Webhook endpoint can be found at this interactive editor link.

Ngrok is one useful tool for testing a Webhook integration locally.

pingModelEventWebhookCallback
    
    
    mutation testModelEvent($callbackId: ID!) {  
    
    
      pingModelEventWebhookCallback(id: $callbackId)  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20testModelEvent\(%24callbackId%3A%20ID!\)%7B%0A%20%20pingModelEventWebhookCallback\(id%3A%20%24callbackId\)%0A%7D&variables=%7B%0A%20%20%22callbackId%22%3A%20%22%22%0A%7D&operationName=testModelEvent)

## Model Event Callback FAQs​

Can I make GET callbacks instead of POST?

No, only POST request callbacks are supported. 

Can I make REST Callbacks instead of GraphQL?

Only GraphQL-based API callback registrations are available. 

What is the error message like if id is wrong for patchModelEventWebhookCallback

Error fetching data 

  * Getting Started
  * Registering a Model Event Callback
  * Versions
  * Event Types
  * Webhook Callback Payload
  * Webhook Body Object
  * Model Processed & Activation State Changed
  * List Registered Model Event Callbacks
  * Update a Model Event Callback
  * Remove a Model Event Callback
  * Testing Model Event Callbacks
  * Model Event Callback FAQs


