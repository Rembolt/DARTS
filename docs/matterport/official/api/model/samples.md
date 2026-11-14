<!-- source: https://developers.matterport.com/api/model/samples/ -->

On this page

This is a library of ready-to-use sample GraphQL queries and mutations for Matterport's Model API.

Each query and mutation contains a link to try the query in our interactive console. If you are logged into your account at my.matterport.com, you will be able to use the interactive console. If you have a Developer Tools license, the Interactive Console will be able to query all models in your account. If you are in Sandbox mode, it will only be able to query the demo model in your account.

With all queries, be sure to edit the variables, when provided, and insert a valid Model ID and valid data for all variables.

If you would like an application to build collections of API queries for testing and generating code to use in your applications, we recommend using Postman and have these snippets available in [a sample collection](/api/model/postman/).

### Helpful Resources​

  * [Matterport Model API Schema](https://api.matterport.com/model/docs/reference)
  * [GraphQL Queries & Mutations Guide](https://graphql.org/learn/queries/)
  * [Matterport Developer Support](mailto:)



### Testing in Sandbox Mode​

API Users in Sandbox mode can test these queries on a demo model in their account. The models() query will only return your demo model. Purchasing a developer license will change this behavior to show the models in your account. You can still find the SID of the demo model in production mode using the provided 'Search for demo models in your account' query found below.

## Models Queries​

models() queries get data from our models search engine. Searchable data can be found here.

Search for your models
    
    
    query {  
    
    
      models(query: "*") {  
    
    
        totalResults  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
          description  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "models": {  
    
    
          "totalResults": 1,  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "MODEL_ID",  
    
    
              "name": "352 E Java Dr",  
    
    
              "description": ""  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20%7B%0Amodels\(query%3A%20%22*%22\)%20%7B%0A%20%20%20%20totalResults%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20description%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A)

Search for demo models in your account

All accounts come with a demo model. This can be queried in sandbox mode for testing purposes. If you wish to find the demo models with a models query, use "demo: true" as your query. You can also include 'demo' in your results to verify that this is a demo model.
    
    
    query {  
    
    
      models(query: "demo:true", include: demo) {  
    
    
        results {  
    
    
          name  
    
    
          demo  
    
    
          id  
    
    
        }  
    
    
        nextOffset  
    
    
        totalResults  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "models": {  
    
    
          "results": [  
    
    
            {  
    
    
              "name": "Get Started",  
    
    
              "demo": true,  
    
    
              "id": "xiyHP9VkT1U"  
    
    
            },  
    
    
            {  
    
    
              "name": "Get Started",  
    
    
              "demo": true,  
    
    
              "id": "YGYWqVqWDpm"  
    
    
            }  
    
    
          ],  
    
    
          "totalResults": 2  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22demo%3Atrue%22%2C%0A%20%20%20%20include%3A%20demo%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20demo%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D)

Search for archived models
    
    
    query archivedModels {  
    
    
      models(query: "state:inactive", include: inactive) {  
    
    
        results {  
    
    
          name  
    
    
          state  
    
    
          id  
    
    
        }  
    
    
        nextOffset  
    
    
        totalResults  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20archivedModels%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22state%3Ainactive%22%2C%0A%20%20%20%20include%3A%20inactive%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20state%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D&operationName=archivedModels)

Search for Models with x # of Floors
    
    
    query {  
    
    
      models(query: "floors.count: 20") {  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
        nextOffset  
    
    
        totalResults  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20modelSearch%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22floors.count%3A%2020%22%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20demo%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D&operationName=modelSearch)

## Model Queries​

model() queries get data from individual models.

Get Model Details

Use Model API to query the information that a user has entered on the 'Model Details' tab in Matterport Cloud and information on when a model was created and last updated. ```graphql query getModelDetails($modelId: ID!){ model(id:$modelId) { id name state visibility created modified description publication { description summary address contact { name email phoneNumber } externalUrl presentedBy published url(branding: default) } } } 

# variables

{ "modelId" : "" }
    
    
      
    
    
      Important Note - `model { description }` is the Internal Notes field, whereas <code>model { publication { description } }</code> is the public model description.  
    
    
      
    
    
      Sample Response:  
    
    
      
    
    
    ```json  
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "id": "JGPnGQ6hosj",  
    
    
                "name": "Southern California Luxury Home",  
    
    
                "state": "active",  
    
    
                "visibility": "public",  
    
    
                "created": "2017-09-26T21:52:07Z",  
    
    
                "modified": "2025-08-14T04:31:32Z",  
    
    
                "description": "",  
    
    
                "publication": {  
    
    
                    "description": "",  
    
    
                    "summary": "This majestic looking home has wood flooring, crown molding, is a great family home. This tour was shot with the Matterport Pro2 3D camera.",  
    
    
                    "address": null,  
    
    
                    "contact": {  
    
    
                        "name": "Acme Realty",  
    
    
                        "email": "name@example.com",  
    
    
                        "phoneNumber": "+15551234567"  
    
    
                    },  
    
    
                    "externalUrl": "http://www.acemerealty.com",  
    
    
                    "presentedBy": "Acme Realty",  
    
    
                    "published": true,  
    
    
                    "url": "https://my.matterport.com/show/?m=JGPnGQ6hosj"  
    
    
                }  
    
    
            }  
    
    
        }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getModelDetails\(%24modelId%3A%20ID!\)%7B%0A%09model\(id%3A%24modelId\)%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20state%0A%20%20%20%20%20%20%20%20visibility%0A%20%20%20%20%20%20%20%20created%0A%20%20%20%20%20%20%20%20modified%0A%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20publication%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20%20%20%20%20summary%0A%20%20%20%20%20%20%20%20%20%20%20%20address%0A%20%20%20%20%20%20%20%20%20%20%20%20contact%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20phoneNumber%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20externalUrl%0A%20%20%20%20%20%20%20%20%20%20%20%20presentedBy%0A%20%20%20%20%20%20%20%20%20%20%20%20published%0A%20%20%20%20%20%20%20%20%20%20%20%20url\(branding%3A%20default\)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%20%20%20%20&operationName=getModelDetails&variables=%7B%0A%20%20%20%20%22modelId%22%20%3A%20%22%22%0A%7D)

Get all Sweep Locations and Panoramic Images

Panoramic images are currently only available as **skyboxes**.

A skybox is made out of six images - each image individually projected onto the shape of a cube - that is: top, bottom, left, right, front and back sides. Skyboxes are available in 512x512 (resolution: low), 1024x1024 (resolution: high) and 2048 x 2048 (resolution: 2k) resolutions and come bundled with position and rotation data. 4096 x 4096 skyboxes are available for business and Enterprise customers who have purchased the 'Advanced Imagery Bundle' add-on.
    
    
    fragment panoFragment on PanoramicImageLocation{  
    
    
      id  
    
    
      skybox(resolution: "2k") {  
    
    
        id  
    
    
        status  
    
    
        format  
    
    
        children  
    
    
      }  
    
    
    }  
    
    
      
    
    
    query getSweeps($modelId: ID!){  
    
    
      model(id: $modelId) {  
    
    
        locations {  
    
    
          id  
    
    
          model { id }  
    
    
          position { x, y, z }  
    
    
          floor { id }  
    
    
          room { id }  
    
    
          panos { ...panoFragment }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "locations": [{  
    
    
              "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
              "model": {  
    
    
                "id": "MODEL_ID"  
    
    
              },  
    
    
              "position": {  
    
    
                "x": 0,  
    
    
                "y": 0,  
    
    
                "z": 0  
    
    
              },  
    
    
              "panos": [{  
    
    
                "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
                "skybox": {  
    
    
                  "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
                  "status": "available",  
    
    
                  "format": "skybox",  
    
    
                  "children": [  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox0.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox1.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox2.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox3.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox4.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox5.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1"  
    
    
                  ]  
    
    
                }  
    
    
              }]  
    
    
            }, ...  
    
    
          }]  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=fragment%20panoFragment%20on%20PanoramicImageLocation%7B%0A%20%20id%0A%20%20skybox%20%7B%0A%20%20%20%20id%0A%20%20%20%20status%0A%20%20%20%20format%0A%20%20%20%20children%0A%20%20%7D%0A%7D%0A%0Aquery%20getSweeps\(%24modelId%3A%20ID!\)%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20locations%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20model%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20room%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20panos%20%7B%20...panoFragment%20%7D%20%20%20%20%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getSweeps)

Get all Defurnished Panoramic Images

Spaces that contain a defurnished view have a secondary set of panoramic images that are associated with the Defurnished View. A complete model object is available under each view. The following sample query filters the available views and returns direct links to the defurnished panoramic imagery.
    
    
    fragment panoFragment on PanoramicImageLocation{  
    
    
      id  
    
    
      skybox {  
    
    
        id  
    
    
        status  
    
    
        format  
    
    
        children  
    
    
      }  
    
    
    }  
    
    
      
    
    
    query getSweeps($modelId: ID!){  
    
    
        model(id: $modelId) {  
    
    
        views(types:["matterport.model.defurnished"]) {  
    
    
          model {  
    
    
    	      locations {  
    
    
      	      id  
    
    
        	    label  
    
    
            	position { x, y, z }  
    
    
            	floor { id }  
    
    
            	room { id }  
    
    
            	panos { ...panoFragment }      
    
    
        		}  
    
    
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
    
    
              "model": {  
    
    
                "locations": [  
    
    
                  {  
    
    
                    "id": "caa1k8nhdi4hmtbpidzgnpx6a",  
    
    
                    "label": "7",  
    
    
                    "position": {  
    
    
                      "x": 8.10565185546875,  
    
    
                      "y": 1.020589828491211,  
    
    
                      "z": -1.7120000123977661  
    
    
                    },  
    
    
                    "floor": {  
    
    
                      "id": "tsmq1wak12rhgn0mawksxcwcd"  
    
    
                    },  
    
    
                    "room": {  
    
    
                      "id": "xy2x8mpaaqknp7q2c3nnbw1ma"  
    
    
                    },  
    
    
                    "panos": [  
    
    
                      {  
    
    
                        "id": "399fqhapcqmnc8gk6qfba5ktb",  
    
    
                        "skybox": {  
    
    
                          "id": "399fqhapcqmnc8gk6qfba5ktb",  
    
    
                          "status": "available",  
    
    
                          "format": "skybox",  
    
    
                          "children": [  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox0.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox1.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox2.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox3.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox4.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox5.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow"  
    
    
                          ]  
    
    
                        }  
    
    
                      }  
    
    
                      ...  
    
    
                    ]  
    
    
                  }  
    
    
                ]  
    
    
              }  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=fragment%20panoFragment%20on%20PanoramicImageLocation%7B%0A%20%20id%0A%20%20skybox%20%7B%0A%20%20%20%20id%0A%20%20%20%20status%0A%20%20%20%20format%0A%20%20%20%20children%0A%20%20%7D%0A%7D%0A%0Aquery%20getSweeps\(%24modelId%3A%20ID!\)%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20locations%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20model%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20room%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20panos%20%7B%20...panoFragment%20%7D%20%20%20%20%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getSweeps)

Get all Tags and Tag Data

Users can get all Tags from a model. Presently, attachments are not queryable.

Tags were previous called 'mattertags' and Model API continues to use this naming convention.
    
    
    query getTags($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
        mattertags(includeDisabled: true) {  
    
    
          id  
    
    
          floor { id }  
    
    
          created  
    
    
          modified  
    
    
          enabled  
    
    
          color  
    
    
          label  
    
    
          description  
    
    
          icon  # New!  
    
    
          keywords  
    
    
          media  
    
    
          mediaType  
    
    
          position { x, y, z }  
    
    
          anchorPosition { x, y, z }  
    
    
          discPosition { x, y, z }  
    
    
          stemNormal { x, y, z }  
    
    
          stemLength  
    
    
          stemEnabled  
    
    
          stemDirection { x, y, z } # Deprecated, use stemNormal and stemLength  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "mattertags": [{  
    
    
            "id": "ayi201wkujs",  
    
    
            "floor": {  
    
    
              "id": "pd0i1c4yq9w0y2zsb07ed23sb"  
    
    
            },  
    
    
            "created": "2017-09-29T19:45:57Z",  
    
    
            "modified": "2019-11-18T22:26:42Z",  
    
    
            "enabled": true,  
    
    
            "color": "#03687d",  
    
    
            "label": "Nest Thermostat",  
    
    
            "description": "",  
    
    
            "icon": "public_symbols_video",  
    
    
            "keywords": [],  
    
    
            "media": null,  
    
    
            "mediaType": null,  
    
    
            "position": {  
    
    
              "x": 1.20415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "anchorPosition": {  
    
    
              "x": 1.20415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "discPosition": {  
    
    
              "x": 1.40415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "stemNormal": {  
    
    
              "x": 1,  
    
    
              "y": 0,  
    
    
              "z": 0  
    
    
            },  
    
    
            "stemLength": 0.2,  
    
    
            "stemEnabled": true,  
    
    
            "stemDirection": {  
    
    
              "x": 0.2,  
    
    
              "y": 0,  
    
    
              "z": 0  
    
    
            }  
    
    
          }, …]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getTags\(%24modelId%3A%20ID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20mattertags\(includeDisabled%3A%20true\)%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20created%0A%20%20%20%20%20%20modified%0A%20%20%20%20%20%20enabled%0A%20%20%20%20%20%20color%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20icon%0A%20%20%20%20%20%20keywords%0A%20%20%20%20%20%20media%0A%20%20%20%20%20%20mediaType%0A%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20anchorPosition%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20discPosition%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20stemNormal%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20stemLength%0A%20%20%20%20%20%20stemEnabled%0A%20%20%20%20%20%20stemDirection%20%7B%20x%2C%20y%2C%20z%20%7D%20%23%20Deprecated%2C%20use%20stemNormal%20and%20stemLength%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getTags)

Get all Dimensional Data from the Model, Floors and Rooms
    
    
    query getDimensions($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
          name  
    
    
          description  
    
    
          dimensions {  
    
    
          ...dimensions  
    
    
          }  
    
    
          floors {  
    
    
          label  
    
    
          dimensions(units: imperial) {  
    
    
              ...dimensions  
    
    
          }  
    
    
        }  
    
    
         rooms {  
    
    
          id  
    
    
          label  
    
    
          tags  
    
    
          dimensions {  
    
    
              ...dimensions  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    fragment dimensions on Dimension {  
    
    
    areaCeiling  
    
    
    areaFloor  
    
    
    areaFloorIndoor  
    
    
    areaWall  
    
    
    volume  
    
    
    depth  
    
    
    height  
    
    
    width  
    
    
    units  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
      
    
    
    {  
    
    
    "modelId" : ""  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "name": "Model Name",  
    
    
                "description": "Model Description",  
    
    
                "dimensions": {  
    
    
                    "areaFloor": 270.23811626434326,  
    
    
                    "areaFloorIndoor": 245.12091588974,  
    
    
                    "volume": 1185.8062753677368,  
    
    
                    "units": "metric"  
    
    
                },  
    
    
                "floors": [  
    
    
                    {  
    
    
                        "label": "Floor 1",  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1811.2674341550348,  
    
    
                            "areaFloorIndoor": 1763.751272911024,  
    
    
                            "areaWall": 4200.7835074106215,  
    
    
                            "volume": 30221.99651317749,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "label": "Floor 2",  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1097.5486255027295,  
    
    
                            "areaFloorIndoor": 874.7057536345482,  
    
    
                            "areaWall": 2896.4391288173674,  
    
    
                            "volume": 11654.396359551525,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    }  
    
    
                ],  
    
    
                "rooms": [  
    
    
                    {  
    
    
                        "id": "h26t7ky77ew74yb0pg8qqf5rd",  
    
    
                        "label": "6",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 12.459799766540527,  
    
    
                            "areaFloorIndoor": 12.459799766540527,  
    
    
                            "areaWall": 41.87590026855469,  
    
    
                            "volume": 37.56352996826172,  
    
    
                            "height": 3.0147781372070312,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "tt6gm2a0463x9wmnx7rn6gugc",  
    
    
                        "label": "5",  
    
    
                        "tags": [  
    
    
                            "laundry"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 5.239500045776367,  
    
    
                            "areaFloorIndoor": 5.239500045776367,  
    
    
                            "areaWall": 25.518861770629883,  
    
    
                            "volume": 15.819963455200195,  
    
    
                            "height": 3.019364833831787,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "kuc0fpmsgqxff63egrxrycfud",  
    
    
                        "label": "16",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 19.056400299072266,  
    
    
                            "areaWall": 54.98054504394531,  
    
    
                            "volume": 57.81614303588867,  
    
    
                            "height": 3.0339488983154297,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "wbpb7dkfuwnikd1kq2a9hz70a",  
    
    
                        "label": "14",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1.646399974822998,  
    
    
                            "areaWall": 4.429454803466797,  
    
    
                            "volume": 4.219707489013672,  
    
    
                            "height": 2.562990665435791,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "b4qtykzcazp4iumkamm7y7h2b",  
    
    
                        "label": "12",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 12.713900566101074,  
    
    
                            "areaFloorIndoor": 12.713900566101074,  
    
    
                            "areaWall": 38.93343734741211,  
    
    
                            "volume": 32.931732177734375,  
    
    
                            "height": 2.590214729309082,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "3m54yff1z7crxaywd8if9rb0d",  
    
    
                        "label": "7",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.156899929046631,  
    
    
                            "areaFloorIndoor": 4.156899929046631,  
    
    
                            "areaWall": 24.900320053100586,  
    
    
                            "volume": 12.581944465637207,  
    
    
                            "height": 3.026761531829834,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "a5f9age4zzxewres6iqux2emc",  
    
    
                        "label": "9",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.8993000984191895,  
    
    
                            "areaFloorIndoor": 4.8993000984191895,  
    
    
                            "volume": 12.761096954345703,  
    
    
                            "height": 2.604677438735962,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "cdz3fkt38kae7tapstpt0eaeb",  
    
    
                        "label": "3",  
    
    
                        "tags": [  
    
    
                            "kitchen",  
    
    
                            "living",  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 102.59071350097656,  
    
    
                            "areaFloorIndoor": 102.59071350097656,  
    
    
                            "areaWall": 184.97195434570312,  
    
    
                            "volume": 657.700927734375,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "ediidma5zg15dufx3n0qyq21a",  
    
    
                        "label": "13",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 24.611000061035156,  
    
    
                            "areaFloorIndoor": 24.611000061035156,  
    
    
                            "areaWall": 49.6417236328125,  
    
    
                            "volume": 81.93767547607422,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "xy2x8mpaaqknp7q2c3nnbw1ma",  
    
    
                        "label": "4",  
    
    
                        "tags": [  
    
    
                            "dining",  
    
    
                            "living"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 17.3887996673584,  
    
    
                            "areaFloorIndoor": 17.3887996673584,  
    
    
                            "areaWall": 46.00373458862305,  
    
    
                            "volume": 52.49049758911133,  
    
    
                            "height": 3.0186383724212646,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "2qdmc5i9byxi79ry1pxdkqzea",  
    
    
                        "label": "8",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 15.340200424194336,  
    
    
                            "areaFloorIndoor": 15.340200424194336,  
    
    
                            "areaWall": 41.409175872802734,  
    
    
                            "volume": 57.230098724365234,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "m8npxsuk79xy21dd09x9wtped",  
    
    
                        "label": "11",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.3730998039245605,  
    
    
                            "areaFloorIndoor": 4.3730998039245605,  
    
    
                            "areaWall": 15.520317077636719,  
    
    
                            "volume": 11.225411415100098,  
    
    
                            "height": 2.566923141479492,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "n81qfe51azs8iexnbqwspye6c",  
    
    
                        "label": "15",  
    
    
                        "tags": [  
    
    
                            "office"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.414400100708008,  
    
    
                            "areaWall": 18.9549503326416,  
    
    
                            "volume": 13.287762641906738,  
    
    
                            "height": 3.0100948810577393,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "19ab05tns5h6y4qm42esqqpea",  
    
    
                        "label": "10",  
    
    
                        "tags": [  
    
    
                            "bedroom",  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 19.325401306152344,  
    
    
                            "areaFloorIndoor": 19.325401306152344,  
    
    
                            "areaWall": 64.1736068725586,  
    
    
                            "volume": 71.8935775756836,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "613htqkzf66zz7hf7n8kzszed",  
    
    
                        "label": "2",  
    
    
                        "tags": [  
    
    
                            "living"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 22.022300720214844,  
    
    
                            "areaFloorIndoor": 22.022300720214844,  
    
    
                            "areaWall": 48.04021453857422,  
    
    
                            "volume": 66.34620666503906,  
    
    
                            "height": 3.0126829147338867,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    }  
    
    
                ]  
    
    
            }  
    
    
        }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getDimensions\(%24modelId%3A%20ID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20name%0A%20%20%20%20description%0A%20%20%20%20dimensions%20%7B%0A%20%20%20%20%20%20...dimensions%0A%20%20%20%20%7D%0A%20%20%20%20floors%20%7B%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20dimensions\(units%3A%20imperial\)%20%7B%0A%20%20%20%20%20%20%20%20...dimensions%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20rooms%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20tags%0A%20%20%20%20%20%20dimensions%20%7B%0A%20%20%20%20%20%20%20%20...dimensions%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Afragment%20dimensions%20on%20Dimension%20%7B%0A%20%20areaCeiling%0A%20%20areaFloor%0A%20%20areaFloorIndoor%0A%20%20areaWall%0A%20%20volume%0A%20%20depth%0A%20%20height%0A%20%20width%0A%20%20units%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22FE1FLGnch5h%22%0A%7D&operationName=getDimensions)

Get the Colored Rooms Floorplan URL

Model API users receive access to a variety of generated floorplan images that can be used in 3rd party applications as reference maps. The following query gets a full listing of all floorplans that match the 'photogramy' flag.
    
    
    query getColoredRooms($modelId: ID!){  
    
    
     model(id: $modelId) {  
    
    
        assets {  
    
    
          floorplans(provider: "matterport", flags: [photogramy]) {  
    
    
            floor { label sequence }  
    
    
            format         
    
    
            flags  
    
    
            url  
    
    
            origin { x y }  
    
    
            width  
    
    
            height  
    
    
            resolution  
    
    
          }  
    
    
      	}  
    
    
    	}  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    

Abridged Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "assets": {  
    
    
            "floorplans": [  
    
    
              {  
    
    
                "floor": {  
    
    
                  "label": "Floor 1",  
    
    
                  "sequence": 0  
    
    
                },  
    
    
                "format": "jpg",  
    
    
                "flags": [  
    
    
                  "photogramy"  
    
    
                ],  
    
    
                "url": "https://cdn-2.matterport.com/models/4374f365af4b4983bc8978386f296ab2/assets/render/colorplan_000.jpg?t=2-699b80864d621f874279d737ebceb0045c3c3b76-1758048743-1&download=mp_floorplan_matterport_1234-Main-St_jm5WwEA3HUN.jpg&k=models%2F4374f365af4b4983bc8978386f296ab2%2Fassets%2Frender%2Fcolorplan_000.jpg",  
    
    
                "origin": {  
    
    
                  "x": -4.14900016784668,  
    
    
                  "y": -9.085000038146973  
    
    
                },  
    
    
                "width": 2470,  
    
    
                "height": 1616,  
    
    
                "resolution": 100  
    
    
              },  
    
    
              ...   
    
    
              {  
    
    
                "floor": {  
    
    
                  "label": "Floor 1",  
    
    
                  "sequence": 0  
    
    
                },  
    
    
                "format": "png",  
    
    
                "flags": [  
    
    
                  "photogramy",  
    
    
                  "alpha"  
    
    
                ],  
    
    
                "url": "https://cdn-2.matterport.com/models/4374f365af4b4983bc8978386f296ab2/assets/render/colorplan_alpha_000.png?t=2-39112fc9d13de972de06659ba291cff797867134-1758048743-1&download=mp_floorplan_matterport_1234-Main-St_jm5WwEA3HUN.png&k=models%2F4374f365af4b4983bc8978386f296ab2%2Fassets%2Frender%2Fcolorplan_alpha_000.png",  
    
    
                "origin": {  
    
    
                  "x": -3.4489998817443848,  
    
    
                  "y": -8.385000228881836  
    
    
                },  
    
    
                "width": 2330,  
    
    
                "height": 1476,  
    
    
                "resolution": 100  
    
    
              },  
    
    
              ...  
    
    
              {  
    
    
                "floor": {  
    
    
                  "label": "Floor 1",  
    
    
                  "sequence": 0  
    
    
                },  
    
    
                "format": "jpg",  
    
    
                "flags": [  
    
    
                  "photogramy",  
    
    
                  "colored_rooms"  
    
    
                ],  
    
    
                "url": "https://cdn-2.matterport.com/models/4374f365af4b4983bc8978386f296ab2/assets/render/colorplan_room_000.jpg?t=2-e3c989818191b2a52b429b203bd6f84ffb2d7d6a-1758048743-1&download=mp_floorplan_matterport_1234-Main-St_jm5WwEA3HUN.jpg&k=models%2F4374f365af4b4983bc8978386f296ab2%2Fassets%2Frender%2Fcolorplan_room_000.jpg",  
    
    
                "origin": {  
    
    
                  "x": -4.14900016784668,  
    
    
                  "y": -9.085000038146973  
    
    
                },  
    
    
                "width": 2470,  
    
    
                "height": 1616,  
    
    
                "resolution": 100  
    
    
              },  
    
    
              ...  
    
    
              {  
    
    
                "floor": {  
    
    
                  "label": "Floor 1",  
    
    
                  "sequence": 0  
    
    
                },  
    
    
                "format": "jpg",  
    
    
                "flags": [  
    
    
                  "photogramy",  
    
    
                  "measurements"  
    
    
                ],On this page
    
    This is a library of ready-to-use sample GraphQL queries and mutations for Matterport's Model API.
    
    
    
    
    Each query and mutation contains a link to try the query in our interactive console. If you are logged into your account at my.matterport.com, you will be able to use the interactive console. If you have a Developer Tools license, the Interactive Console will be able to query all models in your account. If you are in Sandbox mode, it will only be able to query the demo model in your account.
    
    
    
    
    With all queries, be sure to edit the variables, when provided, and insert a valid Model ID and valid data for all variables.
    
    
    
    
    If you would like an application to build collections of API queries for testing and generating code to use in your applications, we recommend using Postman and have these snippets available in [a sample collection](/api/model/postman/).
    
    
    
    
    ### Helpful Resources​
    
    
    
    
    
    
        * [Matterport Model API Schema](https://api.matterport.com/model/docs/reference)
    
    
        * [GraphQL Queries & Mutations Guide](https://graphql.org/learn/queries/)
    
    
        * [Matterport Developer Support](mailto:)
    
    
    
    
    
    ### Testing in Sandbox Mode​
    
    
    
    
    API Users in Sandbox mode can test these queries on a demo model in their account. The models() query will only return your demo model. Purchasing a developer license will change this behavior to show the models in your account. You can still find the SID of the demo model in production mode using the provided 'Search for demo models in your account' query found below.
    
    
    
    
    ## Models Queries​
    
    
    
    
    models() queries get data from our models search engine. Searchable data can be found here.
    
    
    Search for your models
    
    
    
    
    
    
    query {  
    
    
      models(query: "*") {  
    
    
        totalResults  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
          description  
    
    
        }  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "models": {  
    
    
          "totalResults": 1,  
    
    
          "results": [  
    
    
            {  
    
    
              "id": "MODEL_ID",  
    
    
              "name": "352 E Java Dr",  
    
    
              "description": ""  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20%7B%0Amodels\(query%3A%20%22*%22\)%20%7B%0A%20%20%20%20totalResults%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20description%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A)

Search for demo models in your account

All accounts come with a demo model. This can be queried in sandbox mode for testing purposes. If you wish to find the demo models with a models query, use "demo: true" as your query. You can also include 'demo' in your results to verify that this is a demo model.
    
    
    query {  
    
    
      models(query: "demo:true", include: demo) {  
    
    
        results {  
    
    
          name  
    
    
          demo  
    
    
          id  
    
    
        }  
    
    
        nextOffset  
    
    
          
    
    
                "url": "https://cdn-2.matterport.com/models/4374f365af4b4983bc8978386f296ab2/assets/render/measureplan_imperial_room_000.jpg?t=2-9f0da9bdea98979f30bdf63d61b57a61dc5c85e4-1758048743-1&download=mp_floorplan_matterport_1234-Main-St_jm5WwEA3HUN.jpg&k=models%2F4374f365af4b4983bc8978386f296ab2%2Fassets%2Frender%2Fmeasureplan_imperial_room_000.jpg",  
    
    
                "origin": {  
    
    
                  "x": -4.14900016784668,  
    
    
                  "y": -9.085000038146973  
    
    
                },  
    
    
                "width": 2470,  
    
    
                "height": 1616,  
    
    
                "resolution": 100  
    
    
              },  
    
    
              ...  
    
    
              {  
    
    
                "floor": {  
    
    
                  "label": "Floor 1",  
    
    
                  "sequence": 0  
    
    
                },  
    
    
                "format": "png",  
    
    
                "flags": [  
    
    
                  "photogramy",  
    
    
                  "alpha"  
    
    
                ],  
    
    
                "url": "https://cdn-2.matterport.com/models/4374f365af4b4983bc8978386f296ab2/assets/render/vr_colorplan_000.png?t=2-563683a6f19031f56cd98f35e74d61c2bf9ab573-1758048743-1&download=mp_floorplan_matterport_1234-Main-St_jm5WwEA3HUN.png&k=models%2F4374f365af4b4983bc8978386f296ab2%2Fassets%2Frender%2Fvr_colorplan_000.png",  
    
    
                "origin": {  
    
    
                  "x": -3.447999954223633,  
    
    
                  "y": -8.376633644104004  
    
    
                },  
    
    
                "width": 512,  
    
    
                "height": 324,  
    
    
                "resolution": 21.97613525390625  
    
    
              },  
    
    
              ...  
    
    
            ]  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getColoredRooms\(%24modelId%3A%20ID!\)%7B%0A%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20assets%20%7B%0A%20%20%20%20%20%20floorplans\(provider%3A%20%22matterport%22%2C%20flags%3A%20%5Bphotogramy%5D\)%20%7B%0A%20%20%20%20%20%20%20%20floor%20%7B%20label%20sequence%20%7D%0A%20%20%20%20%20%20%20%20format%20%20%20%20%20%20%20%0A%20%20%20%20%20%20%20%20flags%0A%20%20%20%20%20%20%20%20url%0A%20%20%20%20%20%20%20%20origin%20%7B%20x%20y%20%7D%0A%20%20%20%20%20%20%20%20width%0A%20%20%20%20%20%20%20%20height%0A%20%20%20%20%20%20%20%20resolution%0A%20%20%20%20%20%20%7D%0A%20%20%09%7D%0A%09%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getColoredRooms)

Get all Notes and Comments

Users can query notes that have been created in Matterport Cloud to synchronize information within their internal applications.
    
    
    query getNotes($modelId: ID!){  
    
    
      model(id:$modelId) {  
    
    
      
    
    
      notes(includeDisabled: true,  
    
    
            # resolutionStatus: [resolved],  
    
    
            #ids: ["_____"]  
    
    
      ) {  
    
    
        id  
    
    
        created  
    
    
        modified  
    
    
        label  
    
    
        enabled  
    
    
        createdBy {  
    
    
          id  
    
    
          firstName  
    
    
           lastName  
    
    
           email  
    
    
        }  
    
    
        resolution  
    
    
        color  
    
    
        anchorPosition { x y z }  
    
    
        discPosition { x y z }  
    
    
        stemNormal { x y z }  
    
    
        stemLength  
    
    
        stemEnabled  
    
    
        firstCommentAt  
    
    
        lastCommentAt  
    
    
        totalComments  
    
    
        ...Comments  
    
    
    totalResults  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "models": {  
    
    
          "results": [  
    
    
            {  
    
    
              "name": "Get Started",  
    
    
              "demo": true,  
    
    
              "id": "xiyHP9VkT1U"  
    
    
            },  
    
    
            {  
    
    
              "name": "Get Started",  
    
    
              "demo": true,  
    
    
              "id": "YGYWqVqWDpm"  
    
    
            }  
    
    
          ],  
    
    
          "totalResults": 2  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22demo%3Atrue%22%2C%0A%20%20%20%20include%3A%20demo%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20demo%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D)

Search for archived models
    
    
    query archivedModels {  
    
    
      models(query: "state:inactive", include: inactive) {  
    
    
        results {  
    
    
          name  
    
    
          state  
    
    
          id  
    
    
        }  
    
    
        nextOffset  
    
    
        totalResults  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20archivedModels%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22state%3Ainactive%22%2C%0A%20%20%20%20include%3A%20inactive%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20state%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D&operationName=archivedModels)

Search for Models with x # of Floors
    
    
    query {  
    
    
      models(query: "floors.count: 20") {  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
        nextOffset  
    
    
        totalResults  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20modelSearch%20%7B%0A%20%20%20models\(%0A%20%20%20%20query%3A%20%22floors.count%3A%2020%22%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20demo%0A%20%20%20%20%20%20%20id%0A%20%20%20%20%20%7D%0A%20%20%20%20%20nextOffset%0A%20%20%20%20%20totalResults%0A%20%20%20%7D%0A%20%7D&operationName=modelSearch)

## Model Queries​

model() queries get data from individual models.

Get Model Details

Use Model API to query the information that a user has entered on the 'Model Details' tab in Matterport Cloud and information on when a model was created and last updated. ```graphql query getModelDetails($modelId: ID!){ model(id:$modelId) { id name state visibility created modified description publication { description summary address contact { name email phoneNumber } externalUrl presentedBy published url(branding: default) } } } 

# variables

{ "modelId" : "" }
    
    
      
    
    
      Important Note - `model { description }` is the Internal Notes field, whereas <code>model { publication { description } }</code> is the public model description.  
    
    
      
    
    
      Sample Response:  
    
    
      
    
    
    ```json  
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "id": "JGPnGQ6hosj",  
    
    
                "name": "Southern California Luxury Home",  
    
    
                "state": "active",  
    
    
                "visibility": "public",  
    
    
                "created": "2017-09-26T21:52:07Z",  
    
    
                "modified": "2025-08-14T04:31:32Z",  
    
    
                "description": "",  
    
    
                "publication": {  
    
    
                    "description": "",  
    
    
                    "summary": "This majestic looking home has wood flooring, crown molding, is a great family home. This tour was shot with the Matterport Pro2 3D camera.",  
    
    
                    "address": null,  
    
    
                    "contact": {  
    
    
                        "name": "Acme Realty",  
    
    
                        "email": "name@example.com",  
    
    
                        "phoneNumber": "+15551234567"  
    
    
                    },  
    
    
                    "externalUrl": "http://www.acemerealty.com",  
    
    
                    "presentedBy": "Acme Realty",  
    
    
                    "published": true,  
    
    
                    "url": "https://my.matterport.com/show/?m=JGPnGQ6hosj"  
    
    
                }  
    
    
            }  
    
    
        }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getModelDetails\(%24modelId%3A%20ID!\)%7B%0A%09model\(id%3A%24modelId\)%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20state%0A%20%20%20%20%20%20%20%20visibility%0A%20%20%20%20%20%20%20%20created%0A%20%20%20%20%20%20%20%20modified%0A%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20publication%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20%20%20%20%20summary%0A%20%20%20%20%20%20%20%20%20%20%20%20address%0A%20%20%20%20%20%20%20%20%20%20%20%20contact%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20phoneNumber%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20externalUrl%0A%20%20%20%20%20%20%20%20%20%20%20%20presentedBy%0A%20%20%20%20%20%20%20%20%20%20%20%20published%0A%20%20%20%20%20%20%20%20%20%20%20%20url\(branding%3A%20default\)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%20%20%20%20&operationName=getModelDetails&variables=%7B%0A%20%20%20%20%22modelId%22%20%3A%20%22%22%0A%7D)

Get all Sweep Locations and Panoramic Images

Panoramic images are currently only available as **skyboxes**.

A skybox is made out of six images - each image individually projected onto the shape of a cube - that is: top, bottom, left, right, front and back sides. Skyboxes are available in 512x512 (resolution: low), 1024x1024 (resolution: high) and 2048 x 2048 (resolution: 2k) resolutions and come bundled with position and rotation data. 4096 x 4096 skyboxes are available for business and Enterprise customers who have purchased the 'Advanced Imagery Bundle' add-on.
    
    
    fragment panoFragment on PanoramicImageLocation{  
    
    
      id  
    
    
      skybox(resolution: "2k") {  
    
    
        id  
    
    
        status  
    
    
        format  
    
    
        children  
    
    
      }  
    
    
    }  
    
    
      
    
    
    query getSweeps($modelId: ID!){  
    
    
      model(id: $modelId) {  
    
    
        locations {  
    
    
          id  
    
    
          model { id }  
    
    
          position { x, y, z }  
    
    
          floor { id }  
    
    
          room { id }  
    
    
          panos { ...panoFragment }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    

}  


}  


}  


  


fragment Comments on Note {  


comments(sortBy: { field: created }, pageSize: 1, offset: "string") {  


nextOffset  


results {  


id  


created  


modified  


createdBy {  


id  


firstName  


lastName  


email  


}  


edited  


text  


}  


}  


}  


  


# variables  


{  


"modelId" : ""  


}  


`

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getNotes\(%24modelId%3A%20ID!\)%7B%0A%09model\(id%3A%24modelId\)%20%7B%0A%20%20%20%20%0A%20%20notes\(includeDisabled%3A%20true%2C%0A%20%20%20%20%20%20%20%20%23%20resolutionStatus%3A%20%5Bresolved%5D%2C%20%0A%20%20%20%20%20%20%20%20%23ids%3A%20%5B%22_____%22%5D%0A%20%20\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20created%0A%20%20%20%20modified%0A%20%20%20%20label%0A%20%20%20%20enabled%0A%20%20%20%20createdBy%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20firstName%0A%20%20%20%20%20%20%20lastName%0A%20%20%20%20%20%20%20email%0A%20%20%20%20%7D%0A%20%20%20%20resolution%0A%20%20%20%20color%0A%20%20%20%20anchorPosition%20%7B%20x%20y%20z%20%7D%20%0A%20%20%20%20discPosition%20%7B%20x%20y%20z%20%7D%0A%20%20%20%20stemNormal%20%7B%20x%20y%20z%20%7D%0A%20%20%20%20stemLength%0A%20%20%20%20stemEnabled%0A%20%20%20%20firstCommentAt%0A%20%20%20%20lastCommentAt%0A%20%20%20%20totalComments%0A%20%20%20%20...Comments%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Afragment%20Comments%20on%20Note%20%7B%0A%20%20comments\(sortBy%3A%20%7B%20field%3A%20created%20%7D%2C%20pageSize%3A%201%2C%20offset%3A%20%22string%22\)%20%7B%0A%20%20%20%20nextOffset%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20created%0A%20%20%20%20%20%20modified%0A%20%20%20%20%20%20createdBy%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20firstName%0A%20%20%20%20%20%20%20%20lastName%0A%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20edited%0A%20%20%20%20%20%20text%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D)

## Mutations​

Mutations update data via Model API. They can also contain queries that return data after the data has changed. The query can return an ID if new content has been added, or updated information that may have changed due to the patch (update).

Toggle Model Visibility and Get Embed URL
    
    
    mutation toggleModelVisibility($modelId: ID!, $visibility: ModelAccessVisibility!){  
    
    
      updateModelAccessVisibility(id: $modelId, visibility: $visibility) {  
    
    
        id  
    
    
        accessVisibility  
    
    
        accessVisibilityLastChanged  
    
    
        publication {  
    
    
          published  
    
    
          url  
    
    
          externalUrl  
    
    
          embed  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : "",  
    
    
      "visibility" : "public"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "updateModelAccessVisibility": {  
    
    
          "id": "WeZ1dHwn3ac",  
    
    
          "accessVisibility": "public",  
    
    
          "accessVisibilityLastChanged": "2024-05-01T12:00:00Z",  
    
    
          "publication": {  
    
    
            "published": true,  
    
    
            "url": "https://my.matterport.com/show/?m=WeZ1dHwn3ac",  
    
    
            "externalUrl": null,  
    
    
            "embed": "&lt;frame width='853' height='480' src='https://my.matterport.com/show/?m=WeZ1dHwn3ac' frameborder='0' allowfullscreen allow='xr-spatial-tracking'>&lt;/iframe>"  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20toggleModelVisibility\(%24modelId%3A%20ID!%2C%20%24visibility%3A%20ModelAccessVisibility!\)%7B%0A%20%20updateModelAccessVisibility\(id%3A%20%24modelId%2C%20visibility%3A%20%24visibility\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20accessVisibility%0A%20%20%20%20accessVisibilityLastChanged%0A%20%20%20%20publication%20%7B%0A%20%20%20%20%20%20published%0A%20%20%20%20%20%20url%0A%20%20%20%20%20%20externalUrl%0A%20%20%20%20%20%20embed%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22WeZ1dHwn3ac%22%2C%0A%20%20%22visibility%22%20%3A%20%22public%22%0A%7D&operationName=toggleModelVisibility)

Toggle Model Activation (archive / activate)
    
    
    mutation toggleModelActivation($modelId: ID!, $state: ModelStateChange!) {  
    
    
      updateModelState(id: $modelId, state: $state) {  
    
    
        id  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20toggleModelActivation\(%24modelId%3A%20ID!%2C%20%24state%3A%20ModelStateChange!\)%7B%0A%20%20updateModelState\(%0A%20%20%20%20id%3A%20%24modelId%2C%0A%20%20%20%20state%3A%20%24state%0A%20%20\)%7B%0A%20%20%20%20id%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%2C%0A%20%20%22state%22%3A%20%22inactive%22%0A%7D&operationName=toggleModelActivation)

Patch Model Details

Model API can be used to change the default settings for a model and all meta information associated with it using the patchModel mutation.
    
    
    mutation toggleModelVisibility($id: ID!){  
    
    
      patchModel(id: $id, patch: {  
    
    
          name: "Model Name",  
    
    
          description: "Model Description",  
    
    
          options: {  
    
    
              # For all following options:  
    
    
              # default, enabled, disabled  
    
    
              socialSharingOverride: default,  
    
    
              vrOverride: default,  
    
    
              tourButtonsOverride: default,  
    
    
              tourAutoplayOverride: default,  
    
    
              dollhouseOverride:Sample Response:
    
    
    
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "locations": [{  
    
    
              "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
              "model": {  
    
    
                "id": "MODEL_ID"  
    
    
              },  
    
    
              "position": {  
    
    
                "x": 0,  
    
    
                "y": 0,  
    
    
                "z": 0  
    
    
              },  
    
    
              "panos": [{  
    
    
                "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
                "skybox": {  
    
    
                  "id": "a0723324-ab3e-4500-bdee-8fec13d3ae9d",  
    
    
                  "status": "available",  
    
    
                  "format": "skybox",  
    
    
                  "children": [  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox0.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox1.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox2.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox3.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox4.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1",  
    
    
                    "https://qa-cdn-1.matterport.com/models/1a56eedeff7d4a7481b961c009ae9236/assets/pan/~/high/a0723324ab3e4500bdee8fec13d3ae9d_skybox5.jpg?t=2-c81c9af53e390d7c5d9946f73a74665f0e06757c-1573701898-1"  
    
    
                  ]  
    
    
                }  
    
    
              }]  
    
    
            }, ...  
    
    
          }]  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=fragment%20panoFragment%20on%20PanoramicImageLocation%7B%0A%20%20id%0A%20%20skybox%20%7B%0A%20%20%20%20id%0A%20%20%20%20status%0A%20%20%20%20format%0A%20%20%20%20children%0A%20%20%7D%0A%7D%0A%0Aquery%20getSweeps\(%24modelId%3A%20ID!\)%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20locations%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20model%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20room%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20panos%20%7B%20...panoFragment%20%7D%20%20%20%20%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getSweeps)

Get all Defurnished Panoramic Images

Spaces that contain a defurnished view have a secondary set of panoramic images that are associated with the Defurnished View. A complete model object is available under each view. The following sample query filters the available views and returns direct links to the defurnished panoramic imagery.
    
    
    fragment panoFragment on PanoramicImageLocation{  
    
    
      id  
    
    
      skybox {  
    
    
        id  
    
    
        status  
    
    
        format  
    
    
        children  
    
    
      }  
    
    
    }  
    
    
      
    
    
    query getSweeps($modelId: ID!){  
    
    
        model(id: $modelId) {  
    
    
        views(types:["matterport.model.defurnished"]) {  
    
    
          model {  
    
    
    	      locations {  
    
    
      	      id  
    
    
        	    label  
    
    
            	position { x, y, z }  
    
    
            	floor { id }  
    
    
            	room { id }  
    
    
            	panos { ...panoFragment }      
    
    
        		}  
    
    
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
    
    
              "model": {  
    
    
                "locations": [  
    
    
                  {  
    
    
                    "id": "caa1k8nhdi4hmtbpidzgnpx6a",  
    
    
                    "label": "7",  
    
    
                    "position": {  
    
    
                      "x": 8.10565185546875,  
    
    
                      "y": 1.020589828491211,  
    
    
                      "z": -1.7120000123977661  
    
    
                    },  
    
    
                    "floor": {  
    
    
                      "id": "tsmq1wak12rhgn0mawksxcwcd"  
    
    
                    },  
    
    
                    "room": {  
    
    
                      "id": "xy2x8mpaaqknp7q2c3nnbw1ma"  
    
    
                    },  
    
    
                    "panos": [  
    
    
                      {  
    
    
                        "id": "399fqhapcqmnc8gk6qfba5ktb",  
    
    
                        "skybox": {  
    
    
                          "id": "399fqhapcqmnc8gk6qfba5ktb",  
    
    
                          "status": "available",  
    
    
                          "format": "skybox",  
    
    
                          "children": [  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox0.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox1.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox2.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox3.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox4.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow",  
    
    
                            "https://cdn-2.matterport.com/models/7a6b6ce89ad14f85aebec3cb69c0c493/assets/overlay/b398f57009964332aa2834094d4f05e5/pan/low/~/5a9a2600ed2f4ff9982760095bc49bc2_skybox5.jpg?t=2-933fc6b3e474968de71beacba867ac997b796233-1757783109-1&k=models%2F7a6b6ce89ad14f85aebec3cb69c0c493%2Fassets%2Foverlay%2Fb398f57009964332aa2834094d4f05e5%2Fpan%2Flow"  
    
    
                          ]  
    
    
                        }  
    
    
                      }  
    
    
                      ...  
    
    
                    ]  
    
    
                  }  
    
    
                ]  
    
    
              }  
    
    
            }  
    
    
          ]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=fragment%20panoFragment%20on%20PanoramicImageLocation%7B%0A%20%20id%0A%20%20skybox%20%7B%0A%20%20%20%20id%0A%20%20%20%20status%0A%20%20%20%20format%0A%20%20%20%20children%0A%20%20%7D%0A%7D%0A%0Aquery%20getSweeps\(%24modelId%3A%20ID!\)%7B%0A%20%20%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20locations%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20label%0A%20%20%20%20%20%20%20%20model%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20room%20%7B%20id%20%7D%0A%20%20%20%20%20%20%20%20panos%20%7B%20...panoFragment%20%7D%20%20%20%20%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getSweeps)

Get all Tags and Tag Data

Users can get all Tags from a model. Presently, attachments are not queryable.

Tags were previous called 'mattertags' and Model API continues to use this naming convention.
    
    
    query getTags($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
        mattertags(includeDisabled: true) {  
    
    
          id  
    
    
          floor { id }  
    
    
          created  
    
    
          modified  
    
    
          enabled  
    
    
          color  
    
    
          label  
    
    
          description  
    
    
          icon  # New!  
    
    
          keywords  
    
    
          media  
    
    
          mediaType  
    
    
          position { x, y, z }  
    
    
          anchorPosition { x, y, z }  
    
    
          discPosition { x, y, z }  
    
    
          stemNormal { x, y, z }  
    
    
          stemLength  
    
    
          stemEnabled  
    
    
          stemDirection { x, y, z } # Deprecated, use stemNormal and stemLength  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "mattertags": [{  
    
    
            "id": "ayi201wkujs",  
    
    
            "floor": {  
    
    
              "id": "pd0i1c4yq9w0y2zsb07ed23sb"  
    
    
            },  
    
    
            "created": "2017-09-29T19:45:57Z",  
    
    
            "modified": "2019-11-18T22:26:42Z",  
    
    
            "enabled": true,  
    
    
            "color": "#03687d",  
    
    
            "label": "Nest Thermostat",  
    
    
            "description": "",  
    
    
            "icon": "public_symbols_video",  
    
    
            "keywords": [],  
    
    
            "media": null,  
    
    
            "mediaType": null,  
    
    
            "position": {  
    
    
              "x": 1.20415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "anchorPosition": {  
    
    
              "x": 1.20415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "discPosition": {  
    
    
              "x": 1.40415628,  
    
    
              "y": -5.35434341,  
    
    
              "z": 3.1942153  
    
    
            },  
    
    
            "stemNormal": {  
    
    
              "x": 1,  
    
    
              "y": 0,  
    
    
              "z": 0  
    
    
            },  
    
    
            "stemLength": 0.2,  
    
    
            "stemEnabled": true,  
    
    
            "stemDirection": {  
    
    
              "x": 0.2,  
    
    
              "y": 0,  
    
    
              "z": 0  
    
    
            }  
    
    
          }, …]  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getTags\(%24modelId%3A%20ID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20mattertags\(includeDisabled%3A%20true\)%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20floor%20%7B%20id%20%7D%0A%20%20%20%20%20%20created%0A%20%20%20%20%20%20modified%0A%20%20%20%20%20%20enabled%0A%20%20%20%20%20%20color%0A%20%20%20%20%20%20label%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20icon%0A%20%20%20%20%20%20keywords%0A%20%20%20%20%20%20media%0A%20%20%20%20%20%20mediaType%0A%20%20%20%20%20%20position%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20anchorPosition%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20discPosition%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20stemNormal%20%7B%20x%2C%20y%2C%20z%20%7D%0A%20%20%20%20%20%20stemLength%0A%20%20%20%20%20%20stemEnabled%0A%20%20%20%20%20%20stemDirection%20%7B%20x%2C%20y%2C%20z%20%7D%20%23%20Deprecated%2C%20use%20stemNormal%20and%20stemLength%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=getTags)

Get all Dimensional Data from the Model, Floors and Rooms
    
    
    query getDimensions($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
          name  
    
    
          description  
    
    
          dimensions {  
    
    
          ...dimensions  
    
    
          }  
    
    
          floors {  
    
    
          label  
    
    
          dimensions(units: imperial) {  
    
    
              ...dimensions  
    
    
          }  
    
    
        }  
    
    
         rooms {  
    
    
          id  
    
    
          label  
    
    
          tags  
    
    
          dimensions {  
    
    
              ...dimensions  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    fragment dimensions on Dimension {  
    
    
    areaCeiling  
    
    
    areaFloor  
    
    
    areaFloorIndoor  
    
    
    areaWall  
    
    
    volume  
    
    
    depth  
    
    
    height  
    
    
    width  
    
    
    units  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
      
    
    
    {  
    
    
    "modelId" : ""  
    
    
    }  
    
    
      
    

Sample Response:
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "name": "Model Name",  
    
    
                "description": "Model Description",  
    
    
                "dimensions": {  
    
    
                    "areaFloor": 270.23811626434326,  
    
    
                    "areaFloorIndoor": 245.12091588974,  
    
    
                    "volume": 1185.8062753677368,  
    
    
                    "units": "metric"  
    
    
                },  
    
    
                "floors": [  
    
    
                    {  
    
    
                        "label": "Floor 1",  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1811.2674341550348,  
    
    
                            "areaFloorIndoor": 1763.751272911024,  
    
    
                            "areaWall": 4200.7835074106215,  
    
    
                            "volume": 30221.99651317749,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "label": "Floor 2",  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1097.5486255027295,  
    
    
                            "areaFloorIndoor": 874.7057536345482,  
    
    
                            "areaWall": 2896.4391288173674,  
    
    
                            "volume": 11654.396359551525,  
    
    
                            "units": "imperial"  
    
    
                        }  
    
    
                    }  
    
    
                ],  
    
    
                "rooms": [  
    
    
                    {  
    
    
                        "id": "h26t7ky77ew74yb0pg8qqf5rd",  
    
    
                        "label": "6",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 12.459799766540527,  
    
    
                            "areaFloorIndoor": 12.459799766540527,  
    
    
                            "areaWall": 41.87590026855469,  
    
    
                            "volume": 37.56352996826172,  
    
    
                            "height": 3.0147781372070312,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "tt6gm2a0463x9wmnx7rn6gugc",  
    
    
                        "label": "5",  
    
    
                        "tags": [  
    
    
                            "laundry"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 5.239500045776367,  
    
    
                            "areaFloorIndoor": 5.239500045776367,  
    
    
                            "areaWall": 25.518861770629883,  
    
    
                            "volume": 15.819963455200195,  
    
    
                            "height": 3.019364833831787,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "kuc0fpmsgqxff63egrxrycfud",  
    
    
                        "label": "16",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 19.056400299072266,  
    
    
                            "areaWall": 54.98054504394531,  
    
    
                            "volume": 57.81614303588867,  
    
    
                            "height": 3.0339488983154297,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "wbpb7dkfuwnikd1kq2a9hz70a",  
    
    
                        "label": "14",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 1.646399974822998,  
    
    
                            "areaWall": 4.429454803466797,  
    
    
                            "volume": 4.219707489013672,  
    
    
                            "height": 2.562990665435791,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "b4qtykzcazp4iumkamm7y7h2b",  
    
    
                        "label": "12",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 12.713900566101074,  
    
    
                            "areaFloorIndoor": 12.713900566101074,  
    
    
                            "areaWall": 38.93343734741211,  
    
    
                            "volume": 32.931732177734375,  
    
    
                            "height": 2.590214729309082,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "3m54yff1z7crxaywd8if9rb0d",  
    
    
                        "label": "7",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.156899929046631,  
    
    
                            "areaFloorIndoor": 4.156899929046631,  
    
    
                            "areaWall": 24.900320053100586,  
    
    
                            "volume": 12.581944465637207,  
    
    
                            "height": 3.026761531829834,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "a5f9age4zzxewres6iqux2emc",  
    
    
                        "label": "9",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.8993000984191895,  
    
    
                            "areaFloorIndoor": 4.8993000984191895,  
    
    
                            "volume": 12.761096954345703,  
    
    
                            "height": 2.604677438735962,  
    
    
                            "units": "metric"  
    
    
     default,  
    
    
              dollhouseLabelsOverride: default,  
    
    
              floorplanOverride: default,  
    
    
              labelsOverride: default,  
    
    
              highlightReelOverride: default,  
    
    
              unitType: {  
    
    
                  set: metric, # or imperial  
    
    
                  resetToDefault: false  
    
    
              },  
    
    
              # Special options:  
    
    
              measurements: {  
    
    
                # disabled, measure, measureAndView  
    
    
                set: measureAndView,  
    
    
                resetToDefault: false  
    
    
              },  
    
    
              backgroundColor: {  
    
    
                  # black, grey, white  
    
    
                  set: white,  
    
    
                  resetToDefault: false  
    
    
              },  
    
    
          }  
    
    
          mls: {  
    
    
              id: "MLS ID",  
    
    
              name: "Listing Name"  
    
    
          },  
    
    
          publication: {  
    
    
              contact: {  
    
    
                  name: "Contact Person",  
    
    
                  email: "person@domain.com",  
    
    
                  phoneNumber: "888-888-8888"  
    
    
              }  
    
    
              externalUrl: "https://linktomoreinfo.com",  
    
    
              presentedBy:"Your Company Name",  
    
    
              summary: "Summary information about this model."  
    
    
          },  
    
    
      
    
    
      }) {  
    
    
        id  
    
    
        name  
    
    
        description  
    
    
        options {  
    
    
              socialSharingOverride,  
    
    
              vrOverride,  
    
    
              tourButtonsOverride,  
    
    
              tourAutoplayOverride,  
    
    
              dollhouseOverride,  
    
    
              dollhouseLabelsOverride,  
    
    
              floorplanOverride,  
    
    
              labelsOverride:,  
    
    
              highlightReelOverride,  
    
    
              unitType,  
    
    
              measurements,  
    
    
              backgroundColor  
    
    
        }  
    
    
        mls {  
    
    
            id  
    
    
            name  
    
    
        }  
    
    
        publication {  
    
    
              contact {  
    
    
                  name  
    
    
                  email  
    
    
                  phoneNumber  
    
    
              }  
    
    
              presentedBy  
    
    
              externalUrl  
    
    
              summary  
    
    
          }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
        "id" : "FE1FLGnch5h"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "patchModel": {  
    
    
          "id": "FE1FLGnch5h",  
    
    
          "name": "Model Name",  
    
    
          "description": "Model Description",  
    
    
          "options": {  
    
    
            "socialSharingOverride": "default",  
    
    
            "vrOverride": "default",  
    
    
            "tourButtonsOverride": "default",  
    
    
            "tourAutoplayOverride": "default",  
    
    
            "dollhouseOverride": "default",  
    
    
            "dollhouseLabelsOverride": "default",  
    
    
            "floorplanOverride": "default",  
    
    
            "labelsOverride": "default",  
    
    
            "unitType": "metric",  
    
    
            "measurements": "measureAndView",  
    
    
            "backgroundColor": "white"  
    
    
          },  
    
    
          "mls": {  
    
    
            "id": "MLS ID",  
    
    
            "name": "Listing Name"  
    
    
          },  
    
    
          "publication": {  
    
    
            "contact": {  
    
    
              "name": "Contact Person",  
    
    
              "email": "person@domain.com",  
    
    
              "phoneNumber": "(888) 888-8888"  
    
    
            },  
    
    
            "presentedBy": "Your Company Name",  
    
    
            "externalUrl": "https://linktomoreinfo.com",  
    
    
            "summary": "Summary information about this model."  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20patchModelInfo\(%24id%3A%20ID!\)%7B%0A%20%20patchModel\(id%3A%20%24id%2C%20patch%3A%20%7B%20%0A%20%20%20%20%20%20name%3A%20%22Model%20Name%22%2C%0A%20%20%20%20%20%20description%3A%20%22Model%20Description%22%2C%0A%20%20%20%20%20%20options%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%23%20For%20all%20following%20options%3A%0A%20%20%20%20%20%20%20%20%20%20%23%20default%2C%20enabled%2C%20disabled%0A%20%20%20%20%20%20%20%20%20%20socialSharingOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20vrOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20tourButtonsOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20tourAutoplayOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20dollhouseOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20dollhouseLabelsOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20floorplanOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20labelsOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20highlightReelOverride%3A%20default%2C%0A%20%20%20%20%20%20%20%20%20%20unitType%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20set%3A%20metric%2C%20%23%20or%20imperial%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20resetToDefault%3A%20false%0A%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%23%20Special%20options%3A%0A%20%20%20%20%20%20%20%20%20%20measurements%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%23%20disabled%2C%20measure%2C%20measureAndView%0A%20%20%20%20%20%20%20%20%20%20%20%20set%3A%20measureAndView%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20resetToDefault%3A%20false%0A%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20backgroundColor%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%23%20black%2C%20grey%2C%20white%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20set%3A%20white%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20resetToDefault%3A%20false%0A%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20mls%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20id%3A%20%22MLS%20ID%22%2C%0A%20%20%20%20%20%20%20%20%20%20name%3A%20%22Listing%20Name%22%0A%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20publication%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20contact%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%3A%20%22Contact%20Person%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20email%3A%20%22person%40domain.com%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20phoneNumber%3A%20%22888-888-8888%22%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20externalUrl%3A%20%22https%3A%2F%2Flinktomoreinfo.com%22%2C%0A%20%20%20%20%20%20%20%20%20%20presentedBy%3A%22Your%20Company%20Name%22%2C%0A%20%20%20%20%20%20%20%20%20%20summary%3A%20%22Summary%20information%20about%20this%20model.%22%0A%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%0A%20%20%7D\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20description%0A%20%20%20%20options%20%7B%0A%20%20%20%20%20%20%20%20%20%20socialSharingOverride%2C%0A%20%20%20%20%20%20%20%20%20%20vrOverride%2C%0A%20%20%20%20%20%20%20%20%20%20tourButtonsOverride%2C%0A%20%20%20%20%20%20%20%20%20%20tourAutoplayOverride%2C%0A%20%20%20%20%20%20%20%20%20%20dollhouseOverride%2C%0A%20%20%20%20%20%20%20%20%20%20dollhouseLabelsOverride%2C%0A%20%20%20%20%20%20%20%20%20%20floorplanOverride%2C%0A%20%20%20%20%20%20%20%20%20%20labelsOverride%3A%2C%0A%20%20%20%20%20%20%20%20%20%20highlightReelOverride%2C%0A%20%20%20%20%20%20%20%20%20%20unitType%2C%0A%20%20%20%20%20%20%20%20%20%20measurements%2C%0A%20%20%20%20%20%20%20%20%20%20backgroundColor%0A%20%20%20%20%7D%0A%20%20%20%20mls%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%20%20publication%20%7B%0A%20%20%20%20%20%20%20%20%20%20contact%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20email%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20phoneNumber%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20presentedBy%0A%20%20%20%20%20%20%20%20%20%20externalUrl%0A%20%20%20%20%20%20%20%20%20%20summary%0A%20%20%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%20%20%22id%22%20%3A%20%22FE1FLGnch5h%22%0A%7D&operationName=patchModelInfo)

Change Address Visibility

Model API can be used to change the default settings for a model and all meta information associated with it using the patchModel mutation.
    
    
    mutation changeAddressVisibility($id: ID!){  
    
    
        updateModelAddress(  
    
    
          id: $id,  
    
    
          addressVisibility: none     # full, partial or none  
    
    
        ) {  
    
    
            options {  
    
    
                addressVisibility  
    
    
            }  
    
    
        }  
    
    
      }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
        "id" : "FE1FLGnch5h"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "updateModelAddress": {  
    
    
          "id": "FE1FLGnch5h",  
    
    
          "name": "Model Name",  
    
    
          "options": {  
    
    
            "addressVisibility": "none"  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?operationName=changeAddressVisibility&query=mutation%20changeAddressVisibility\(%24id%3A%20ID!\)%7B%0A%20%20updateModelAddress\(id%3A%20%24id%2C%20addressVisibility%3A%20none\)%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20options%20%7B%0A%20%20%20%20%20%20%20%20%20%20addressVisibility%0A%20%20%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%20%20%22id%22%20%3A%20%22FE1FLGnch5h%22%0A%7D)

Add a Tag

Adding a Tag requires a valid floorId, which you can get by querying floors before performing an addMattertag mutation.
    
    
    mutation addTag(  
    
    
      $modelId: ID!,  
    
    
      $floorId: ID!,  
    
    
      $color: String,  
    
    
      $description: String,  
    
    
      $label: String,  
    
    
      $icon: String,  
    
    
      $keywords: [String!],  
    
    
      $enabled: Boolean!,  
    
    
      $anchorPositionX: Float!,  
    
    
      $anchorPositionY: Float!,  
    
    
      $anchorPositionZ: Float!,  
    
    
      $stemEnabled: Boolean!,  
    
    
      $stemNormalX: Float!,  
    
    
      $stemNormalY: Float!,  
    
    
      $stemNormalZ: Float!,  
    
    
      $mediaType: MattertagMediaType,  
    
    
      $mediaUrl: String,  
    
    
      $stemLength: Float!  
    
    
    ){  
    
    
      addMattertag(  
    
    
        modelId: $modelId,  
    
    
        field: id,  
    
    
        mattertag: {  
    
    
          floorId: $floorId, # Must be valid  
    
    
          enabled: $enabled, # required and can be true or false  
    
    
          color: $color,  
    
    
          label: $label,  
    
    
          icon: $icon,  
    
    
          keywords: $keywords,  
    
    
          description: $description,  
    
    
          anchorPosition: { x: $anchorPositionX, y: $anchorPositionY, z: $anchorPositionZ },  
    
    
          mediaType: $mediaType,  
    
    
          mediaUrl: $mediaUrl,  
    
    
          stemEnabled: $stemEnabled,  
    
    
          stemNormal: { x : $stemNormalX , y: $stemNormalY, z: $stemNormalZ },  
    
    
          stemLength: $stemLength  
    
    
        }  
    
    
      ) {  
    
    
        id  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : "",  
    
    
      "floorId": "pd0i1c4yq9w0y2zsb07ed23sb",  
    
    
      "color": "#03687d",  
    
    
      "label": "Updated Tag",  
    
    
      "icon": "public_symbols_video",  
    
    
      "keywords" : ["API Tag", "Test Patch Tag"],  
    
    
      "description": "This Tag was updated!",  
    
    
      "enabled" : true,  
    
    
      "anchorPositionX" : 1.20415628,  
    
    
      "anchorPositionY" : -5.3543434,  
    
    
      "anchorPositionZ" : 3.1942153,  
    
    
      "stemNormalX" : 1.0,  
    
    
      "stemNormalY" : 0.0,  
    
    
      "stemNormalZ" : 0.0,  
    
    
      "mediaType" : "video",  
    
    
      "mediaUrl" : "https://www.youtube.com/watch?v=dAdsl9x_Dyw",  
    
    
      "stemEnabled" :  true,  
    
    
      "stemLength" :  0.16459  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20addTag\(%0A%20%20%24modelId%3A%20ID!%2C%20%0A%20%20%24floorId%3A%20ID!%2C%0A%20%20%24color%3A%20String%2C%0A%20%20%24description%3A%20String%2C%0A%20%20%24label%3A%20String%2C%0A%20%20%24icon%3A%20String%2C%0A%20%20%24keywords%3A%20%5BString!%5D%2C%0A%20%20%24enabled%3A%20Boolean!%2C%0A%20%20%24anchorPositionX%3A%20Float!%2C%0A%20%20%24anchorPositionY%3A%20Float!%2C%0A%20%20%24anchorPositionZ%3A%20Float!%2C%0A%20%20%24stemEnabled%3A%20Boolean!%2C%0A%20%20%24stemNormalX%3A%20Float!%2C%0A%20%20%24stemNormalY%3A%20Float!%2C%0A%20%20%24stemNormalZ%3A%20Float!%2C%0A%20%20%24mediaType%3A%20MattertagMediaType%2C%0A%20%20%24mediaUrl%3A%20String%2C%0A%20%20%24stemLength%3A%20Float!%20%20%0A\)%7B%0A%20%20addMattertag\(%0A%20%20%20%20modelId%3A%20%24modelId%2C%0A%20%20%20%20field%3A%20id%2C%20%0A%20%20%20%20mattertag%3A%20%7B%20%0A%20%20%20%20%20%20floorId%3A%20%24floorId%2C%20%23%20Must%20be%20valid%0A%20%20%20%20%20%20enabled%3A%20%24enabled%2C%20%23%20required%20and%20can%20be%20true%20or%20false%0A%20%20%20%20%20%20color%3A%20%24color%2C%0A%20%20%20%20%20%20label%3A%20%24label%2C%0A%20%20%20%20%20%20icon%3A%20%24icon%2C%0A%20%20%20%20%20%20keywords%3A%20%24keywords%2C%0A%20%20%20%20%20%20description%3A%20%24description%2C%0A%20%20%20%20%20%20anchorPosition%3A%20%7B%20x%3A%20%24anchorPositionX%2C%20y%3A%20%24anchorPositionY%2C%20z%3A%20%24anchorPositionZ%20%7D%2C%0A%20%20%20%20%20%20mediaType%3A%20%24mediaType%2C%0A%20%20%20%20%20%20mediaUrl%3A%20%24mediaUrl%2C%0A%20%20%20%20%20%20stemEnabled%3A%20%24stemEnabled%2C%0A%20%20%20%20%20%20stemNormal%3A%20%7B%20x%20%3A%20%24stemNormalX%20%2C%20y%3A%20%24stemNormalY%2C%20z%3A%20%24stemNormalZ%20%7D%2C%20%0A%20%20%20%20%20%20stemLength%3A%20%24stemLength%0A%20%20%20%20%7D%0A%20%20\)%20%7B%0A%20%20%20%20id%0A%20%20%7D%0A%7D&operationName=addMattertag&variables=%7B%0A%20%20%22modelId%22%20%3A%20%22%22%2C%0A%20%20%22floorId%22%3A%20%22pd0i1c4yq9w0y2zsb07ed23sb%22%2C%0A%20%20%22color%22%3A%20%22%2303687d%22%2C%0A%20%20%22label%22%3A%20%22Updated%20Tag%22%2C%0A%20%20%22icon%22%3A%20%22public_symbols_video%22%2C%0A%20%20%22keywords%22%20%3A%20%5B%22API%20Tag%22%2C%20%22Test%20Tag%22%5D%2C%0A%20%20%22description%22%3A%20%22This%20Tag%20was%20updated!%22%2C%0A%20%20%22enabled%22%20%3A%20true%2C%0A%20%20%22anchorPositionX%22%20%3A%201.20415628%2C%0A%20%20%22anchorPositionY%22%20%3A%20-5.3543434%2C%0A%20%20%22anchorPositionZ%22%20%3A%203.1942153%2C%20%0A%20%20%22stemNormalX%22%20%3A%201.0%2C%0A%20%20%22stemNormalY%22%20%3A%200.0%2C%0A%20%20%22stemNormalZ%22%20%3A%200.0%2C%20%20%0A%20%20%22mediaType%22%20%3A%20%22video%22%2C%0A%20%20%22mediaUrl%22%20%3A%20%22https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdAdsl9x_Dyw%22%2C%0A%20%20%22stemEnabled%22%20%3A%20%20true%2C%0A%20%20%22stemLength%22%20%3A%20%200.16459%0A%7D%20%20)

Patch a Tag

Patching a Tag requires providing the tag Id.
    
    
    mutation patchTag(  
    
    
      $modelId: ID!,  
    
    
      $tagId: ID!  
    
    
      $floorId: ID!,  
    
    
      $color: String,  
    
    
      $description: String,  
    
    
      $label: String,  
    
    
      $icon: String,  
    
    
      $keywords: [String!],  
    
    
      $enabled: Boolean!,  
    
    
      $anchorPositionX: Float!,  
    
    
      $anchorPositionY: Float!,  
    
    
      $anchorPositionZ: Float!,  
    
    
      $stemEnabled: Boolean!,  
    
    
      $stemNormalX: Float!,  
    
    
      $stemNormalY: Float!,  
    
    
      $stemNormalZ: Float!,  
    
    
      $mediaType: MattertagMediaType,  
    
    
      $mediaUrl: String,  
    
    
      $stemLength: Float!  
    
    
    ){  
    
    
      patchMattertag(  
    
    
        modelId: $modelId,  
    
    
        field: id,  
    
    
        mattertagId: $tagId,  
    
    
        patch: {  
    
    
          floorId: $floorId, # Must be valid  
    
    
          enabled: $enabled, # required and can be true or false  
    
    
          color: $color,  
    
    
          label: $label,  
    
    
          icon: $icon,  
    
    
          keywords: $keywords,  
    
    
          description: $description,  
    
    
          anchorPosition: { x: $anchorPositionX, y: $anchorPositionY, z: $anchorPositionZ },  
    
    
          mediaType: $mediaType,  
    
    
          mediaUrl: $mediaUrl,  
    
    
          stemEnabled: 
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "cdz3fkt38kae7tapstpt0eaeb",  
    
    
                        "label": "3",  
    
    
                        "tags": [  
    
    
                            "kitchen",  
    
    
                            "living",  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 102.59071350097656,  
    
    
                            "areaFloorIndoor": 102.59071350097656,  
    
    
                            "areaWall": 184.97195434570312,  
    
    
                            "volume": 657.700927734375,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "ediidma5zg15dufx3n0qyq21a",  
    
    
                        "label": "13",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 24.611000061035156,  
    
    
                            "areaFloorIndoor": 24.611000061035156,  
    
    
                            "areaWall": 49.6417236328125,  
    
    
                            "volume": 81.93767547607422,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "xy2x8mpaaqknp7q2c3nnbw1ma",  
    
    
                        "label": "4",  
    
    
                        "tags": [  
    
    
                            "dining",  
    
    
                            "living"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 17.3887996673584,  
    
    
                            "areaFloorIndoor": 17.3887996673584,  
    
    
                            "areaWall": 46.00373458862305,  
    
    
                            "volume": 52.49049758911133,  
    
    
                            "height": 3.0186383724212646,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "2qdmc5i9byxi79ry1pxdkqzea",  
    
    
                        "label": "8",  
    
    
                        "tags": [  
    
    
                            "bedroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 15.340200424194336,  
    
    
                            "areaFloorIndoor": 15.340200424194336,  
    
    
                            "areaWall": 41.409175872802734,  
    
    
                            "volume": 57.230098724365234,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "m8npxsuk79xy21dd09x9wtped",  
    
    
                        "label": "11",  
    
    
                        "tags": [  
    
    
                            "bathroom"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.3730998039245605,  
    
    
                            "areaFloorIndoor": 4.3730998039245605,  
    
    
                            "areaWall": 15.520317077636719,  
    
    
                            "volume": 11.225411415100098,  
    
    
                            "height": 2.566923141479492,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "n81qfe51azs8iexnbqwspye6c",  
    
    
                        "label": "15",  
    
    
                        "tags": [  
    
    
                            "office"  
    
    
                        ],  
    
    
                        "dimensions": {  
    
    
                            "areaFloor": 4.414400100708008,  
    
    
                            "areaWall": 18.9549503326416,  
    
    
                            "volume": 13.287762641906738,  
    
    
                            "height": 3.0100948810577393,  
    
    
                            "units": "metric"  
    
    
                        }  
    
    
                    },  
    
    
                    {  
    
    
                        "id": "19ab05tns5h6y4qm42esqqpea",  
    
    
                        "label": "10",  
    
    
                        "tags": $stemEnabled,  
    
    
          stemNormal: { x : $stemNormalX , y: $stemNormalY, z: $stemNormalZ },  
    
    
          stemLength: $stemLength  
    
    
        }  
    
    
      ){  
    
    
        id # Returns Tag ID  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : "",  
    
    
      "tagId" : "ayi201wkujs",  
    
    
      "floorId": "pd0i1c4yq9w0y2zsb07ed23sb",  
    
    
      "color": "#03687d",  
    
    
      "label": "Updated Tag",  
    
    
      "icon" : "public_symbols_video",  
    
    
      "keywords" : ["API Tag", "Test Patch Tag"],  
    
    
      "description": "This Tag was updated!",  
    
    
      "enabled" : true,  
    
    
      "anchorPositionX" : 1.20415628,  
    
    
      "anchorPositionY" : -5.3543434,  
    
    
      "anchorPositionZ" : 3.1942153,  
    
    
      "stemNormalX" : 1.0,  
    
    
      "stemNormalY" : 0.0,  
    
    
      "stemNormalZ" : 0.0,  
    
    
      "mediaType" : "video",  
    
    
      "mediaUrl" : "https://www.youtube.com/watch?v=dAdsl9x_Dyw",  
    
    
      "stemEnabled" :  true,  
    
    
      "stemLength" :  0.16459  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20patchTag\(%0A%20%20%24modelId%3A%20ID!%2C%20%0A%20%20%24tagId%3A%20ID!%0A%20%20%24floorId%3A%20ID!%2C%0A%20%20%24color%3A%20String%2C%0A%20%20%24description%3A%20String%2C%0A%20%20%24label%3A%20String%2C%0A%20%20%24icon%3A%20String%2C%0A%20%20%24enabled%3A%20Boolean!%2C%0A%20%20%24anchorPositionX%3A%20Float!%2C%0A%20%20%24anchorPositionY%3A%20Float!%2C%0A%20%20%24anchorPositionZ%3A%20Float!%2C%0A%20%20%24stemEnabled%3A%20Boolean!%2C%0A%20%20%24stemNormalX%3A%20Float!%2C%0A%20%20%24stemNormalY%3A%20Float!%2C%0A%20%20%24stemNormalZ%3A%20Float!%2C%0A%20%20%24mediaType%3A%20MattertagMediaType%2C%0A%20%20%24mediaUrl%3A%20String%2C%0A%20%20%24stemLength%3A%20Float!%20%20%0A\)%7B%0A%20%20patchMattertag\(%0A%20%20%20%20modelId%3A%20%24modelId%2C%0A%20%20%20%20field%3A%20id%2C%20%0A%20%20%20%20mattertagId%3A%20%24tagId%2C%0A%20%20%20%20patch%3A%20%7B%20%0A%20%20%20%20%20%20floorId%3A%20%24floorId%2C%20%23%20Must%20be%20valid%0A%20%20%20%20%20%20enabled%3A%20%24enabled%2C%20%23%20required%20and%20can%20be%20true%20or%20false%0A%20%20%20%20%20%20color%3A%20%24color%2C%0A%20%20%20%20%20%20label%3A%20%24label%2C%0A%20%20%20%20%20%20icon%3A%20%24icon%2C%20%20%23%20New!%0A%20%20%20%20%20%20description%3A%20%24description%2C%0A%20%20%20%20%20%20anchorPosition%3A%20%7B%20x%3A%20%24anchorPositionX%2C%20y%3A%20%24anchorPositionY%2C%20z%3A%20%24anchorPositionZ%20%7D%2C%0A%20%20%20%20%20%20mediaType%3A%20%24mediaType%2C%0A%20%20%20%20%20%20mediaUrl%3A%20%24mediaUrl%2C%0A%20%20%20%20%20%20stemEnabled%3A%20%24stemEnabled%2C%0A%20%20%20%20%20%20stemNormal%3A%20%7B%20x%20%3A%20%24stemNormalX%20%2C%20y%3A%20%24stemNormalY%2C%20z%3A%20%24stemNormalZ%20%7D%2C%20%0A%20%20%20%20%20%20stemLength%3A%20%24stemLength%0A%20%20%20%20%7D%0A%20%20\)%7B%0A%20%20%20%20id%20%23%20Returns%20Tag%20ID%0A%20%20%7D%0A%7D&operationName=patchMatterTag&variables=%7B%0A%20%20%22modelId%22%20%3A%20%22%22%2C%0A%20%20%22tagId%22%20%3A%20%22ayi201wkujs%22%2C%0A%20%20%22floorId%22%3A%20%22pd0i1c4yq9w0y2zsb07ed23sb%22%2C%0A%20%20%22color%22%3A%20%22%2303687d%22%2C%0A%20%20%22label%22%3A%20%22Updated%20Tag%22%2C%0A%20%20%22icon%22%20%3A%20%22public_symbols_video%22%2C%0A%20%20%22description%22%3A%20%22This%20Tag%20was%20updated!%22%2C%0A%20%20%22enabled%22%20%3A%20true%2C%0A%20%20%22anchorPositionX%22%20%3A%201.20415628%2C%0A%20%20%22anchorPositionY%22%20%3A%20-5.3543434%2C%0A%20%20%22anchorPositionZ%22%20%3A%203.1942153%2C%20%0A%20%20%22stemNormalX%22%20%3A%201.0%2C%0A%20%20%22stemNormalY%22%20%3A%200.0%2C%0A%20%20%22stemNormalZ%22%20%3A%200.0%2C%20%20%0A%20%20%22mediaType%22%20%3A%20%22video%22%2C%0A%20%20%22mediaUrl%22%20%3A%20%22https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdAdsl9x_Dyw%22%2C%0A%20%20%22stemEnabled%22%20%3A%20%20true%2C%0A%20%20%22stemLength%22%20%3A%20%200.16459%0A%7D%20%20)

## Multiple Mutations as a Single Request​

GraphQL mutations send requests to our platform wherein a specific task is performed. Some tasks include simple changes to database fields, while other requests such as unarchiving a model may involve multiple tasks on our platform.

If an application needs to send multiple mutations, it may be critical that these mutations execute in a specific order to prevent race conditions. For instance, if an automation is written whereby a model is set to unlisted and then a floorplan is purchased, if two mutations are sent, the floorplan purchase request may trigger first. If the model state has not changed to 'unlisted', the request to purchase the floorplan will fail as models must be set to public or unlisted.

[Learn more about using Multiple Mutations in a request](https://graphql.org/learn/queries/#multiple-fields-in-mutations)

Activate a Model, Set it to Unlisted, Purchase a Floorplan
    
    
    mutation activateAndPurchase($modelId: ID!) {  
    
    
      updateModelState(id: $modelId, state: active) {  
    
    
        id  
    
    
        state  
    
    
      }  
    
    
      updateModelAccessVisibility(id: $modelId, visibility: public) {  
    
    
        id  
    
    
        accessVisibility  
    
    
        accessVisibilityLastChanged  
    
    
      }  
    
    
      unlockModelBundle(id: $modelId, bundleId: "floorplan:schematic",  
    
    
        options: { deliverySpeed: normal }  
    
    
      ){  
    
    
        id  
    
    
        name  
    
    
        description  
    
    
        availability  
    
    
        assets { url }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    # variables  
    
    
    {  
    
    
      "modelId" : ""  
    
    
    }  
    
    
      
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20activateAndPurchase\(%24modelId%3A%20ID!\)%20%7B%0A%20%20updateModelState\(id%3A%20%24modelId%2C%20state%3A%20active\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20state%0A%20%20%7D%0A%20%20updateModelAccessVisibility\(id%3A%20%24modelId%2C%20visibility%3A%20public\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20accessVisibility%0A%20%20%20%20accessVisibilityLastChanged%0A%20%20%7D%0A%20%20unlockModelBundle\(id%3A%20%24modelId%2C%20bundleId%3A%20%22floorplan%3Aschematic%22%2C%0A%20%20%20%20options%3A%20%7B%20deliverySpeed%3A%20normal%20%7D%0A%20%20\)%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20description%0A%20%20%20%20availability%0A%20%20%20%20assets%20%7B%20url%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=activateAndPurchase)

  * Helpful Resources
  * Testing in Sandbox Mode
  * Models Queries
  * Model Queries
  * Mutations
  * Multiple Mutations as a Single Request


