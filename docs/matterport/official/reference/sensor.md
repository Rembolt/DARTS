<!-- source: https://developers.matterport.com/reference/sensor/ -->

On this page

Our Sensor system allows for generating spatial queries to understand a Matterport digital twin. By utilizing and setting up Sources around the scene, some questions that can be answered are:

  * "what things are currently visible on screen?"
  * "what things are near me?"



where "things" can be Mattertag posts, sweeps, arbitrary locations (that you choose), or any combination of those.

Interfaces

  * [ISensor](/reference/sensor/isensor/)
  * [ISensorObserver](/reference/sensor/isensorobserver/)
  * [ISource](/reference/sensor/isource/)



Types

  * BoxVolume
  * CylinderVolume
  * SensorReading
  * SourceOptions
  * SphereVolume
  * Volume



Enumerations

  * SensorType
  * SourceType



Methods

  * createSensor
  * createSource



## Types​

### BoxVolume​

BoxVolume: _object_

Property| Type| center| [Vector3](/reference/#type-vector3)  
The center position of the box.| orientation| [Orientation](/reference/#type-orientation)  
The orientation of the box. The rotations are applied in yaw, pitch, then roll order.| size| [Vector3](/reference/#type-vector3)  
The length, width, and depth of the box volume.  
---|---  
  
### CylinderVolume​

CylinderVolume: _object_

Property| Type| basePoint| [Vector3](/reference/#type-vector3)  
The point which defines the position (base) from which the height in the +Y, and radius in the XZ-plane are relative to.| height| number  
The height of the cylinder.| radius| number  
The radius of the cylinder.  
---|---  
  
### SensorReading​

SensorReading: _object_

Information about the Source as read by the Sensor.

Property| Type| direction| [Vector3](/reference/#type-vector3)  
The world-space direction from the sensor to the source.| distance| number  
The distance between the sensor and the source.| distanceSquared| number  
The squared distance from the sensor to the source.| inRange| boolean  
The sensor is currently within the broadcast range of the source.| inView| boolean  
The sensor is within the source's broadcast range and the sensor has clear line of sight to the source.  
---|---  
  
### SourceOptions​

SourceOptions<UserData>: _object_

Additional `userData` to associate with an `ISource` when creating it. This is a free dictionary that can contain any key/values deemed necessary.

Property| Type| userData| UserData  
---|---  
  
### SphereVolume​

SphereVolume: _object_

Property| Type| origin| [Vector3](/reference/#type-vector3)  
The origin of the sphere.| radius| number  
The distance from origin of the sphere volume.  
---|---  
  
### Volume​

Volume: _Sensor.SphereVolume | Sensor.BoxVolume | Sensor.CylinderVolume_
    
    
    type Volume = SphereVolume | BoxVolume | CylinderVolume  
    

## Enumerations​

### SensorType​

SensorType: _enum_

Member| Value| CAMERA| "sensor.sensortype.camera"  
---|---  
  
### SourceType​

SourceType: _enum_

Member| Value| BOX| "sensor.sourcetype.box"| CYLINDER| "sensor.sourcetype.cylinder"| SPHERE| "sensor.sourcetype.sphere"  
---|---  
  
## Methods​

### createSensor​

createSensor(type: Sensor.SensorType.CAMERA): Promise<[Sensor.ISensor](/reference/sensor/isensor/)>

Create an [`ISensor`](/reference/sensor/isensor/) which can sense and provide information about [`ISource`](/reference/sensor/isource/).
    
    
    const sensor = await mpSdk.Sensor.createSensor(mpSdk.Sensor.SensorType.CAMERA);  
    
    
    // add sources from calls to `Sensor.createSource()`  
    
    
    sensor.addSource(...sources);  
    
    
    // start listening for changes to the sensor's readings  
    
    
    sensor.readings.subscribe({  
    
    
      onAdded(source, reading) {  
    
    
        console.log(source.userData.id, 'has a reading of', reading);  
    
    
      },  
    
    
      onUpdated(source, reading) {  
    
    
        console.log(source.userData.id, 'has an updated reading');  
    
    
        if (reading.inRange) {  
    
    
          console.log(source.userData.id, 'is currently in range');  
    
    
          if (reading.inView) {  
    
    
            console.log('... and currently visible on screen');  
    
    
          }  
    
    
        }  
    
    
      }  
    
    
    });  
    

Parameter| Type| type| Sensor.SensorType.CAMERA  
---|---  
  
**Returns:** `Promise`<[Sensor.ISensor](/reference/sensor/isensor/)>

### createSource​

createSource: _method_ — _3 overloads_

createSource(type: Sensor.SourceType.SPHERE, options: Partial<Sensor.SphereVolume & Sensor.SourceOptions<UserData>>): Promise<[Sensor.ISource](/reference/sensor/isource/)<Sensor.SphereVolume, UserData>>

Create a spherical [`ISource`](/reference/sensor/isource/) which can be sensed by an [`ISensor`](/reference/sensor/isensor/).

A shallow copy of `options.userData` is applied to the Source upon creation.

Omitting `options.origin` will default the source's `volume.origin` to `{ x: 0, y: 0, z: 0 }`.

Omitting `options.radius` will default the source's `volume.radius` to `Infinity`.
    
    
    const sources: Array<Sensor.ISource<Sensor.SphereVolume, { id: string }>> = await Promise.all([  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.SPHERE, {  
    
    
        origin: { x: 1, y: 2, z: 3 },  
    
    
        radius: 20,  
    
    
        userData: {  
    
    
          id: 'sphere-source-1',  
    
    
        },  
    
    
      }),  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.SPHERE, {  
    
    
        radius: 4,  
    
    
        userData: {  
    
    
          id: 'sphere-source-2',  
    
    
        },  
    
    
      }),  
    
    
    ]);  
    
    
    // attach to a sensor previously created with `Sensor.createSensor()`  
    
    
    sensor.addSource(...sources);  
    

Parameter| Type| type| Sensor.SourceType.SPHERE| options| Partial<Sensor.SphereVolume & Sensor.SourceOptions<UserData>>  
volume and userData options for the sphere source  
---|---  
  
**Returns:** `Promise`<[Sensor.ISource](/reference/sensor/isource/)<Sensor.SphereVolume, `UserData`>>

createSource(type: Sensor.SourceType.BOX, options: Partial<Sensor.BoxVolume & Sensor.SourceOptions<UserData>>): Promise<[Sensor.ISource](/reference/sensor/isource/)<Sensor.BoxVolume, UserData>>

Create an box shaped [`ISource`](/reference/sensor/isource/) which can be sensed by an [`ISensor`](/reference/sensor/isensor/).

A shallow copy of `options.userData` is applied to the Source upon creation.

Omitting `options.center` will default the source's `volume.center` to `{ x: 0, y: 0, z: 0 }`.

Omitting `options.size` will default the source's `volume.size` to `{ x: Infinity, y: Infinity, z: Infinity }`. Omitting `options.orientation` will default the source's `volume.orientatin` to `{ yaw: 0, pitch: 0, roll: 0 }`.
    
    
    const sources: Array<Sensor.ISource<Sensor.BoxVolume, { id: string }>> = await Promise.all([  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.BOX, {  
    
    
        center: { x: 1, y: 1, z: 1 },  
    
    
        size: { x: 2, y: 1, z: 2 },  
    
    
        userData: {  
    
    
          id: 'box-source-1',  
    
    
        },  
    
    
      }),  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.BOX, {  
    
    
        size: { x: 2: y: 2, z: 2 },  
    
    
        orientation: { yaw: 45, pitch: 45, roll: 45 },  
    
    
        userData: {  
    
    
          id: 'box-source-2',  
    
    
        },  
    
    
      }),  
    
    
    ]);  
    
    
    // attach to a sensor previously created with `Sensor.createSensor()`  
    
    
    sensor.addSource(...sources);  
    

Parameter| Type| type| Sensor.SourceType.BOX| options| Partial<Sensor.BoxVolume & Sensor.SourceOptions<UserData>>  
volume and userData options for the box source  
---|---  
  
**Returns:** `Promise`<[Sensor.ISource](/reference/sensor/isource/)<Sensor.BoxVolume, `UserData`>>

createSource(type: Sensor.SourceType.CYLINDER, options: Partial<Sensor.CylinderVolume & Sensor.SourceOptions<UserData>>): Promise<[Sensor.ISource](/reference/sensor/isource/)<Sensor.CylinderVolume, UserData>>

Create a cylindrical [`ISource`](/reference/sensor/isource/) which can be sensed by an [`ISensor`](/reference/sensor/isensor/).

A shallow copy of `options.userData` is applied to the Source upon creation.

Omitting `options.basePoint` will default the source's `volume.basePoint` to `{ x: 0, y: 0, z: 0 }`.

Omitting `options.radius` will default the source's `volume.radius` to `Infinity`.

Omitting `options.height` will default the source's `volume.height` to `Infinity`.
    
    
    const sources: Array<Sensor.ISource<Sensor.CylinderVolume, { id: string }>> = await Promise.all([  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.CYLINDER, {  
    
    
        basePoint: { x: 0, y: 0, z: 0 },  
    
    
        radius: 2,  
    
    
        height: 5,  
    
    
        userData: {  
    
    
          id: 'cylinder-source-1',  
    
    
        },  
    
    
      }),  
    
    
      mpSdk.Sensor.createSource(mpSdk.Sensor.SourceType.CYLINDER, {  
    
    
        basePoint: { x: 1, y: 2, z: 3 },  
    
    
        radius: 3,  
    
    
        userData: {  
    
    
          id: 'cylinder-source-2',  
    
    
        },  
    
    
      }),  
    
    
    ]);  
    
    
    // attach to a sensor previously created with `Sensor.createSensor()`  
    
    
    sensor.addSource(...sources);  
    

Parameter| Type| type| Sensor.SourceType.CYLINDER| options| Partial<Sensor.CylinderVolume & Sensor.SourceOptions<UserData>>  
---|---  
  
**Returns:** `Promise`<[Sensor.ISource](/reference/sensor/isource/)<Sensor.CylinderVolume, `UserData`>>

  * Interfaces
    * [ISensor](/reference/sensor/isensor/)
    * [ISensorObserver](/reference/sensor/isensorobserver/)
    * [ISource](/reference/sensor/isource/)
  * Types
    * BoxVolume
    * CylinderVolume
    * SensorReading
    * SourceOptions
    * SphereVolume
    * Volume
  * Enumerations
    * SensorType
    * SourceType
  * Methods
    * createSensor
    * createSource



  * Types
    * BoxVolume
    * CylinderVolume
    * SensorReading
    * SourceOptions
    * SphereVolume
    * Volume
  * Enumerations
    * SensorType
    * SourceType
  * Methods
    * createSensor
    * createSource


