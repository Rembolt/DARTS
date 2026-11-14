<!-- source: https://developers.matterport.com/api-changelog/page-2/ -->

On this page

## 2024.07.10​

_July 10, 2024_

**Account API**

  * Added options for direct and inherited access to _UserAccessFilter_ for objectAccess query in user.schema



As part of this change, existing filter behavior is updated. If using _FolderShares_ filter, only folders that are directly shared with the given user will be returned (previously, both direct and inherited shares will be returned as part of this filter). Similar changes are added for _ModelShares_ , _UserGroupFolderShares_ , and _UserGroupModelShares_.

* * *

## 2024.06.20​

_June 25, 2024_

Minor update:

  * Deprecated **model.visibility** in favor of **model.accessVisibility**



* * *

## 2024.04.25​

_April 25, 2024_

**Layers** are now partially exposed by Model API. Users can now query layers on any object and obtain a list of layers for any view. [Learn More](https://ghe.matterport.com/pages/matterport/showcase-sdk-site-preview/modelapi_views_and_layers.html#overview-of-layers).

**Password Protected** and **Public** (available on [Discover](https://matterport.com/discover)) visibilities can now be seen and set. Previously only private and unlisted were possible.

  * The new **accessVisibility** attribute returns _private_ , _unlisted_ , _public_ or _password_
  * The new **accessVisibilityLastChanged** attribute returns the date/time when visibility was last changed.
  * The new **updateModelAccessVisibility** mutation will allow a user to set the visibility of a space to all four visibility options as well as set passwords on password protected spaces.


    
    
    mutation UpdateModelAccessVisibility {  
    
    
        updateModelAccessVisibility(id: "RHcNJBGQyzo", visibility: password, password: "test") {  
    
    
            id  
    
    
            accessVisibility  
    
    
            accessVisibilityLastChanged  
    
    
        }  
    
    
    }  
    

A user may also now get the total number of scans with the **model.assets.sizeEstimates** attribute. This count is often used when assessing the availability or price of an add-on.
    
    
    query {  
    
    
        model(id: "qrsvVuvhfb6") {  
    
    
            assets {  
    
    
                sizeEstimates {  
    
    
                    scanCount  
    
    
                }  
    
    
            }  
    
    
        }  
    
    
    }  
    

Response:
    
    
    {  
    
    
        "data": {  
    
    
            "model": {  
    
    
                "assets": {  
    
    
                    "sizeEstimates": {  
    
    
                        "scanCount": 1  
    
    
                    }  
    
    
                }  
    
    
            }  
    
    
        }  
    
    
    }  
    

### Enterprise Only​

**folder.models** query now allows **activationStates** parameter which can be _active_ , _archived_ , _pending_ or _flagged_. Flagged models are models that are pending approval due to being captured in [unauthorized geo-blocked locations](https://support.matterport.com/s/article/Matterport-IP-restrictions).
    
    
    query Folder {  
    
    
        folder(id: "BP1w3rrfjp8") {  
    
    
            subfolders(pageSize: 100) {  
    
    
                results {  
    
    
                    name  
    
    
                    id  
    
    
                }  
    
    
            }  
    
    
            models(pageSize: 100, activationStates: archived) {  
    
    
                nextOffset  
    
    
                totalResults  
    
    
                results {  
    
    
                    state  
    
    
                    name  
    
    
                    id  
    
    
                    created  
    
    
                    description  
    
    
                    address {  
    
    
                        address  
    
    
                    }  
    
    
                    image {  
    
    
                        resizeUrl(resolution: preview)  
    
    
                    }  
    
    
                    publication {  
    
    
                        summary  
    
    
                    }  
    
    
                }  
    
    
            }  
    
    
        }  
    
    
    }  
    

* * *

## 2024.01.18​

_January 18, 2024_

**All Users**

Models can now be deleted via Model API

`deleteModel(id: ID!, field: ModelIdField): Boolean mutation is now Public`

**Enterprise Users**

This is a major revision exposing data from Property Insights. At this time, only **Enterprise** customers who have been enrolled in our beta can access the data.

The queries and mutations are available to all public API users, however _dimensionEstimates_ and the room boundary data used to generate the area estimates will only be populated for models processed after the start of November 2023.

  * **New Mutations:** addBoundaryVertex, addBoundaryEdge, addRoom, bulkPatchRoomData, patchBoundaryVertex, patchBoundaryEdge, addEdgeOpenings, removeEdgeOpenings, patchEdgeOpening, patchRoom, deleteRoomsAndBoundaryData
  * **New Queries:** Model { roomClassifications, dimensionEstimates}, ModelRoom { dimensionEstimates, boundary, holes, classifications, keywords }, ModelFloor { dimensionEstimates, vertices, edges }
  * **New Types / Inputs:** RoomClassification, Dimensions, DimensionData, DimensionPatch, DimensionDataPatch, BoundedRegion, Vertex, Edge, Opening, BoundedRegionDetails, VertexDetails, EdgeDetails, OpeningDetails, RoomDetails, RoomAssociations, RoomDataSelection
  * **New Enums:** RoomDataType, OpeningType, EdgeType



* * *

## 2023.11.15​

_November 15, 2023_

**Views** are now a part of Model API! [Documentation](https://matterport.github.io/showcase-sdk/modelapi_views_and_layers.html)

  * mutations: addView, deleteView, and copyViewData
  * queries: model.views



* * *

## 2023.08.08​

_August 8, 2023_

  * Private Model Embed (PME) no longer requires also having the OAuth feature enabled on the organization. Nothing changes from a usage perspective.



* * *

## 2023.07.20​

_July 20, 2023_

**Account API**

  * Add lastLogin field to Membership (UserMembership) type



* * *

## 2023.06.28​

_June 28, 2023_

**Account API**

  * Add UnitType enum with imperial and metric values.
  * Add unitType to Organization, OrganizationSettings and OrganizationSettingsInput types.



* * *

## 2023.05.16​

_May 16, 2023_

  * A new `BillingDetails` under model, containing exempt: Boolean and `multiSpaceUse`
    * `multiSpaceUse` is the number of spaces counted against your space quota
    * Models on Classic Accounts or that were uploaded to accounts before entering into our new billing plans will always have a `multiSpaceUse` value of 1
  * The Mutation `updateModelState` now accepts an `allowActivate` boolean which defaults to false. 
    * This must be set to true to unarchive models on accounts that would incur reactivation charges.
    * If this is unspecified or set to false on an account that would incur reactivation charges a request.unsupported error code will be returned.



* * *

## 2023.04.06​

_April 6, 2023_

  * Users with Folder API Access can now query folder paths within model queries.


    
    
    query getModelFolder {  
    
    
      model(id: $modelId) {  
    
    
        folders {  
    
    
          id  
    
    
          depth  
    
    
        }  
    
    
      }  
    
    
    }  
    

* * *

  * 2024.07.10
  * 2024.06.20
  * 2024.04.25
    * Enterprise Only
  * 2024.01.18
  * 2023.11.15
  * 2023.08.08
  * 2023.07.20
  * 2023.06.28
  * 2023.05.16
  * 2023.04.06


