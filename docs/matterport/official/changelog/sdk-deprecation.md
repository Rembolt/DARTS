<!-- source: https://developers.matterport.com/changelog/sdk-deprecation/ -->

On this page

## Deprecation Notice​

**Important: Deprecation Notice for Older SDK Versions**

We are announcing the deprecation of the older Matterport SDK versions, specifically the Bundle, Web Component, and R3F packages. Support for these packages will tentatively end on January 12, 2026. Users should transition to the latest SDK versions before this deadline.

### Why is this happening​

In an effort to advance and optimize the Matterport offering, we are deprecating several older APIs. Once these underlying APIs are shut down, these outdated versions of our SDK will stop functioning, likely causing breaking changes or complete service failure in your application.

### What you need to do​

To ensure your application continues to work without interruption, and to optimize your Matterport experience, you must upgrade any of these SDKs. Our tentative deprecation date is Jan 12, 2026.

The latest versions are not only compatible with our new APIs, but also include significant improvements in performance, security, and features.

### We're here to help​

We understand that updates require development time. If you have any technical questions, run into issues during the migration, or are unsure which SDKs your application is using, please contact our developer support team for assistance at [developer@matterport.com](mailto:developer@matterport.com)

* * *

## Deprecation History​

### 24.10.1​

**Oct 9, 2024**

  * Removed legacy IDs as a default option 
    * The `&useLegacyIds=1` parameter has been removed.
    * Conversion routines under the [Floor](/reference/floor/conversion/), [Room](/reference/room/conversion/), and [Sweep](/reference/sweep/conversion/) namespaces are still available if legacy IDs are needed.



### 22.10.2​

**Oct 13, 2022**

  * Removed deprecated Tag namespace functions



### 22.10.1​

**Oct 4, 2022**

  * Tags 2.0 Early Access is now considered Generally Available
  * Any features in the Tag namespace marked deprecated will be removed in the next release



### 22.3.1​

**Mar 11, 2022**

  * [INode.bind](/reference/scene/icomponent/#bind) now has the correct type. This function is deprecated.



### 20.12.3​

**Dec 21, 2020**

  * Added: [Floor.data](/reference/floor/#data) observable collection, deprecated `Floor.getData`



### 20.12.1​

**Dec 1, 2020**

  * Added: `Mattertag.data` observable collection, deprecated `Mattertag.getData`



### 19.12.1​

**Dec 9, 2019**

  * **Synchronous Functions** : We are adding support for synchronous functions. These functions compute and return your data immediately, no promise involved. In general, synchronous functions are more performant since they don't directly interact with the showcase. Use them when you can. To start, we have selected a function that is called frequently `Renderer.getScreenPosition()`. This function is now being deprecated, and the new synchronous function is `Renderer.worldToScreen()`.
  * Deprecating `window.SHOWCASE_SDK`, use `window.MP_SDK` instead.



### 19.8.1​

**Aug 22, 2019**

  * `Camera.getPose()` is now deprecated. It will be removed in a future update.



  * Deprecation Notice
    * Why is this happening
    * What you need to do
    * We're here to help
  * Deprecation History
    * 24.10.1
    * 22.10.2
    * 22.10.1
    * 22.3.1
    * 20.12.3
    * 20.12.1
    * 19.12.1
    * 19.8.1


