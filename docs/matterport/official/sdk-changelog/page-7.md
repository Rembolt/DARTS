<!-- source: https://developers.matterport.com/sdk-changelog/page-7/ -->

On this page

## 23.9.1​

_September 20, 2023_

**General**

  * Added conversion routines to convert between legacy and current id schemes for [Sweeps](/reference/), [Floors](/reference/), and [Rooms](/reference/).
  * Added more data to [measurements data](/reference/) including human readable labels, total lengths, and segment lengths.
  * Added a method to open links to other Matterport spaces directly instead of loading them in the current application (see: [`Link.setModelLinkPolicy`](/reference/)).
  * Added `fontId` containing the custom icon set on a Tag by Workshop (see: [`Tag.TagData`](/reference/)).



**Bundle**

  * Fixed an issue where large-sized meshes could be clipped by Showcase's skybox.



* * *

## 23.8.2​

_August 31, 2023_

**General**

  * Disabling navigation via [Tag.allowAction](/reference/) prevents the tag from showing up in overlay navigation UI



* * *

## 23.8.1​

_August 16, 2023_

**General**

  * Fix issues with Link [OpenPolicyOptions](/reference/) interpolation.
  * Minor updates to examples in types for [Link](/reference/) and [Tag](/reference/).
  * Fix for missing application key when linking between models
  * Safari: fixes for power-of-two texture resizing and minor memory leak
  * Fixed issues with dollhouse/floorplan mesh texture streaming
  * Improved mesh quality for small spaces



**Bundle**

  * Updated Three.js to r151



* * *

## 23.6.2​

_June 29, 2023_

**General**

  * Cleaned up [Mode.Mode enum](/reference/) and removed unsupported values.



* * *

## 23.6.1​

_June 15, 2023_

**General**

  * Fixed an issue that could falsely change the value of [`Measurements.mode`](/reference/).
  * Enabled Views by default. For more information see [View](/reference/view/).



**Early Access**

  * Added [`View.current`](/reference/) to observe which view is active and when it changes.
  * Added [`View.views`](/reference/) to enumerate all views currently associated with the space.



* * *

## 23.5.1​

_May 18, 2023_

**General**

  * improved zooming and panning in Dollhouse mode



* * *

## 23.4.2​

_May 4, 2023_

**General**

  * Added a "sharing" option to [`Tag.allowAction`](/reference/) to show or hide the share button on specific tags.
  * Added the ability to toggle settings with respect to the dock ([`Tag.toggleDocking`](/reference/)) and share ([`Tag.toggleSharing`](/reference/)) buttons in Tags.
  * Updated share links in Tags to follow the rules set by the Link namespace.



* * *

## 23.4.1​

_April 20, 2023_

**General**

  * Fixed Showcase crashes in Safari 16.4+ related to non-power-of-two textures



* * *

## 23.3.3​

_April 11, 2023_

**General**

  * Fixed an issue where [`Mattertag.preventAction`](/reference/) would always disable docking. Since the option is not supported, the docking option is left as is.



**Bundle**

  * Added the ability to enable, disable, and trigger events and emits from [EventPaths](/reference/) and [EmitPaths](/reference/)



* * *

## 23.3.2​

_March 16, 2023_

note

Tags 2.0 is now the only available option for displaying Mattertags/Tags

**General**

  * All of 23.3.1 fixes are now available for the Embed SDK
  * Fixed the ability to have wide [Tag Sandboxes](/reference/). Providing a width greater than 350px will allot a wider Tag billboard instead of truncating the Sandbox.



* * *

  * 23.9.1
  * 23.8.2
  * 23.8.1
  * 23.6.2
  * 23.6.1
  * 23.5.1
  * 23.4.2
  * 23.4.1
  * 23.3.3
  * 23.3.2


