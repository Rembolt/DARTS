<!-- source: https://developers.matterport.com/sdk-changelog/ -->

On this page

Release notes and updates for the Matterport SDK.

## 26.10.4​

_October 29, 2026_

**New features**

  * [`Camera.setRotation()`](/reference/camera/#setrotation) works in Dollhouse and Floorplan views. The camera orbits around its focus point, the same way it does when a user drags. Pitch is clamped to the view's limits, and Floorplan tilts out of top-down.



**Fixes**

  * [`Conversion.worldToScreen()`](/reference/conversion/#worldtoscreen) returns the correct screen position in Floorplan view.
  * [`Renderer.takeEquirectangular()`](/reference/renderer/#takeequirectangular) applies Color Grade if set.
  * [`Pointer.setVisible()`](/reference/pointer/#setvisible), `setFadeProps()`, `editTexture()` and `resetTexture()` no longer reject with "is not a valid command" when called right after connecting.



**Types**

  * Bundle [`node.addComponent<T>()`](/reference/scene/inode/#addcomponent) can return a typed component.



* * *

## Bootstrap v3.1.0​

_October 29, 2026_

  * Security hardening. Updating is recommended: Showcase logs a console warning when an older bootstrap connects.



See [Embed SDK setup](/embed-sdk/) for the modern and legacy bootstrap.

* * *

## NPM Package 1.6.1​

_October 29, 2026_

**NPM Package**

  * Fixes "unable to connect" when your app's bundler (for example webpack) re-bundles the package.



* * *

## 26.9.4​

_September 25, 2026_

**Camera**

  * experimental [`Camera.lookAt()`](/reference/camera/#lookat) includes behavior changes and improvements.



* * *

## 26.8.2​

_August 14, 2026_

**General**

This release resolves a couple of the deep-linking friction points developers ask about most often — no workarounds required.

  * [`Link.createDeepLink()`](/reference/link/#createDeepLink) now returns a clean, shareable URL. It no longer includes the `applicationKey`, so the link opens directly with no manual cleanup on your end.
  * Opening a Showcase URL directly no longer hangs on the loading indicator. A page now waits for an SDK connection only when it's embedded (a parent frame or opener is present), so a link that still carries an `applicationKey` loads normally.



* * *

## 26.7.5​

_July 30, 2026_

**General**

  * Added [`SplatPresent`](/reference/app/#enum-Feature) and [`MeshPresent`](/reference/app/#enum-Feature) to [`App.features`](/reference/app/#features), reporting whether a Gaussian splat or mesh asset is present in the active view.



* * *

## 26.7.3​

_July 16, 2026_

**General**

  * Added a [`__metaData__`](/reference/__metadata__/) namespace containing version information for the running application and SDK.



* * *

## 26.6.2​

_June 11, 2026_

**General**

  * [`Sweep.moveTo`](/reference/sweep/#moveTo) will no longer throw when an active transition is already in progress.



* * *

## 26.6.1​

_June 4, 2026_

**General**

  * Fixed a memory leak in [`Renderer.takeScreenShot`](/reference/renderer/#takeScreenShot).
  * Fixed [`Tour.currentStep`](/reference/tour/#currentStep) emitting the previous tour's final value when a tour is restarted.



* * *

## 26.5.3​

_May 21, 2026_

**General**

  * Deprecated [`Mode.OUTSIDE`](/reference/mode/) in favor of [`Mode.PANO360`](/reference/mode/). Both resolve to the same `mode.outside` value.



* * *

  * 26.10.4
  * Bootstrap v3.1.0
  * NPM Package 1.6.1
  * 26.9.4
  * 26.8.2
  * 26.7.5
  * 26.7.3
  * 26.6.2
  * 26.6.1
  * 26.5.3


