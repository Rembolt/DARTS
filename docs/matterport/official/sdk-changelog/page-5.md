<!-- source: https://developers.matterport.com/sdk-changelog/page-5/ -->

On this page

## 24.9.3​

_September 19, 2024_

**Embed**

  * Added support for Embed SDK bootstrap v3.0.0



* * *

## 24.9.2​

_September 12, 2024_

**General**

  * Updating type file link in documentation site to automatically point to the latest version



* * *

## 24.8.3​

_August 21, 2024_

**General**

  * Added `description` to [`Model.getDetails`](/reference/)



* * *

## 24.7.4​

_July 31, 2024_

**General**

  * Added [`Tag.editPositions`](/reference/) so that numerous Tags can be edited at once.
  * For maintenance, [Scene Components](/reference/) are now under another level of hierarchy at the [Scene Object](/reference/) level, to more logically group them. There should be no noticeable change unless trying to traverse the scene graph through the parents.
  * Fixed an issue where [`Label.Event.POSITION_UPDATED`](/reference/) would not fire



* * *

## 24.7.3​

_July 24, 2024_

**General**

  * Added [`label`](/reference/) to [`RoomData`](/reference/)



* * *

## 24.6.4​

_June 26, 2024_

**General**

  * Unified dollhouse and floorplan are enabled by default:

    * Mouse interactions will be consistent between what was formerly "dollhouse" and "floorplan" mode, matching the "floorplan" mode behavior
    * For now, you can disable unified mode via the url param `disableUnifiedMode=1`, though we recommend updating your applications as soon as possible
    * Note: the Mode.current observable will now fire on mouse interaction during the transition between modes to help preserve compatibility with existing applications
  * Legacy IDs have been disabled by default. The following functions are available to convert old IDs to new IDs:

    * Conversion namespace is available for [Sweeps](/reference/), [Floors](/reference/), and [Rooms](/reference/).
    * The url param `useLegacyIds=1` allows applications to continue using the old IDs, but we strongly recommend migrating ASAP



* * *

## 24.6.2​

_June 12, 2024_

**General**

  * Improved performance of bulk tag deletion
  * Minor documentation updates



* * *

## 24.6.1​

_June 1, 2024_

**General**

  * Improved support for the new dollhouse transitions in showcase



* * *

## 24.4.3​

_April 18, 2024_

**General**

  * Fixed an issue where [`Tag.editIcon`](/reference/) could fail if [`Asset.registerTexture`](/reference/) was not called first



* * *

## 24.4.1​

_April 4, 2024_

**General**

  * Minor bug fixes



**Bundle**

  * Updated Showcase base to 24.4.1



* * *

  * 24.9.3
  * 24.9.2
  * 24.8.3
  * 24.7.4
  * 24.7.3
  * 24.6.4
  * 24.6.2
  * 24.6.1
  * 24.4.3
  * 24.4.1


