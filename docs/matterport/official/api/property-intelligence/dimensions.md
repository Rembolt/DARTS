<!-- source: https://developers.matterport.com/api/property-intelligence/dimensions/ -->

On this page

note

Property Intelligence Data in Model API is only available for Enterprise-level Matterport Subscriptions

## Dimension Estimates​

**Field**| **description**| **model**| **floor**| **room**| `area`| Estimated area based on measured room(s) BoundedRegion data| x| x| x| `areaIndoor`| Estimated area not counting outdoor space or portions covered by walls| x| x| x| `depth`| Estimated depth of room| | | x| `depthData`| Metadata pertaining to the depth measurement| | | x| `height`| Estimated height of the room| | | x| `width`| Estimated width of the room| | | x| `widthData`| Metadata pertaining to the width measurement| | | x| `units`| metric or imperial| x| x| x| `lowerElevation`| A room's BoundedRegion's distance from the ground plane (z = 0)| | | x  
---|---|---|---|---  
  
### Measurements​

**Name**| **description**| `Length`| The longest measurement reported for a given room| `Depth`| The shortest measurement reported for a given room| `Area`| The total area of a room, floor, or model. For floors and models, this is a sum of the contained room areas.| `IndoorArea`| The total indoor **scanned** area. This will be set to zero if the room is identified as outdoor. For most models this will be the same value as Area at this time.  
---|---  
  
### Query the Area and Indoor Area for a Model​

A user wanting to know dimensional data about their entire space can query this from the **model** 's' **dimensionEstimates** object.

Units returned can be either _metric_ or _imperial_ based on the model or account's default settings. By providing an optional **units** parameter, a developer can receive results in either measurement standard.

Sample Query:
    
    
    query getArea($modelId: ID!, $units: Units) {  
    
    
      model(id: $modelId) {  
    
    
        dimensionEstimates(units: $units) {  
    
    
          area  
    
    
          areaIndoor  
    
    
          units  
    
    
        }  
    
    
      }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": "your-model-id",  
    
    
      "units": "metric"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "dimensionEstimates": {  
    
    
            "area": 2545.456973221831,  
    
    
            "areaIndoor": 2129.756609921589,  
    
    
            "units": "imperial"  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getArea\(%24modelId%3A%20ID!%2C%20%24units%3A%20Units\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20dimensionEstimates\(units%3A%20%24units\)%20%7B%0A%20%20%20%20%20%20area%0A%20%20%20%20%20%20areaIndoor%0A%20%20%20%20%20%20units%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%2C%0A%20%20%22units%22%3A%20%22imperial%22%0A%7D&operationName=getArea)

### Query the Dimension Estimates for Rooms and Floors​

The **dimensionEstimates** object also exists on the **rooms** and **floors** objects and includes additional fields for **rooms**.

Sample Query:
    
    
      
    
    
    query getRoomFloorDimensions($modelId: ID!, $units: Units) {  
    
    
      model(id: $modelId) {  
    
    
        rooms {  
    
    
          id  
    
    
          label  
    
    
          floor {  
    
    
            id  
    
    
          }  
    
    
          dimensionEstimates(units: $units) {  
    
    
            area  
    
    
            areaIndoor  
    
    
            depth  
    
    
            depthData {  
    
    
              # The points that this depthData was measured from  
    
    
              points {  
    
    
                x  
    
    
                y  
    
    
              }  
    
    
            }  
    
    
            height  
    
    
            width  
    
    
            widthData {  
    
    
                # The points that this widthData was measured from  
    
    
                points {  
    
    
                  x  
    
    
                  y  
    
    
                }  
    
    
            }  
    
    
            units  
    
    
            lowerElevation  
    
    
          }  
    
    
        }  
    
    
        floors {  
    
    
          id  
    
    
          label  
    
    
          sequence  
    
    
          dimensionEstimates(units: $units) {  
    
    
            area  
    
    
            areaIndoor  
    
    
            units  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "rooms": [  
    
    
                    {  
    
    
                        "id": "gqxp3yld2eh",  
    
    
                        "label": "",  
    
    
                        "floor": {  
    
    
                            "id": "pd0i1c4yq9w0y2zsb07ed23sb"  
    
    
                        },  
    
    
                        "dimensionEstimates": {  
    
    
                            "area": 228.36937521825212,  
    
    
                            "areaIndoor": 228.36937521825212,  
    
    
                            "depth": 0.0,  
    
    
                            "depthData": {  
    
    
                                "points": []  
    
    
                            },  
    
    
                            "height": 9.055118400000001,  
    
    
                            "width": 0.0,  
    
    
                            "widthData": {  
    
    
                                "points": []  
    
    
                            },  
    
    
                            "units": "imperial",  
    
    
                            "lowerElevation": null  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "x8zqpa4lyuh",  
    
    
                        "label": "",  
    
    
                        "floor": {  
    
    
                            "id": "tsmq1wak12rhgn0mawksxcwcd"  
    
    
                        },  
    
    
                        "dimensionEstimates": {  
    
    
                            "area": 72.83019428676131,  
    
    
                            "areaIndoor": 72.83019428676131,  
    
    
                            "depth": 9.088261308636113,  
    
    
                            "depthData": {  
    
    
                                "points": []  
    
    
                            },  
    
    
                            "height": 10.0393704,  
    
    
                            "width": 8.076408171135771,  
    
    
                            "widthData": {  
    
    
                                "points": []  
    
    
                            },  
    
    
                            "units": "imperial",  
    
    
                            "lowerElevation": null  
    
    
                        }  
    
    
                    },  
    
    
                    ...  
    
    
                ],  
    
    
                "floors": [  
    
    
                    {  
    
    
                        "id": "tsmq1wak12rhgn0mawksxcwcd",  
    
    
                        "label": "Floor 1",  
    
    
                        "sequence": 0,  
    
    
                        "dimensionEstimates": {  
    
    
                            "area": 1343.2818079401443,  
    
    
                            "areaIndoor": 1343.2818079401443,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "pd0i1c4yq9w0y2zsb07ed23sb",  
    
    
                        "label": "Floor 2",  
    
    
                        "sequence": 1,  
    
    
                        "dimensionEstimates": {  
    
    
                            "area": 1584.1840743270077,  
    
    
                            "areaIndoor": 1584.1840743270077,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    }  
    
    
                ]  
    
    
            }  
    
    
        }  
    
    
    }  
    
    
      
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getRoomFloorDimensions\(%24modelId%3A%20ID!%2C%20%24units%3A%20Units\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20rooms%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20floor%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20dimensionEstimates\(units%3A%20%24units\)%20%7B%0A%20%20%20%20%20%20%20%20area%0A%20%20%20%20%20%20%20%20areaIndoor%0A%20%20%20%20%20%20%20%20depth%0A%20%20%20%20%20%20%20%20depthData%20%7B%0A%20%20%20%20%20%20%20%20%20%20%23%20The%20points%20that%20this%20depthData%20was%20measured%20from%0A%20%20%20%20%20%20%20%20%20%20points%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20x%0A%20%20%20%20%20%20%20%20%20%20%20%20y%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20height%0A%20%20%20%20%20%20%20%20width%0A%20%20%20%20%20%20%20%20widthData%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%23%20The%20points%20that%20this%20widthData%20was%20measured%20from%0A%20%20%20%20%20%20%20%20%20%20%20%20points%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20x%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20y%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20units%0A%20%20%20%20%20%20%20%20lowerElevation%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20floors%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20sequence%0A%20%20%20%20%20%20dimensionEstimates\(units%3A%20%24units\)%20%7B%0A%20%20%20%20%20%20%20%20area%0A%20%20%20%20%20%20%20%20areaIndoor%0A%20%20%20%20%20%20%20%20units%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%2C%0A%20%20%22units%22%3A%20%22imperial%22%0A%7D&operationName=getRoomFloorDimensions)

In the above response, you will note that there are two floors - one for interior space, one for exterior space. The exterior space does not return a full set of dimensional data.

Floors contain a label as well as a numeric sequence from the spatially lowest floor beginning at 0 and an id.

Floor IDs generally tend to be consistent between models the first floor is usually _tsmq1wak12rhgn0mawksxcwcd_ , and the second floor is usually _pd0i1c4yq9w0y2zsb07ed23sb_. This may not be true as gaps can exist between detected floors. Therefore, it is important to validate the floor IDs for each model.

All rooms are associated with floors and the areas provided for floors represent a summation of the areas of their respective rooms.

### Why do I see null or zero values in the dimensions tables?​

Rooms with irregular shapes or non-flat ceilings may not produce automatic dimensions. These rooms, when refined in the editor may then produce usable values.

  * Dimension Estimates
    * Measurements
    * Query the Area and Indoor Area for a Model
    * Query the Dimension Estimates for Rooms and Floors
    * Why do I see null or zero values in the dimensions tables?


