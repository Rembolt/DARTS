<!-- source: https://developers.matterport.com/sdk-changelog/page-6/ -->

On this page

## 24.3.1​

_March 13, 2024_

**General**

  * Fixed an error with bundle erroneously trying to load plugins
  * Updated return type for [`IObservable.waitUntil`](/reference/)



* * *

## 24.2.2​

_February 22, 2024_

**General**

  * Stability and bug fixes



* * *

## 24.2.1​

_February 14, 2024_

**General**

  * Fixed an issue where [Conversion.worldToScreen](/reference/) would return negative values whenever the input's z coordinate was also negative.
  * Fixed an issue where [Room.current](/reference/) could throw errors when encountering invalid room data.



* * *

## 24.1.2​

_January 31, 2024_

**General**

  * Fixed various cases where transient Tags created through the SDK were mapped to the wrong View



* * *

## 24.1.1​

_January 18, 2024_

**General**

  * Added the ability to set a Tag's icon to one from Matterport's Tag icon pack using the existing [`Tag.editIcon`](/reference/tag/).
  * Added a [`.toggled`](/reference/) state on each Layer
  * Added an option to return to the start location when switching Views using [`View.setActive`](/reference/).
  * Fixed various cases where transient Tags created through the SDK could be added to the wrong Layer.



* * *

## 23.12.1​

_December 13, 2023_

**General**

  * Documented that enabling effect composer in [scene configuration](/reference/) disables antialiasing
  * Fixed an issue where a Tag would not open on mobile when the Tag's navigation was disabled
  * Added a [force option](/reference/) to the legacy method `Mattertag.navigateToTag`
  * Changed iteration of the [collection of Tags](/reference/) to be in the same order as the UI when editing the space



* * *

## 23.11.1 hot fix 1​

_November 20, 2023_

**General**

  * Fixed SDK connection failures when Views and Layers are unsupported.



* * *

## 23.11.1​

_November 16, 2023_

**General**

  * Fixed [`Tag.toggleSharing`](/reference/) to now remove sharing icons from docked Tags.
  * Fixed various issues with transient Tags not showing at the correct times by adding them to a single, common layer.



* * *

## 23.10.2​

_October 26, 2023_

**General**

  * Added the ability to set the active view using [View.setActive](/reference/)
  * Added the ability to toggle individual layers using [Layer.toggle](/reference/)
  * Added [Sweep.addNeighbors](/reference/) and [Sweep.removeNeighbors](/reference/) for editing connectivity



* * *

## 23.10.1​

_October 12, 2023_

**General**

  * [Views](/reference/) are now available as View objects rather than the previous {id, name} format
  * Layers are now available in the [`layers` collection](/reference/).
  * Tag sandboxes now have the `sandbox` attribute, creating a more isolated sandbox environment



* * *

  * 24.3.1
  * 24.2.2
  * 24.2.1
  * 24.1.2
  * 24.1.1
  * 23.12.1
  * 23.11.1 hot fix 1
  * 23.11.1
  * 23.10.2
  * 23.10.1


