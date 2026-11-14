<!-- source: https://developers.matterport.com/sdk-changelog/page-2/ -->

On this page

## 26.4.4​

_April 24, 2026_

**Measurements**

  * Measurements are now Layer-aware: [`View.Layer`](/reference/view/layer/) now exposes a `Measurements` property that provides access to [`add`](/reference/measurements/#add) and [`remove`](/reference/measurements/#remove), allowing measurements to be scoped to a specific Layer rather than the global space



* * *

## 26.4.2​

_April 8, 2026_

**Measurements**

  * Added `temporary` and `type` accessors to [`MeasurementModeData`](/reference/measurements/measurementmodedata/)



**Scene**

  * Improved raycasting performance for SDK Scene objects by computing BVH on inserted meshes



* * *

## 26.3.4​

_March 26, 2026_

**General**

  * Added [Measurements.add](/reference/measurements/) to add one or more measurements
  * Added the ability to update [Measurements'](/reference/measurements/measurementmodedata/) labels 
    * Setting a measurement's [label](/reference/measurements/measurementmodedata/#label) directly will update it
    * Example: `measurement.label = "new Label"`
  * Added the ability to update [Measurements'](/reference/measurements/measurementmodedata/) points 
    * Setting a measurement's [points](/reference/measurements/measurementmodedata/) directly will update the rendered measurement
    * All built-in Array functions are supported
    * Examples: 
      * `measurement.points[0] = {x, y, z}`
      * `measurement.points.push({x, y, z})`
      * `measurement.points.splice(1, 1)`



* * *

## 26.3.3​

_March 19, 2026_

**General**

  * Added [Measurements.remove](/reference/measurements/) (experimental) to remove one or more measurements
  * Added `id` property to [MeasurementData](/reference/measurements/#type-MeasurementData) as a unique identifier for measurements
  * Deprecated [Measurements.getData](/reference/measurements/#getData) in favor of [Measurements.data](/reference/measurements/#data)



* * *

## 26.3.2​

_March 12, 2026_

**Bundle**

  * Added synchronous access to THREE.js through [`Scene.THREE`](/reference/scene/#THREE)



* * *

## 26.3.1​

_March 5, 2026_

**General**

  * The SDK connector now retries failed connections, improving reliability in unstable network conditions



* * *

## 26.2.3​

_February 19, 2026_

**General**

  * Added [View.View.revert](/reference/view/view/#revert) to remove all transient layers and object edits from a view
  * Added [Camera.lookAt](/reference/camera/) (experimental) to move the camera to look at a specific 3D world position



* * *

## 26.1.3​

_January 22, 2026_

**General**

  * fix: [Link.setModelLinkPolicy](/reference/link/#setModelLinkPolicy) templateHref will now honor all parameters as documented.
  * fix: Race condition with [Asset.registerTexture](/reference/asset/#registerTexture) which requires awaiting



* * *

## 25.12.2​

_December 11, 2025_

**General**

  * Created [Camera.TransitionType](/reference/camera/#enum-TransitionType) as an eventual replacement for various Enums: 
    * [Mode.moveTo](/reference/mode/#moveTo)() [options](/reference/mode/#type-MoveToModeOptions) argument - replacing TransitionType
    * [Sweep.moveTo](/reference/sweep/#moveTo)() [options](/reference/sweep/#type-MoveToOptions) argument - replacing Transition
    * [Mattertag.navigateToTag](/reference/mattertag/#navigateToTag)() `transition` argument - replacing Transition
  * Removed the upper limit on the zoom level option for [Mode.moveTo](/reference/mode/#moveTo) to support larger spaces



* * *

## 25.12.1​

_December 4, 2025_

**Performance**

  * Improved performance of Sweep.data by avoiding superfluous updates when transitioning between sweeps.



* * *

  * 26.4.4
  * 26.4.2
  * 26.3.4
  * 26.3.3
  * 26.3.2
  * 26.3.1
  * 26.2.3
  * 26.1.3
  * 25.12.2
  * 25.12.1


