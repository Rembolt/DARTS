<!-- source: https://developers.matterport.com/api-changelog/ -->

On this page

Updates and changes to the Matterport APIs.

## 2026.02.19​

_February 19, 2026_

**Import API**

  * **Import API (Beta) launched** — Enterprise customers can now programmatically create Matterport models from E57 point cloud files. See the [Import API Overview](/api/import/overview/) to get started.



* * *

## 2025.10.20​

_October 20, 2025_

_API Changes_

  * Updated GeoCoordinate API



Updated info regarding GeoCoordinate API. Added it to Model API sub-folder. GeoCoordinates is still in closed beta and access is subject to availability. [Read More](/api/model/geocoordinates/)

* * *

## 2025.07.16​

_July 16, 2025_

_API Changes_

  * Added GeoCoordinate API



GeoCoordinates are currently in closed beta and access is subject to availability. [Read More](/api/model/geocoordinates/)

* * *

## 2025.05.01​

_May 1, 2025_

_API Changes_

  * Exposed: MeasurementPath.linetype (2D/3D)
  * Minor: Clarified that Anchor.neighbors is not all visible anchors but a subset of navigable anchors.



* * *

## 2024.11.21​

_November 21, 2024_

**Enterprise Users**

  * WebHooks v2.0 is now available with a _body_ payload that contains information about what changes have triggered the webhook event. For more information, please refer to our [Webhooks Documentation](/webhooks/).
  * For all Enterprise API users, we strongly encourage integrating WebHooks into your automation flows to improve efficiency and to enable reliable synchronization between your internal records and the content within your Matterport Account.



_API Changes_

  * _organizationId_ has been deprecated on the _addOrUpdateModelShareAccess_ and _addOrUpdateFolderShareAccess_ mutations.



* * *

## 2024.10.31​

_October 31, 2024_

**All Users**

  * Exposed AI description within *model { publication { description } } * for both single model and search queries
  * Clarified that _model { description }_ maps to the field labelled "Internal Notes" in my.matterport.com



* * *

## 2024.10.09​

_October 9, 2024_

**Enterprise Users**

  * Exposed _ceiling { maxHeight, minHeight }_ in model room dimensions



* * *

## 2024.10.01​

_October 1, 2024_

**Account API**

  * Added Custom Roles functionality



New features are documented in the [Custom Roles Overview](/api/account/custom-roles/)

* * *

## 2024.07.31​

_July 31, 2024_

**Schematic Floorplans** can now be ordered with additional options including color, furniture and a custom logo. Users can also query individual files within purchased schematic floorplan bundles.

For more information, please refer to our [Ordering Add-Ons Page](/api/model/samples/).

* * *

## 2024.07.10​

_July 10, 2024_

Minor update:

  * Remove _@beta_ from Property Intelligence API Objects



* * *

  * 2026.02.19
  * 2025.10.20
  * 2025.07.16
  * 2025.05.01
  * 2024.11.21
  * 2024.10.31
  * 2024.10.09
  * 2024.10.01
  * 2024.07.31
  * 2024.07.10


