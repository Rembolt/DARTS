<!-- source: https://developers.matterport.com/api/model/views-layers/ -->

On this page

## Overview of Views​

With the Matterport Model API, you can query existing View IDs, add new Views, or delete existing Views for a space.

Up to 10 unique Views can be created in your digital twin for different groups or teams. Each View is shareable with its own tags, tours, and more. You can use this, for example, to promote various features to different clients or create multiple views of the same space for different training modules or teams.

note

You can use View IDs, where you usually use a model ID to query the data for the specific View ( see 'Query a View' example below). You can also use the View ID in a Showcase URL: <https://my.matterport.com/show/?m=w3mc532z2qgs2i20z0wz1y0wc>

[More Information on Views](https://support.matterport.com/s/article/Create-and-Share-Views)

[Views FAQ](https://support.matterport.com/s/article/FAQ-Views)

## Query Views​

Retrieve View IDs for a model.

Query View IDs

The following query returns the ID and a few other details for Views in a space. 
    
    
    query getViewIDs($modelId: ID!){  
    
    
      model(id: $modelId){  
    
    
        id  
    
    
        name  
    
    
        views{  
    
    
          id  
    
    
          name  
    
    
          type  
    
    
          modified  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId": "Dyc2vZg54be"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "id": "Dyc2vZg54be",  
    
    
          "name": "Demo Space",  
    
    
          "views": [  
    
    
            {  
    
    
              "id": "Dyc2vZg54be",  
    
    
              "name": "Main View",  
    
    
              "type": "matterport.model.layered",  
    
    
              "modified": "2023-11-16T18:13:14Z"  
    
    
            },  
    
    
            {  
    
    
              "id": "0ehmdabhd31ra7pyai5igb9sb",  
    
    
              "name": "Training View",  
    
    
              "type": "matterport.user.view",  
    
    
              "modified": "2023-11-16T17:38:05Z"  
    
    
            },  
    
    
            {  
    
    
              "id": "w3mc532z2qgs2i20z0wz1y0wc",  
    
    
              "name": "Data View",  
    
    
              "type": "matterport.user.view",  
    
    
              "modified": "2023-11-16T18:12:45Z"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getViewIDs\(%24modelId%3A%20ID!\)%7B%0A%20%20model\(id%3A%20%24modelId\)%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20views%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20modified%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getViewIDs&variables=%7B%0A%20%20%22modelId%22%3A%20%22Dyc2vZg54be%22%0A%7D)

Query a View

You can use a View ID where you would use a Model ID to query data about the View. 
    
    
    query getModelData($modelID: ID!){  
    
    
      model(id: $modelID){  
    
    
        id  
    
    
        created  
    
    
        modified  
    
    
        mattertags{  
    
    
          id  
    
    
          label  
    
    
          description  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelID": "w3mc532z2qgs2i20z0wz1y0wc"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "id": "w3mc532z2qgs2i20z0wz1y0wc",  
    
    
          "created": "2023-11-16T17:38:16Z",  
    
    
          "modified": "2023-11-16T18:55:35Z",  
    
    
          "mattertags": [  
    
    
            {  
    
    
              "id": "p3fUvV5RLEY",  
    
    
              "label": "Data Tag",  
    
    
              "description": "My Data here"  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getModelData\(%24modelID%3A%20ID!\)%7B%0A%20%20model\(id%3A%20%24modelID\)%7B%0A%20%20%20%20id%0A%20%20%20%20created%0A%20%20%20%20modified%0A%20%20%20%20mattertags%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20description%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&operationName=getModelData&variables=%7B%0A%20%20%22modelID%22%3A%20%22w3mc532z2qgs2i20z0wz1y0wc%22%0A%7D)

## Add or Delete Views​

Add a View to a model
    
    
    mutation addView($modelId: ID!, $name: String,){  
    
    
      addView(  
    
    
        id: $modelId,  
    
    
        name: $name,  
    
    
        enabled: true,  
    
    
        generateIds: false  
    
    
      ){  
    
    
        id  
    
    
        name  
    
    
        type  
    
    
        model{  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
        modified  
    
    
      }  
    
    
    }  
    
    
    # variables  
    
    
    {  
    
    
      "modelId": "Dyc2vZg54be",  
    
    
      "name": "my new view"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "addView": {  
    
    
          "id": "dwexd66y2xsfxuxqbrzkb73fc",  
    
    
          "name": "my new view",  
    
    
          "type": "matterport.user.view",  
    
    
          "model": {  
    
    
            "id": "dwexd66y2xsfxuxqbrzkb73fc",  
    
    
            "name": "Demo Space"  
    
    
          },  
    
    
          "modified": "2023-11-16T22:14:59Z"  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20addView\(%24modelId%3A%20ID!%2C%20%24name%3A%20String%2C\)%7B%0A%20%20addView\(%0A%20%20%20%20id%3A%20%24modelId%2C%0A%20%20%20%20name%3A%20%24name%2C%0A%20%20%20%20enabled%3A%20true%2C%0A%20%20%20%20generateIds%3A%20false%0A%20%20\)%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20type%0A%20%20%20%20model%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%20%20modified%0A%20%20%7D%0A%7D&operationName=addView&variables=%7B%0A%20%20%22modelId%22%3A%20%22Dyc2vZg54be%22%2C%0A%20%20%22name%22%3A%20%22my%20new%20view%22%0A%7D)

Delete a View in a model
    
    
    mutation deleteView($modelId: ID!, $viewId: ID!){  
    
    
      deleteView(id: $modelId, viewId: $viewId)  
    
    
    }  
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : "Dyc2vZg54be",  
    
    
      "viewId": "dwexd66y2xsfxuxqbrzkb73fc"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "deleteView": true  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20deleteView\(%24modelId%3A%20ID!%2C%20%24viewId%3A%20ID!\)%7B%0A%20%20deleteView\(id%3A%20%24modelId%2C%20viewId%3A%20%24viewId\)%0A%7D&operationName=deleteView&variables=%7B%0A%20%20%22modelId%22%20%3A%20%22Dyc2vZg54be%22%2C%0A%20%20%22viewId%22%3A%20%22dwexd66y2xsfxuxqbrzkb73fc%22%0A%7D)

## Overview of Layers​

Layers let visitors to your model show or hide groupings of Tags, Labels, Notes, and Measurements. Layers are conceptually similar to Views in that they're collections of edits that you group together. Layers provide a different level of organization. If you use Views, Layers are nestled under Views. Visitors can select checkboxes to see all, some, or none of the Layers in your View.

[Working with Layers](https://support.matterport.com/s/article/Working-with-Layers)

Model API currently exposes read-only access to layers.

Get the Layer Ids for all Layers within a View
    
    
    query getLayers ($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
        views {  
    
    
          id  
    
    
          name  
    
    
          layers {  
    
    
            visible  
    
    
            position  
    
    
            layer {  
    
    
              id  
    
    
              created  
    
    
              modified  
    
    
              type  
    
    
              name  
    
    
              label  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    Variables:  
    
    
    {  
    
    
      "modelId": ""  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "views": [  
    
    
            {  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "e2xixbktq4sz5nx0smxb3aggb",  
    
    
                    "created": "2023-04-12T18:22:38Z",  
    
    
                    "modified": "2024-03-28T20:33:00Z",  
    
    
                    "type": "matterport.user.data",  
    
    
                    "name": "matterport.user.data",  
    
    
                    "label": ""  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "created": "2023-04-12T18:22:29Z",  
    
    
                    "modified": "2024-04-26T06:30:43Z",  
    
    
                    "type": "matterport.base",  
    
    
                    "name": null,  
    
    
                    "label": ""  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "7r2z6i5xqxqfsnzft3y7ita8b",  
    
    
                    "created": "2023-11-16T17:38:16Z",  
    
    
                    "modified": "2023-11-16T18:08:35Z",  
    
    
                    "type": "matterport.user.data",  
    
    
                    "name": "matterport.user.data",  
    
    
                    "label": ""  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "created": "2023-04-12T18:22:29Z",  
    
    
                    "modified": "2024-04-26T06:30:43Z",  
    
    
                    "type": "matterport.base",  
    
    
                    "name": null,  
    
    
                    "label": ""  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "yz7944d0p6h6yuuantfb9bm4c",  
    
    
                    "created": "2023-04-12T18:23:34Z",  
    
    
                    "modified": "2023-04-12T18:23:34Z",  
    
    
                    "type": "layer for share of Dyc2vZg54be with rpHADXCwqUJ",  
    
    
                    "name": "layer for share of Dyc2vZg54be with rpHADXCwqUJ",  
    
    
                    "label": ""  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "created": "2023-04-12T18:22:29Z",  
    
    
                    "modified": "2024-04-26T06:30:43Z",  
    
    
                    "type": "matterport.base",  
    
    
                    "name": null,  
    
    
                    "label": ""  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "hndpyimdgq1660b15cwdqkkka",  
    
    
                    "created": "2023-04-12T18:22:38Z",  
    
    
                    "modified": "2023-04-12T18:22:40Z",  
    
    
                    "type": "matterport.workshop.jsonstore",  
    
    
                    "name": "Dyc2vZg54be-workshopSession",  
    
    
                    "label": ""  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "created": "2023-04-12T18:22:29Z",  
    
    
                    "modified": "2024-04-26T06:30:43Z",  
    
    
                    "type": "matterport.base",  
    
    
                    "name": null,  
    
    
                    "label": ""  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getLayers%20\(%24modelId%3A%20ID!\)%20%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20%20%20views%20%7B%0A%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20layers%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20visible%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20position%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20created%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20modified%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20type%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getLayers)

Get the Layer Ids for Tags in a Model
    
    
    query getLayerIdsTags ($modelId: ID!) {  
    
    
        model(id: $modelId) {  
    
    
            mattertags {  
    
    
              id  
    
    
              label  
    
    
              position { x y z }  
    
    
              layer {  
    
    
                id  
    
    
              }  
    
    
            }  
    
    
        }  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "mattertags": [  
    
    
            {  
    
    
              "id": "tkapp8ynre7di9pxrzkcpwqfa",  
    
    
              "label": "#5934",  
    
    
              "position": {  
    
    
                "x": 14.6403179,  
    
    
                "y": 3.64611578,  
    
    
                "z": 0.0411518849  
    
    
              },  
    
    
              "layer": {  
    
    
                "id": "i2n7c0hyaa79qy9e3kmqf98nb"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "xX2b3bbXpiZ",  
    
    
              "label": "Outlet",  
    
    
              "position": {  
    
    
                "x": 19.01938523121578,  
    
    
                "y": 6.008554801105214,  
    
    
                "z": -0.014836621739357106  
    
    
              },  
    
    
              "layer": {  
    
    
                "id": "i2n7c0hyaa79qy9e3kmqf98nb"  
    
    
              }  
    
    
            }  
    
    
          ],  
    
    
          "labels": []  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getLayerIdsTags%20\(%24modelId%3A%20ID!\)%20%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20%20%20mattertags%20%7B%0A%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20%20%20position%20%7B%20x%20y%20z%20%7D%0A%20%20%20%20%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getLayerIdsTags)

Get Layer Ids for all layered content
    
    
    query {  
    
    
      model(id: "URMUMZPAcWc") {  
    
    
        views {  
    
    
          layers {  
    
    
            visible  
    
    
            position  
    
    
            layer {  
    
    
              id  
    
    
              label  
    
    
              type  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
        highlightReels {  
    
    
          id  
    
    
          label  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        labels {  
    
    
          id  
    
    
          label  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        mattertags {  
    
    
          id  
    
    
          label  
    
    
          position { x y z }  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        measurementPaths {  
    
    
          id  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        notes {  
    
    
          id  
    
    
          label  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        objectAnnotations {  
    
    
          id  
    
    
          label  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        rooms {  
    
    
          id  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
        floors {  
    
    
          id  
    
    
          layer {  
    
    
            id  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "views": [  
    
    
            {  
    
    
              "id": "g0mzrzwyrfuawpwnb2up8bqpc",  
    
    
              "name": "View #1",  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "a1d03uki1tkfppqg3cu0yny7c",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.user.data"  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.base"  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "id": "dsaqsaC3vWZ",  
    
    
              "name": "View #2",  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "t5cn9uk0xuxytkmdt0iu8s3zc",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.user.data"  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.base"  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "id": "4t7hycm8mzm4b1b9s3rbqxk0b",  
    
    
              "name": "View #3",  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "4t7hycm8mzm4b1b9s3rbqxk0a",  
    
    
                    "label": "",  
    
    
                    "type": "layer for share of dsaqsaC3vWZ with rpHADXCwqUJ"  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.base"  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            },  
    
    
            {  
    
    
              "id": "1xstwqhptxc7i4st435ehy88c",  
    
    
              "name": "workshop-session",  
    
    
              "layers": [  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 0,  
    
    
                  "layer": {  
    
    
                    "id": "1xstwqhptxc7i4st435ehy88b",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.workshop.jsonstore"  
    
    
                  }  
    
    
                },  
    
    
                {  
    
    
                  "visible": true,  
    
    
                  "position": 1,  
    
    
                  "layer": {  
    
    
                    "id": "aaaaaaaaaaaaaaaaaaaaaaaaa",  
    
    
                    "label": "",  
    
    
                    "type": "matterport.base"  
    
    
                  }  
    
    
                }  
    
    
              ]  
    
    
            }  
    
    
          ],  
    
    
          "highlightReels": [],  
    
    
          "labels": [],  
    
    
          "mattertags": [  
    
    
            {  
    
    
              "id": "TM8fdfhCBAy",  
    
    
              "label": "",  
    
    
              "position": {  
    
    
                "x": -31.168125549028687,  
    
    
                "y": 27.292967855364722,  
    
    
                "z": -1.3037493252927745  
    
    
              },  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            }  
    
    
          ],  
    
    
          "measurementPaths": [],  
    
    
          "notes": [],  
    
    
          "objectAnnotations": [],  
    
    
          "rooms": [  
    
    
            {  
    
    
              "id": "h26t7ky77ew74yb0pg8qqf5rd",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "tt6gm2a0463x9wmnx7rn6gugc",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "3m54yff1z7crxaywd8if9rb0d",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "a5f9age4zzxewres6iqux2emc",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "cdz3fkt38kae7tapstpt0eaeb",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "xy2x8mpaaqknp7q2c3nnbw1ma",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "2qdmc5i9byxi79ry1pxdkqzea",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "19ab05tns5h6y4qm42esqqpea",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            },  
    
    
            {  
    
    
              "id": "613htqkzf66zz7hf7n8kzszed",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            }  
    
    
          ],  
    
    
          "floors": [  
    
    
            {  
    
    
              "id": "tsmq1wak12rhgn0mawksxcwcd",  
    
    
              "layer": {  
    
    
                "id": "aaaaaaaaaaaaaaaaaaaaaaaaa"  
    
    
              }  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

**Please note, objectAnnotations is only available for Beta Testers at this time**

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getLayeredContent\(%24modelId%3AID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20views%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20layers%20%7B%0A%20%20%20%20%20%20%20%20visible%0A%20%20%20%20%20%20%20%20position%0A%20%20%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20%20%20type%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20highlightReels%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20labels%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20mattertags%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20position%20%7B%20x%20y%20z%20%7D%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20measurementPaths%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20notes%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20objectAnnotations%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20rooms%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20floors%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20layer%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getLayeredContent)

  * Overview of Views
  * Query Views
  * Add or Delete Views
  * Overview of Layers


