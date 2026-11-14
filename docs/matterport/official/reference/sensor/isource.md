<!-- source: https://developers.matterport.com/reference/sensor/isource/ -->

On this page

A Source represents a volume that will be detected by a Sensor.

The type of the source, describes the type of volume associated with it.

For example, with a `type` of `SourceType.SPHERE` the `volume` is a `SphereVolume`; a `SourceType.BOX` has a `BoxVolume`.

Properties

  * type
  * userData
  * volume



Methods

  * commit



## Properties​

### type​

type: [SourceType](/reference/sensor/#enum-sourcetype)

The type of source.

### userData​

userData: UserDataT

Arbitrary data that can be used to set additional metadata, for example.

### volume​

volume: VolumeT

The volume that represents the range of emissions from this `ISource`. See [`Volume`](/reference/sensor/#type-volume).

## Methods​

### commit​

commit(): Promise<void>

Let the sensor system know there is an update to this `ISource`.

When changing any properties on `volume`, no changes will be reflected on the source or in Showcase until `commit` is called.

**Returns:** `Promise`<void>

  * Properties
    * type
    * userData
    * volume
  * Methods
    * commit



  * Properties
    * type
    * userData
    * volume
  * Methods
    * commit


