<!-- source: https://developers.matterport.com/sdk-changelog/page-3/ -->

On this page

## 25.10.2​

_October 23, 2025_

**General**

  * Improved Graph interface 
    * Added the ability to [clone](/reference/graph/#cloneGraph) graphs
    * Added functions to find cycles: [findCycle](/reference/graph/#findCycle) and [findCycles](/reference/graph/#findCycles)
    * Added [findVertex](/reference/graph/idirectedgraph/#findVertex) and [filterVertices](/reference/graph/idirectedgraph/#filterVertices)
    * Added edge finding functions [findEdgeIn](/reference/graph/#findEdgeIn-function) and [findEdgeOut](/reference/graph/#findEdgeOut-function) to the Vertex type
    * Added [vertexCount](/reference/graph/idirectedgraph/#vertexCount) and [edgeCount](/reference/graph/idirectedgraph/#edgeCount)



* * *

## NPM Package 1.6.0​

_September 26, 2025_

**NPM Package**

  * Always fetches latest type definitions on install
  * Includes ESM and UMD Modules (supports require or include)
  * Can update types with `yarn update-mpsdk-types` or `npm run update-mpsdk-types`
  * Added authentication to [ConnectOptions](/reference/)



* * *

## 25.8.1​

_August 7, 2025_

**General**

  * Updated branding.



* * *

## 25.7.4​

_July 31, 2025_

**General**

  * Fixed an issue where editing a [Tag's keywords](/reference/), wouldn't trigger an update in the [Tag data](/reference/).



* * *

## 25.7.3​

_July 29, 2025_

**General**

  * Swapped position of [Tour.next()](/reference/) and [Tour.previous()](/reference/)
  * Fixed bug with added [puckPosition](/reference/).
  * Refreshed brand logo



* * *

## 25.7.1​

_July 10, 2025_

**General**

  * Added `puckPosition` to [ObservableSweepData](/reference/).
  * Defined scope of [Tag Namespace](/reference/) on layer object



* * *

## 25.6.3​

_June 26, 2025_

**General**

  * Added more examples of `.waitUntil` to [ObservableMap](/reference/) and [Observable](/reference/).
  * Added [EulerAngle](/reference/) type to disambiguate



* * *

## 25.6.1​

_June 12, 2025_

**General**

  * Added `.waitUntil` to [ObservableMap](/reference/).
  * Added [Conversion routines](/reference/) to convert coordinates (Vector) and rotations (Quaternion) between SDK and Platform API.
  * Added `iconId` to [TagData](/reference/).
  * Fixed a [Layer toggling](/reference/) bug where the behavior was inverted: `true` now shows, `false` now hides.
  * Fixed an issue where Tag.attachments wouldn't provide its initial state.



* * *

## 25.4.4​

_April 24, 2025_

**General**

  * Fixed issues with [Tag.keywords](/reference/) so it behaves more array-like 
    * `length` now properly returns the length of the array
    * can now get and set values by index



* * *

## 25.4.3​

_April 17, 2025_

**General**

  * Improvement: Resolved race condition from early access to Measurements mode



* * *

  * 25.10.2
  * NPM Package 1.6.0
  * 25.8.1
  * 25.7.4
  * 25.7.3
  * 25.7.1
  * 25.6.3
  * 25.6.1
  * 25.4.4
  * 25.4.3


