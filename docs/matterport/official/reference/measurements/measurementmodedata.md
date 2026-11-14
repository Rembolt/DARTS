<!-- source: https://developers.matterport.com/reference/measurements/measurementmodedata/ -->

On this page

The data associated with Showcase's measurement mode

Properties

  * label



Accessors

  * id
  * points
  * segmentLengths
  * sid
  * temporary
  * totalLength
  * type



## Properties​

### label​

label: string

The user-set "description" of this measurement

## Accessors​

### id​

id: _(readonly)_ string

A unique identifier for this measurement

### points​

points: _(readonly)_ [Vector3](/reference/#type-vector3)[]

The list of wold-space coordinates that compose this measurement

### segmentLengths​

segmentLengths: _(readonly)_ number[]

The length of each segment between consecutive pairs of points

### sid​

sid: _(readonly)_ string

Alias for `id`

### temporary​

temporary: _(readonly)_ boolean

Whether this measurement was created during the Showcase session

### totalLength​

totalLength: _(readonly)_ number

The total length of the measurement

### type​

type: _(readonly)_ [MeasurementType](/reference/measurements/#enum-measurementtype)

The type of the measurement that determines when it gets rendered

  * Properties
    * label
  * Accessors
    * id
    * points
    * segmentLengths
    * sid
    * temporary
    * totalLength
    * type



  * Properties
    * label
  * Accessors
    * id
    * points
    * segmentLengths
    * sid
    * temporary
    * totalLength
    * type


