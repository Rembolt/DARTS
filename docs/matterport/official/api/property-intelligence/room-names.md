<!-- source: https://developers.matterport.com/api/property-intelligence/room-names/ -->

On this page

note

Property Intelligence Data in Model API is only available for Enterprise-level Matterport Subscriptions

## Property Intelligence Room Names​

Property Intelligence automatically detects the types of rooms within a model based on a set of definitions.

**Name**| **description**| `Room Name`| Automatically generated names from Property Intelligence| `label`| Manually entered room names from the Model Editor/Owner| `confidence`| The confidence score that Matterport has for the accuracy of the detected room's name| `Room Floor`| The floor that this room is located on  
---|---  
  
### Property Intelligence Room Definitions​

These definitions represent the current list of rooms that are detected:

  * Balcony
  * Basement
  * Bathroom
  * Bedroom
  * Closet
  * Dining Room
  * Entrance
  * Exercise Room
  * Family Room
  * Game Room
  * Garage
  * Hallway
  * Kitchen
  * Living Room
  * Loft
  * Office
  * Pantry
  * Patio
  * Staircase
  * Utility Room
  * Other



A user with editing access to the model can override these names and assign their own **label**. Examples may include relabelling a bedroom as a "Primary Bedroom" or defining "Other" as a "Fitness Room" or "Theater Room".

User submitted room names queried as the **label** field on the room object, while the detected room will always be available on the **classifications** object.

### Multiple Room Types​

If the room has multiple room types which are detected, these rooms will have multiple room type annotations. This is common for open-concept areas that contain multifunctional areas. As an example, some open-concept areas may serve as kitchens, living rooms, and dining rooms simultaneously.

The following are valid room type combinations that may be detected:

  * Kitchen, Living Room, Dining Room
  * Kitchen, Dining Room
  * Bathroom, Laundry Room
  * Kitchen, Living Room
  * Living Room, Dining Room



## Sample Queries​
    
    
    query getRoomNames($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
        rooms {  
    
    
          id  
    
    
          label  
    
    
          floor {  
    
    
            id  
    
    
          }  
    
    
          classifications {  
    
    
            id  
    
    
            label  
    
    
            defaultKeywords  
    
    
            confidence  
    
    
          }  
    
    
          keywords  
    
    
        }  
    
    
      }  
    
    
    }  
    

Passing in variable arguments:
    
    
    {  
    
    
      "modelId": "ID-of-the-model-to-query",  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "rooms": [  
    
    
                    {  
    
    
                        "id": "gqxp3yld2eh",  
    
    
                        "label": "Butler's Pantry",  
    
    
                        "floor": {  
    
    
                            "id": "pd0i1c4yq9w0y2zsb07ed23sb"  
    
    
                        },  
    
    
                        "classifications": [  
    
    
                            {  
    
    
                                "id": "byp7pz2tmt4ff47nhfx0uwzec",  
    
    
                                "label": "Other",  
    
    
                                "defaultKeywords": [  
    
    
                                    "indoor"  
    
    
                                ],  
    
    
                                "confidence": 1.0  
    
    
                            }  
    
    
                        ],  
    
    
                        "keywords": [  
    
    
                            "indoor"  
    
    
                        ]  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "x8zqpa4lyuh",  
    
    
                        "label": "",  
    
    
                        "floor": {  
    
    
                            "id": "tsmq1wak12rhgn0mawksxcwcd"  
    
    
                        },  
    
    
                        "classifications": [  
    
    
                            {  
    
    
                                "id": "rmu8pikcye0n7n9fsu5e4acda",  
    
    
                                "label": "Entrance",  
    
    
                                "defaultKeywords": [  
    
    
                                    "indoor"  
    
    
                                ],  
    
    
                                "confidence": 1.0  
    
    
                            }  
    
    
                        ],  
    
    
                        "keywords": [  
    
    
                            "indoor"  
    
    
                        ]  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "8r70ueyh9er",  
    
    
                        "label": "",  
    
    
                        "floor": {  
    
    
                            "id": "pd0i1c4yq9w0y2zsb07ed23sb"  
    
    
                        },  
    
    
                        "classifications": [  
    
    
                            {  
    
    
                                "id": "ua1m0u8pm3yngrhzwec1ue5zc",  
    
    
                                "label": "Bathroom",  
    
    
                                "defaultKeywords": [  
    
    
                                    "indoor"  
    
    
                                ],  
    
    
                                "confidence": 1.0  
    
    
                            }  
    
    
                        ],  
    
    
                        "keywords": [  
    
    
                            "indoor"  
    
    
                        ]  
    
    
                    },  
    
    
                    ...  
    
    
                ]  
    
    
            }  
    
    
        }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getRoomNames\(%24modelId%3A%20ID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20rooms%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20floor%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20classifications%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20defaultKeywords%0A%20%20%20%20%20%20%20%20confidence%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20keywords%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getRoomNames)

  * Property Intelligence Room Names
    * Property Intelligence Room Definitions
    * Multiple Room Types
  * Sample Queries


