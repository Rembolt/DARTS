<!-- source: https://developers.matterport.com/api/property-intelligence/mutations/ -->

On this page

note

Property Intelligence Data in Model API is only available for Enterprise-level Matterport Subscriptions

## Mutations​

Mutations can add, update and remove boundary vertexes, boundary edges and rooms. These features provide the ability for external software to be created to synchronize changes between our platform and yours.

**Mutation**| **Description**|  addBoundaryVertex| Create a vertex to add to a bounded region| addBoundaryEdge| Create a boundary edge to add to a bounded region| addRoom| Create a new room| bulkPatchRoomData| Make multiple updates to room dimensional data and annotation/location associations| patchBoundaryVertex| Update a bounded region vertex and impacted room data.| patchBoundaryEdge| Update a bounded region edge and impacted room data.| addEdgeOpenings| Create an opening on an existing boundary edge.| removeEdgeOpenings| Delete specified openings from a boundary edge.| patchEdgeOpening| Update the details of an opening on a boundary edge.| patchRoom| Update the details of a room| deleteRoomsAndBoundaryData| Delete rooms and their bounded regions.  
---|---  
  
The **deleteRoomsAndBoundaryData** mutation can leave room boundaries in a non-closed state. Affected room and overall floor dimensional data and associated annotations will not be updated until a patchRoom is called to close them again.

## Property Insights and Layers​

Several Mutations contain an optional field for **layerId**. This field will integrate with our forthcoming support of layers within Model API. As an optional field, if it is left blank, it will default to updating room boundary data on the base layer, which is what is currently available in Edit Mode.

## Learn More​

To learn more about the available mutations and the data that can be added, patched or delete, please refer to our [reference guide](https://api.matterport.com/docs/reference).

  * Mutations
  * Property Insights and Layers
  * Learn More


