<!-- source: https://developers.matterport.com/api/model/queries/ -->

On this page

Model API features two main queries -- **models** and **model**. The models query is essentially a search-engine, whereas the model query retrives information from a singular model - directly.

Learning to build powerful models queries can lead to efficient application design and will provide greater insights into the models in your account.

### Models Schema​

The models query has 5 optional parameters that will allow you to fine tune the returned data.

Leaving all of these blank will result in a list of **10** active models sorted by **created_time** in descending order.
    
    
    query {  
    
    
      models(  
    
    
        include: [SearchInclusion!],  
    
    
        query: String,  
    
    
        sortBy: [ModelSort!],  
    
    
        pageSize: Int,  
    
    
        offset: String  
    
    
      ): ModelSearchResultList  
    
    
    }  
    

argument| required?| default| values| `include`| no| | demo, inactive| `query`| no| *| * for all. [ES Syntax](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl-query-string-query#query-string-syntax)| `sortBy`| no| `[{field: created_time, order: desc}]`| | `pageSize`| no| 10| 1 - 1000| `offset`| no| null| Any value returned from the nextOffset from the previous result  
---|---|---|---  
  
The results of the models() query will return **totalResults** , **nextOffset** (if totalResults > pageSize), and the results. You can use the **nextOffset** in a subsequent **models()** query.
    
    
    type ModelSearchResultList {  
    
    
      nextOffset: String  
    
    
      totalResults: Int!  
    
    
      results: [ModelSearchResult!]  
    
    
    }  
    

For a complete list of fields returned in 'results', [click here](https://static.matterport.com/api-doc/2023.04.4-main-gdf30203/reference/graphdoc/model/modelsearchresult.doc)

## Building Powerful _query_ strings​

Any field defined in **`ModelSearchResult`** may be included as a keyword in the models query.

For example "`name: Demo`" would search for models with the word Demo in the name. A search for "`mattertags.labels: kitchen`" would search for any models that have at least one mattertag with the word kitchen in the label.

## Sample Queries​

Find all the models in Lawrence, KS:
    
    
    query {  
    
    
      models (query: "address.locality:\"Lawrence\" AND address.administrativeArea: \"KS\"") {  
    
    
        totalResults  
    
    
        nextOffset  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    

Find all the models with at least one unplaced sweeps
    
    
    query {  
    
    
      models (query: "assets.panoLocations.placement: \"UNPLACED\"") {  
    
    
        totalResults  
    
    
        nextOffset  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    

Find all the models edited since Oct 10th that have at least one measurement:
    
    
    query {  
    
    
      models (query: "modified:[2019-10-10 TO *] AND measurements.count:[1 TO *]") {  
    
    
        totalResults  
    
    
        nextOffset  
    
    
        results {  
    
    
          id  
    
    
          name  
    
    
        }  
    
    
      }  
    
    
    }  
    

## Searchable Fields​

Field| Default| Type| id| *| | internalId| *| | created| *| DateTime| modified| *| DateTime| name| *| Text| description| *| Text| visibility| *| public, private| demo| false| true, false| address| *| Text| address.streetAddressLines| Y| Text| address.administrativeArea| Y| Text| address.locality| Y| Text| address.dependentLocality| Y| Text| address.countryName| Y| Text| address.postalCode| N| Keyword| address.countryCode| **| Keyword| geolocation| N| Geo-Point| floors.count| N| Integer| floors.tags| Y| Set Keyword| rooms.count| N| Integer| rooms.label| Y| Text| rooms.tags| Y| Set Keyword| mattertags.count| N| Integer| mattertags.label| Y| Set Text| mattertags.description| Y| Set Text| mattertags.mediaType| Y| Set Keyword| measurements.count| N| Integer| measurements.label| Y| Set Text| mls.id| Y| Text| mls.name| Y| Text| assets.panos.count| N| Integer| assets.panos.format| N| Set Keyword| assets.panos.resolution| N| Set Keyword| assets.clips.count| N| Integer| assets.clips.format| N| Set Keyword| assets.clips.label| Y| Set Text| assets.photos.count| N| Integer| assets.photos.format| N| Set Keyword| assets.photos.label| Y| Set Text| assets.photos.resolutions| N| Set Keyword| assets.meshes.count| N| Integer| assets.meshes.format| N| Set Keyword| assets.textures.count| N| Integer| assets.textures.format| N| Set Keyword| assets.locations.count| N| Integer| assets.locations.tags| Y| Set Keyword| assets.panoLocations.count| N| Integer| assets.panoLocations.placement| N| Set Keyword| assets.panoLocations.variant| N| Set Keyword  
---|---|---  
  
  * Models Schema
  * Building Powerful _query_ strings
  * Sample Queries
  * Searchable Fields


