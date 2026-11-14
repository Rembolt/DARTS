<!-- source: https://developers.matterport.com/sdk-changelog/page-4/ -->

On this page

## 25.4.2​

_April 10, 2025_

**General**

  * Improvement: Updated floor inference algorithm used by Tag.add
  * Fixed an issue where some layers wouldn't be included in a view's `layers` list.



* * *

## 25.4.1​

_April 3, 2025_

**General**

  * Fixed an issue where SVG Images loaded with loaded via [`Asset.registerTexture`](/reference/) could have incorrect color profiles.
  * Fixed an issue where removing a layer from a view would require multiple [`removeLayer`](/reference/) calls



* * *

## 25.3.4​

_March 27, 2025_

**General**

  * Added [`View.type`](/reference/) and [`Layer.type`](/reference/)
  * Automatically exposing Defurnish view when available
  * Added an option to [`View.createLayer`](/reference/) to create common Layers (a Layer in all Views)
  * Added [`View.deleteLayer`](/reference/) to delete previously created layers



* * *

## 25.2.2​

_February 13, 2025_

**General**

  * Upgraded internal THREE.js version to 0.171.0
  * Added [`Tag.enabled`](/reference/)



* * *

## 25.1.1​

_January 15, 2025_

**General**

  * Added CORS support via the `?applicationKey` url parameter on the sdk bootstrap (sdk.es6.js) to support import map



See [the Embed quick start](/embed-sdk/quickstart/) for setup instructions.

* * *

## 24.12.3​

_December 18, 2024_

_General_

  * Added: [Tag.Add](/reference/) now supports keywords (`keywords: string[]`) 
    * [Keywords](/reference/) on the returned TagData object is a JavaScript array.
    * Directly mutate with standard Array methods - e.g. `tag.keywords.push('bar')`, `tag.keywords.splice(0,1)`
  * Updated: [Tour.CurrentStepData](/reference/) now includes `index`
  * Improvement: Improved type definitions for [ISource.type](/reference/)



* * *

## 24.11.2​

_November 14, 2024_

**General**

  * Made applying an icon to a Tag more consistent when using [Tag.add](/reference/).



* * *

## 24.10.2​

_October 23, 2024_

**Webcomponent**

  * Remove extra blue alert bar when there is no alert



* * *

## 24.10.1​

_October 9, 2024_

**General**

  * Removed legacy IDs as a default option 
    * The `&useLegacyIds=1` parameter has been removed.
    * Conversion routines under the [Floor](/reference/), [Room](/reference/), and [Sweep](/reference/) namespaces are still available if legacy IDs are needed.
  * Fixed an issue where [`Room.current`](/reference/) and [`Room.data`](/reference/) would never fire updates.



* * *

## Bootstrap v3.0.0​

_September 20, 2024_

  * Support for OAuth and PME using the Showcase Embed SDK, see the [OAuth guide](/oauth/private-model/)



This bootstrap update comes in two varieties: modern with support for import/export syntax, and legacy supporting class `window.MP_SDK` syntax. See [the Embed quick start](/embed-sdk/quickstart/) for setup instructions of the modern bootstrap. Links:

  * [modern](https://static.matterport.com/showcase-sdk/bootstrap/3.0.0-0-g0517b8d76c/sdk.es6.js)
  * [legacy](https://static.matterport.com/showcase-sdk/bootstrap/3.0.0-0-g0517b8d76c/sdk.js)



* * *

  * 25.4.2
  * 25.4.1
  * 25.3.4
  * 25.2.2
  * 25.1.1
  * 24.12.3
  * 24.11.2
  * 24.10.2
  * 24.10.1
  * Bootstrap v3.0.0


