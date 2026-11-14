<!-- source: https://developers.matterport.com/api/model/geocoordinates/ -->

On this page

note

Geo Coordinates Data in Model API is only available for Enterprise-level Matterport Subscriptions and is currently in beta at this time.

## Introduction​

Our **Geo Coordinates** lets you map a Matterport 3D model to real-world locations using latitude, longitude, and altitude. This is useful for aligning your model with Geo Coordinates data, especially in outdoor or large-scale environments.

## How it works​

Matterport uses a special point inside the model called the **GeoAnchor Point**. This point is usually the **centroid** of the model, chosen by our vision pipeline (Note: Centroid is different from the origin `0, 0, 0`).

The API provides a `translation` value that shows how far the GeoAnchor Point is from the origin. If you want to align the GeoAnchor Point with the origin, set `translation` to `{ x: 0, y: 0, z: 0 }`.

## What you can do​

With the GeoCoordinates API, you can:

  * Get the Geo Coordinates of a model.
  * Convert a point in the model to Geo Coordinates.
  * Convert Geo Coordinates to a point in the model.
  * Patch or reset the GeoAnchor Point for a model.



## Sample Queries​

Get the Geo Coordinates (GeoAnchor Point) of a model
    
    
    query getGeoCoordinates($modelId: ID!) {  
    
    
      model(id: $modelId) {  
    
    
        id  
    
    
        geocoordinates {  
    
    
            ... GeoCoordinateFragment  
    
    
        }  
    
    
      }  
    
    
    }  
    
    
      
    
    
    fragment GeoCoordinateFragment on GeoCoordinate {  
    
    
      source  
    
    
      altitude  
    
    
      latitude  
    
    
      longitude  
    
    
      translation { x y z }  
    
    
      rotation { x y z w }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": "[YOUR MODEL ID]"  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "id": "DpFVgQXVTmD",  
    
    
          "geocoordinates": {  
    
    
            "source": "processing",  
    
    
            "altitude": 0,  
    
    
            "latitude": 33.276006298034105,  
    
    
            "longitude": -96.80354127176122,  
    
    
            "translation": {  
    
    
              "x": 0.3076627708815243,  
    
    
              "y": 3.3566522639732987,  
    
    
              "z": 0  
    
    
            },  
    
    
            "rotation": {  
    
    
              "x": 0,  
    
    
              "y": 0,  
    
    
              "z": -0.3681099881862502,  
    
    
              "w": 0.929782252249159  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getGeoCoordinates\(%24modelId%3A%20ID!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20geocoordinates%20%7B%0A%20%20%20%20%20%20%20%20...%20GeoCoordinateFragment%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%0Afragment%20GeoCoordinateFragment%20on%20GeoCoordinate%20%7B%0A%20%20source%0A%20%20altitude%0A%20%20latitude%0A%20%20longitude%0A%20%20translation%20%7B%20x%20y%20z%20%7D%0A%20%20rotation%20%7B%20x%20y%20z%20w%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D)

Convert a point in the model to Geo Coordinates

Sample Query:
    
    
    query getGeoCoordinatesOf($modelId: ID!, $point: IPoint3D!) {  
    
    
      model(id: $modelId) {  
    
    
        id  
    
    
        geocoordinates {  
    
    
          geoLocationOf(modelLocation: $point) {  
    
    
              lat  
    
    
              long  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": "[YOUR MODEL ID]]",  
    
    
      "point": {  
    
    
        "x": 3.11,  
    
    
        "y": 3.14,  
    
    
        "z": 5.4  
    
    
      }  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "id": "[YOUR MODEL ID]]",  
    
    
          "geocoordinates": {  
    
    
            "geoLocationOf": {  
    
    
              "lat": "33.27603743078501",  
    
    
              "long": "-96.8034845051858"  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getGeoCoordinatesOf\(%24modelId%3A%20ID!%2C%20%24point%3A%20IPoint3D!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20geocoordinates%20%7B%0A%20%20%20%20%20%20geoLocationOf\(modelLocation%3A%20%24point\)%20%7B%0A%20%20%20%20%20%20%20%20%20%20lat%0A%20%20%20%20%20%20%20%20%20%20long%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%2C%0A%20%20%22point%22%3A%20%7B%0A%20%20%20%20%22x%22%3A%204%2C%0A%20%20%20%20%22y%22%3A%203%2C%0A%20%20%20%20%22z%22%3A%201%0A%20%20%7D%0A%7D)

Convert Geo Coordinates to a point in the model

Sample Query:
    
    
    query getModelLocationOf($modelId: ID!, $lat: Float!, $lon: Float!) {  
    
    
      model(id: $modelId) {  
    
    
        id  
    
    
        geocoordinates {  
    
    
          modelLocationOf(  
    
    
              latitude: $lat,  
    
    
              longitude: $lon,  
    
    
          ) { x y z }  
    
    
        }  
    
    
      }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": "[YOUR MODEL ID]",  
    
    
      "lat": 33.27603743078501,  
    
    
      "lon": -96.8034845051858  
    
    
    }  
    

Sample Response:
    
    
    {  
    
    
      "data": {  
    
    
        "model": {  
    
    
          "id": "[YOUR MODEL ID]",  
    
    
          "geocoordinates": {  
    
    
            "modelLocationOf": {  
    
    
              "x": 3.5507595647023336,  
    
    
              "y": 3.4784207745132183,  
    
    
              "z": -0.0000031264498829841614  
    
    
            }  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=query%20getModelLocationOf\(%24modelId%3A%20ID!%2C%20%24lat%3A%20Float!%2C%20%24lon%3A%20Float!\)%20%7B%0A%20%20model\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20id%0A%20%20%20%20geocoordinates%20%7B%0A%20%20%20%20%20%20modelLocationOf\(%0A%20%20%20%20%20%20%20%20%20%20latitude%3A%20%24lat%2C%0A%20%20%20%20%20%20%20%20%20%20longitude%3A%20%24lon%2C%0A%20%20%20%20%20%20\)%20%7B%20x%20y%20z%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%5BYOUR%20MODEL%20ID%5D%22%2C%0A%20%20%22lat%22%3A%2033.27603743078501%2C%0A%20%20%22lon%22%3A%20-96.8034845051858%0A%7D&operationName=getModelLocationOf)

## Sample Mutations​

note

To ensure the integrity of the provided data, patched values do not remove the original data. We have provided a reset mutation to allow customer's to restore provided GeoCoordinate data.

Patch the GeoAnchor Point for a model

Sample Query:
    
    
    mutation patchGeoCoordinates(  
    
    
        $modelId: ID!  
    
    
        $altitude: Float  
    
    
        $latitude: Float  
    
    
        $longitude: Float  
    
    
        $translation: IPoint3D  
    
    
        $rotation: IQuaternion  
    
    
    ) {  
    
    
        patchModelGeoCoordinates(  
    
    
          id: $modelId,  
    
    
          altitude: $altitude,  
    
    
          latitude: $latitude,  
    
    
          longitude: $longitude,  
    
    
          translation: $translation,  
    
    
          rotation: $rotation  
    
    
        ) {  
    
    
            ... GeoCoordinateFragment  
    
    
        }  
    
    
    }  
    
    
    fragment GeoCoordinateFragment on GeoCoordinate {  
    
    
      source  
    
    
      altitude  
    
    
      latitude  
    
    
      longitude  
    
    
      translation { x y z }  
    
    
      rotation { x y z w }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": "",  
    
    
      "altitude": 0,  
    
    
      "latitude": 0,  
    
    
      "longitude": 0,  
    
    
      "translation": { "x": 0, "y": 0, "z": 0 },  
    
    
      "rotation": { "x": 0, "y": 0, "z": 0, "w": 0 }  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=mutation%20patchGeoCoordinates\(%0A%20%20%20%20%24modelId%3A%20ID!%0A%20%20%20%20%24altitude%3A%20Float%0A%20%20%20%20%24latitude%3A%20Float%0A%20%20%20%20%24longitude%3A%20Float%0A%20%20%20%20%24translation%3A%20IPoint3D%0A%20%20%20%20%24rotation%3A%20IQuaternion%0A\)%20%7B%0A%20%20%20%20patchModelGeoCoordinates\(%0A%20%20%20%20%20%20id%3A%20%24modelId%2C%0A%20%20%20%20%20%20altitude%3A%20%24altitude%2C%0A%20%20%20%20%20%20latitude%3A%20%24latitude%2C%0A%20%20%20%20%20%20longitude%3A%20%24longitude%2C%0A%20%20%20%20%20%20translation%3A%20%24translation%2C%0A%20%20%20%20%20%20rotation%3A%20%24rotation%0A%20%20%20%20\)%20%7B%0A%20%20%20%20%20%20%20%20...%20GeoCoordinateFragment%0A%20%20%20%20%7D%0A%7D%0Afragment%20GeoCoordinateFragment%20on%20GeoCoordinate%20%7B%0A%20%20source%0A%20%20altitude%0A%20%20latitude%0A%20%20longitude%0A%20%20translation%20%7B%20x%20y%20z%20%7D%0A%20%20rotation%20%7B%20x%20y%20z%20w%20%7D%0A%7D&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%2C%0A%20%20%22altitude%22%3A%200%2C%0A%20%20%22latitude%22%3A%200%2C%0A%20%20%22longitude%22%3A%200%2C%0A%20%20%22translation%22%3A%20%7B%20%22x%22%3A%200%2C%20%22y%22%3A%200%2C%20%22z%22%3A%200%20%7D%2C%0A%20%20%22rotation%22%3A%20%7B%20%22x%22%3A%200%2C%20%22y%22%3A%200%2C%20%22z%22%3A%200%2C%20%22w%22%3A%200%20%7D%0A%7D&operationName=patchGeoCoordinates)

Reset the GeoAnchor Point for a model.

Sample Mutation:
    
    
      
    
    
    mutation resetGeoCoordinates(  
    
    
        $modelId: ID!  
    
    
    ) {      
    
    
        resetModelGeoCoordinates(id: $modelId) {  
    
    
            ... GeoCoordinateFragment  
    
    
        }  
    
    
    }  
    
    
      
    
    
    fragment GeoCoordinateFragment on GeoCoordinate {  
    
    
      source  
    
    
      altitude  
    
    
      latitude  
    
    
      longitude  
    
    
      translation { x y z }  
    
    
      rotation { x y z w }  
    
    
    }  
    

Variable Arguments:
    
    
    {  
    
    
      "modelId": ""  
    
    
    }  
    

[Try this query in our interactive console](https://api.matterport.com/api/graphiql/?query=%0Amutation%20resetGeoCoordinates\(%0A%20%20%20%20%24modelId%3A%20ID!%0A\)%20%7B%20%20%20%20%0A%20%20%20%20resetModelGeoCoordinates\(id%3A%20%24modelId\)%20%7B%0A%20%20%20%20%20%20%20%20...%20GeoCoordinateFragment%0A%20%20%20%20%7D%0A%7D%0A%0Afragment%20GeoCoordinateFragment%20on%20GeoCoordinate%20%7B%0A%20%20source%0A%20%20altitude%0A%20%20latitude%0A%20%20longitude%0A%20%20translation%20%7B%20x%20y%20z%20%7D%0A%20%20rotation%20%7B%20x%20y%20z%20w%20%7D%0A%7D%0A&variables=%7B%0A%20%20%22modelId%22%3A%20%22%22%0A%7D&operationName=resetGeoCoordinates)

  * Introduction
  * How it works
  * What you can do
  * Sample Queries
  * Sample Mutations


