<!-- source: https://vexcel.atlassian.net/wiki/spaces/APIDOCS/pages/3035136040 -->
# API Migration Guide from 1.0 to 2.0

API 2.0 documentation is located here: <https://api.vexcelgroup.com/v2/>

Try out our code samples: <https://gicapps.azurewebsites.net/static/>

## API 1.0 to 2.0 Layer Translations:

**API 1.0**| **API 2.0**| **Layer Description**| **Imagery Types**  
---|---|---|---  
bluesky-ultra-g| urban-g| Urban data collected by Geomni| Ortho, Oriented  
bluesky-ultra| urban| Urban data collected with Osprey (7.5cm GSD)| Ortho, Oriented  
bluesky-ultra-oceania| urban| Urban data collected with Osprey (7.5cm GSD)| Ortho, Oriented  
bluesky-ultra-europe| urban| Urban data collected with Osprey (7.5cm GSD)| Ortho, Oriented  
bluesky-ultra-japan| urban| Urban data collected with Osprey (7.5cm GSD)| Ortho, Oriented  
urban-r| urban-r| Urban data collected with Condor (7.5cm GSD)| Ortho  
bluesky-high| wide-area| Wide area data collected with Condor (15cm GSD)| Ortho  
bluesky-high-europe| wide-area| Wide area data collected with Condor (15cm GSD)| Ortho  
graysky| graysky| Gray Sky data collected by UltraCam sensors.| Ortho or ortho/oriented (Depends on camera used)  
graysky-g| graysky-g| Gray Sky data collected by Geomni| Ortho or ortho/oriented (Depends on camera used)  
  
## API 1.0 to 2.0 Services Translations

Dark Green Fill = Required

Dark Yellow Fill = Optional

### Administrative Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//auth/Login| | //auth/login| | The new auth system will create 24h tokens and not save them because they are auto-verified|   
| username| | username| | `https://api.vexcelgroup.com/v2/auth/verify?username={username}&password={password}`  
| password| | password| |   
//auth/Logout| | Removed| | |   
| token| | no correlated 2.0 Service| |   
//auth/Authenticate| | //auth/verify| | |   
| token| | token| |   
| format| | no correlated 2.0 parameter| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
  
### Coverage Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//metadata/CoverageDataInPoint| | //oriented/collections1| | | `https://api.vexcelgroup.com/v2/oriented/collections?token={token}`  
| layer| | layer| | **Indoor Ski Resort, East Rutherford, New Jersey - Demonstrating CoverageDataInPoint service** Example URL`https://api.vexcelgroup.com/v2/oriented/collections?wkt=POINT(-74.0701853718421 40.81047113801408)&srid=4326&layer=urban-g&token={token}`  
| lat| | wkt| |   
| lon| | wkt| |   
| token| | token| |   
//metadata/DSMCoverage| | //dsm/collections| | | `https://api.vexcelgroup.com/v2/dsm/collections?token={token}`  
| token| | token| | **Roma, Italy - Demonstrating**`wkt`**,**`spatial-operation`**, and**`metadata-format`**:** Example URL`https://api.vexcelgroup.com/v2/dsm/collections?wkt=POINT(12.4920256 41.8897457)&srid=4326&spatial-operation=INTERSECT&layer=urban,urban-g&metadata-format=JSON&order-by=default&token={token}`  
| layer| | layer| | **Texas City, TX - Demonstrating**`collection`**, and**`include`**:** Example URL`https://api.vexcelgroup.com/v2/dsm/collections?collection=us-tx-pearland-2021&metadata-format=JSON&include=layer,first-capture-date,last-capture-date,min-gsd,max-gsd&order-by=default&token={token}`  
| aoi| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
| wkt| | wkt| |   
| EPSG| | srid| |   
| include| | include| |   
| skip| | include| won’t return anything if the include parameter is empty, will only return what you specify when using the include parameter|   
| format| | metadata-format| |   
//metadata/DTMCoverage| | //dtm/collections| | | `https://api.vexcelgroup.com/v2/dtm/collections?token={token}`  
| token| | token| | **Manitowoc, WI - Demonstrating**`collection`**, and**`include`**:** Example URL`https://api.vexcelgroup.com/v2/dtm/collections?srid=4326&collection=n44w87-us-wi-manitowoc-2022&metadata-format=JSON&include=first-capture-date,last-capture-date,min-gsd,max-gsd&token={token}`  
| layer| | layer| | **Roma, Italy - Demonstrating**`wkt`**,**`spatial-operation`**, and**`metadata-format`**:** Example URL`https://api.vexcelgroup.com/v2/dtm/collections?wkt=POINT(12.4920256 41.8897457)&srid=4326&spatial-operation=INTERSECT&layer=urban, urban-g&metadata-format=JSON&order-by=default&token={token}`  
| aoi| | no correlated 2.0 parameter| |   
| childAOI| | collection| |   
| wkt| | wkt| |   
| EPSG| | srid| |   
| include| | include| |   
| skip| | include| won’t return anything if the include parameter is empty, will only return what you specify when using the include parameter|   
| format| | metadata-format| |   
//metadata/GetCoverageInfo| | //oriented/collections1| | | `https://api.vexcelgroup.com/v2/oriented/collections?token={token}`  
| wkt| | wkt| | **Suburban Mobile Alabama - Demonstrating**`wkt=polygon,`****`srid` Example URL`https://api.vexcelgroup.com/v2/oriented/collections?wkt=POLYGON((-88.268531 30.704939, -88.264239 30.704939, -88.264239 30.700806,-88.268531 30.700806, -88.268531 30.704939))&srid=4326&token={token}`  
| token| | token| | **Port of Pensacola, Pensacola Florida - Demonstrating**`wkt=point`**,**`layer`**,**`collect-year`**,** and `metadata-format=csv` Example URL`https://api.vexcelgroup.com/v2/oriented/collections?wkt=POINT(-87.209520 30.404678)&layer=urban,wide-area&collect-year=2022&metadata-format=CSV&token={token}`  
| layers| | layer| | **Hard Rock Casino, Biloxi Mississippi - Demonstrating**`format=json`**,**`srid` Example URL`https://api.vexcelgroup.com/v2/oriented/collections?wkt=POINT(-88.887932 30.392263)&metadata-format=json&srid=4326&token={token}`  
| format| | metadata-format| |   
| epsg| | srid| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
//metadata/ImageLayerCoverage| | //oriented/collections1| | | `https://api.vexcelgroup.com/v2/oriented/collections`  
| token| | token| | **St. Louis, MO - Demonstrating**`collection`**,**`srid`**, and**`include`**:** Example URL`https://api.vexcelgroup.com/v2/oriented/collections?srid=32615&collection=us-mo-stlouis-2022&include=min-gsd,max-gsd&order-by=default&token={token}`  
| layer| | layer| | **Graysky collection - Demonstrating**`layer`**:**  
`https://api.vexcelgroup.com/v2/oriented/collections?layer=graysky&token={token}`  
| orientation| | orientation| | **Green Bay, Wisconsin - Demonstrating**`wkt`**and**`format`**:** Example URL`https://api.vexcelgroup.com/v2/oriented/collections?wkt=POLYGON((-88.13334998269332 44.56837029609595,-87.90538367409957 44.56837029609595,-87.90538367409957 44.429278530221296,-88.13334998269332 44.429278530221296,-88.13334998269332 44.56837029609595))&format=wkt&token={token}`  
| aoi| | no correlated 2.0 parameter| |   
| childAOI| | collection| |   
| wkt| | wkt| |   
| epsg| | srid| |   
| format| | metadata-format| |   
| skip| | include| won’t return anything if the include parameter is empty, will only return what you specify when using the include parameter|   
| include| | include| |   
//metadata/OrthoCoverage| | //ortho/collections| | | `https://api.vexcelgroup.com/v2/ortho/collections?`  
| token| | token| |   
| layer| | layer| | **Colosseum, Rome Italy** \- Demonstrating `layer`, `wkt=point()`, and `collect-year` Example URL`https://api.vexcelgroup.com/v2/ortho/collections?wkt=POINT(12.4920256 41.8897457)&srid=4326&layer=urban&collect-year=2022&metadata-format=JSON&order-by=default&token={token}`  
| aoi| | no correlated 2.0 parameter| | **Avon Park, Florida** \- Demonstrating `collection`, `srid`, and `metadata-format` Example URL`https://api.vexcelgroup.com/v2/ortho/collections?wkt=POINT(810981.19 1206923.39)&srid=2237&collection=us-fl-sebring_hurricaneirma_midas_block3-2017,us-fl-sebring_hurricaneirma_midas_block4-2017,us-fl-sebringavonpark-2022,us-fl-sebring_midas-2016&metadata-format=JSON&order-by=default&token={token}`  
| childAOI| | collection| | **Duck Island, NC** \- Demonstrating `layer`, and `include` Example URL`https://api.vexcelgroup.com/v2/ortho/collections?wkt=POLYGON((-75.76103210449217 36.17432692655348, -75.75897216796875 36.16185469422557, -75.73854446411133 36.16199328548835, -75.74043273925781 36.17474263344862, -75.76103210449217 36.17432692655348))&srid=4326&layer=urban-r,graysky-g&metadata-format=JSON&include=layer,collection,graysky-event,first-capture-date, last-capture-date,min-gsd,max-gsd,geometry,product-type,pretty-name,max-zoom,camera-technology,area,z-index&order-by=default&token={token}`  
| wkt| | wkt| |   
| epsg| | srid| |   
| format| | metadata-format| |   
| include| | include| |   
| skip| | include| won’t return anything if the include parameter is empty, will only return what you specify when using the include parameter|   
//metadata/FindImage| | //oriented/query1| | | `https://api.vexcelgroup.com/v2/oriented/query?`  
| format| | metadata-format| | **Miami Beach, Florida - Demonstrating**`discreteId` Example URL`https://api.vexcelgroup.com/v2/oriented/query?image-name=2020~us-fl-miami_midas-2020~images~S_20191207_160826_54_38B700192A30854_rgb&wkt=POINT(-80.129779 25.785169)&srid=4326&band=RGB&include=image-name, geometry, capture-date, collection, product-type, first-publish-date, last-publish-date&token={token}`  
| EPSG| | srid| | **Storm Surge Barriers - Rotterdam Netherlands - Demonstrating** `orientation`**and**`layer` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POINT(4.164376 51.954449)&srid=4326&layer=urban&orientation=oblique-west&metadata-format=JSON&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| xcoordinate| | wkt| | **Miami, FL - Demonstrating**`band`**,**`min-capture-date`**and**`max-capture-date` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POINT(-80.188066 25.785280)&srid=4326&layer=urban,wide-area&min-capture-date=2021-01-01T00:00:01&max-capture-date=2022-02-01T00:00:01&metadata-format=JSON&band=IRG&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| ycoordinate| | wkt| |   
| token| | token| |   
| orientation| | orientation| |   
| rendering| | band| |   
| layer| | layer| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
| discreteId| | image-name| |   
| initDate| | min-capture-date| |   
| endDate| | max-capture-date| |   
| aoi| | no correlated 2.0 parameter| |   
| childAOI| | collection| |   
| skip| | include| won’t return anything if the include parameter is empty, will only return what you specify when using the include parameter|   
//metadata/FindImagesInPoint| | //oriented/query1| | | `https://api.vexcelgroup.com/v2/oriented/query?`  
| format| | metadata-format| | **Suburban Neighborhood - Raleigh/Durham, North Carolina - Demonstrating**`orientation`**and**`metadata-format=xml`**** Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POINT(-78.837 35.822)&srid=4326&orientation=NADIR&metadata-format=XML&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| EPSG| | srid| | **The North Carolina Museum of Art - Raleigh, North Carolina - Demonstrating**`band`**and**`metadata-format=json` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POINT(-78.702694 35.809537)&srid=4326&orientation=ALL&metadata-format=JSON&band=RGB&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| wkt| | wkt| | **Eno River Bridge - Eno River State Park - Durham, North Carolina - Demonstrating**`layer`**and**`collect-year` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POINT(-79.007711 36.075451)&srid=4326&layer=urban&orientation=ALL&collect-year=2023&metadata-format=JSON&band=ALL&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| token| | token| |   
| orientation| | orientation| |   
| rendering| | band| |   
| layer| | layer| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
//metadata/FindImagesInPolygon| | //oriented/query1| | | `https://api.vexcelgroup.com/v2/oriented/query?`  
| format| | metadata-format| |   
| EPSG| | srid| | **Suburban Neighborhood - Raleigh/Durham, North Carolina - Demonstrating**`orientation`**and**`metadata-format=xml`**** Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POLYGON((-78.837290 35.8220769,-78.8367352 35.8220573,-78.8367326 35.8223944,-78.8372824 35.82240314,-78.837290 35.8220769))&srid=4326&orientation=NADIR&metadata-format=XML&band=ALL&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| wkt| | wkt| | **The North Carolina Museum of Art - Raleigh, North Carolina - Demonstrating**`band`**,**`spatial-operation`**and**`collect-year` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POLYGON((-78.702348 35.808872,-78.701961 35.809020,-78.702916 35.810203,-78.703270 35.810055,-78.702348 35.808872))&srid=4326&spatial-operation=COVERS_WKT&orientation=ALL&collect-year=2022&metadata-format=JSON&band=RGB&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| token| | token| | **Eno River Bridge - Eno River State Park - Durham, North Carolina - Demonstrating**`layer`**and**`metadata-format=json` Example URL`https://api.vexcelgroup.com/v2/oriented/query?wkt=POLYGON((-79.007845 36.075539,-79.007607 36.075539,-79.007607 36.075354,-79.007845 36.075354,-79.007845 36.075539))&srid=4326&layer=urban&orientation=ALL&metadata-format=JSON&band=ALL&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| orientation| | orientation| |   
| rendering| | band| |   
| layer| | layer| |   
| mode| | spatial-operation| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
  
### Discrete and Static Imagery Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//images/ExtractImages| | //oriented/extract| | | `https://api.vexcelgroup.com/v2/oriented/extract?`  
| layer| | layer| | **Eden Isle/Lake Pontchartrain, Louisiana, USA - Demonstrating**`image-name, srid`**,**`downsample`**, and**`layer`**:** Example URL`https://api.vexcelgroup.com/v2/oriented/extract?layer=wide-area&wkt=POINT (-89.793687 30.211780)&srid=4326&image-name=2023~n30w89-us-ms-gulfport-2023~images~NN_20230213_204838_149_38822E189B5AE89_rgb&downsample=2&attribution=true&image-format=png&token={token}`  
| mode| | no correlated 2.0 parameter| | **Audubon Zoo, New Orleans, Louisiana, USA - Demonstrating**`bands`**,**`image-format=jpeg`**,**`bbox-dimensions,`**and**`rotation` Example URL`https://api.vexcelgroup.com/v2/oriented/extract?layer=urban&wkt=POINT (-90.131992 29.922790)&srid=4326&bands=rgb&downsample=0&bbox-dimensions=800,1200&rotation=north&attribution=true&image-format=jpeg&token={token}`  
| zoom| | downsample| | **St. Louis Cathedral, New Orleans, Louisiana, USA- Demonstrating**`collect-year`**,**`drawing`**,**`crop`**,**`attribution`**,**`min-capture-date`**,**`max-capture-date` Example URL`https://api.vexcelgroup.com/v2/oriented/extract?layer=urban-g&wkt=POLYGON((-90.06387401262296 29.958257707138394,-90.06340060273183 29.957938178957885,-90.06359103957189 29.957713927657917,-90.06407517829908 29.958033456559164,-90.06387401262296 29.958257707138394))&srid=4326&orientation=nadir&min-capture-date=2019-01-01T00:00:01&max-capture-date=2019-02-01T00:00:01&bands=rgb&downsample=0&crop=clip&crosshair=POINT (-90.063694 29.958001)&crosshair-color=rgb(255,128,0)&crosshair-line-width=3&attribution=true&image-format=png&token={token}`  
| EPSG| | srid| |   
| token| | token| |   
| xcoordinate| | wkt| *now able to define wkt as a point|   
| ycoordinate| | wkt| |   
| wkt| | wkt| |   
| width| | bbox-dimensions| `bbox-dimensions={width,height}`|   
| height| | bbox-dimensions| `bbox-dimensions={width,height}`|   
| crop| | crop| |   
| imagename| | image-name| |   
| projCode| | no correlated 2.0 parameter| |   
| childAOI| | collection| |   
| format| | image-format| |   
| initDate| | min-capture-date| |   
| endDate| | max-capture-date| |   
| nadirRotatedNorth| | rotation| |   
| orientation| | orientation| |   
| metadata| | no correlated 2.0 parameter| |   
| excludeJGWFiles| | no correlated 2.0 parameter| image-format=jpegjpeg format will exclude JGW files|   
| drawing| | POST-drawing| |   
| logo| | attribution| |   
| demPriority| | dem-priority| |   
//images/ExtractNIRImages| | Removed| | this is included in the //oriented/extract and the //ortho/extract parameter “band=irg”|   
| layer| | | |   
| mode| | | |   
| zoom| | | |   
| EPSG| | | |   
| token| | | |   
| xcoordinate| | | |   
| ycoordinate| | | |   
| wkt| | | |   
| width| | | |   
| height| | | |   
| crop| | | |   
| imagename| | | |   
| startDate| | | |   
| endDate| | | |   
| rotatedNorth| | | |   
| metadata| | | |   
| excludeJGWFiles| | | |   
| drawing| | | |   
| logo| | | |   
| demPriority| | | |   
//images/ExtractOrthoImages| | //ortho/extract| | | `https://api.vexcelgroup.com/v2/ortho/extract?`  
| layer| | layer| | **The Atomium - Brussels, Belgium - Demonstrating the**`wkt=point`**,**`layer`**,**`zoom, `**and**`bbox-dimensions`**parameters** Example URL`https://api.vexcelgroup.com/v2/ortho/extract?layer=wide-area&wkt=POINT(4.340991 50.894916)&srid=4326&bands=rgb&zoom=17&bbox-dimensions=600,400&attribution=false&image-format=png&token={token}`  
| EPSG| | srid| | **Fort McHenry National Monument and Historic Shrine - Baltimore, MD - Demonstrating the**`srid`**,**`wkt`**,**`format`, `collection`**and**`bands`**parameters** Example URL`https://api.vexcelgroup.com/v2/ortho/extract?layer=urban&wkt=POLYGON((-76.580924 39.263944, -76.578685 39.263938, -76.578682 39.262136, -76.580924 39.262134, -76.580924 39.263944))&srid=4326&collection=us-md-baltimore-2021&bands=irg&zoom=21&crop=clip&attribution=true&image-format=png&token={token}`  
| token| | token| | **Shrine of Remembrance - Melbourne, Australia - Demonstrating the**`zoom`**,**`min-first-capture-date`**, and**`max-last-capture-date`**parameters** Example URL`https://api.vexcelgroup.com/v2/ortho/extract?layer=urban&wkt=POLYGON ((144.972431 -37.830084, 144.973944 -37.829724, 144.974269 -37.830955, 144.973075 -37.831252, 144.972431 -37.830084))&srid=4326&min-first-capture-date=2021-02-09T00:00:01&max-last-capture-date=2021-03-16T23:59:59&zoom=19&crop=clip&attribution=false&image-format=png&token={token}`  
| xcoordinate| | wkt| *now able to define wkt as a point|   
| ycoordinate| | wkt| |   
| width| | bbox-dimensions| `bbox-dimensions={width,height}`|   
| height| | bbox-dimensions| `bbox-dimensions={width,height}`|   
| wkt| | wkt| |   
| zoom| | zoom| |   
| year| | collect-year| |   
| crop| | crop| |   
| AOI| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
| format| | image-format| |   
| startDate| | min-first-capture-date| |   
| endDate| | max-last-capture-date| |   
| returnTransparent| | no correlated 2.0 parameter| |   
| rotatedNorth| | rotation| |   
| renderingRule| | band| |   
| apply_coverage_mask| | no correlated 2.0 parameter| |   
//images/GetImage| | //oriented/extract| | | `https://api.vexcelgroup.com/v2/oriented/extract?`  
| imagename| image-name| | | **PJ Hoffmaster State Park, Michigan - Demonstrating**`downsample` Example URL`https://api.vexcelgroup.com/v2/oriented/extract?layer=urban&srid=4326&image-name=2020~us-mi-muskegon-2020~images~E_20200821_135253_57_32A6ECB8DE90BF6_rgb&priority=layer-asc, collection-last-capture-date-desc, image-center-distance-asc&downsample=4&rotation=natural&attribution=false&image-format=jpeg&token={token}`  
| layer| layer| | | **Holland, Michigan - Demonstrating**`bbox-dimensions` Example URL`https://api.vexcelgroup.com/v2/oriented/extract?layer=urban-g&srid=4326&image-name=2019~us-mi-holland_leica-2019~images~NS_20190505_192620_61_32AC703326C02B3_rgb&priority=layer-asc, collection-last-capture-date-desc, image-center-distance-asc&bbox-dimensions=800,600&rotation=natural&attribution=false&image-format=jpeg&token={token}`  
| token| token| | |   
| zoom| downsample| | |   
| width| bbox-dimensions| | |   
| height| bbox-dimensions| | |   
  
### Elements Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//property/GetPropertyInformation|  | //property|  | this will be for cached properties| `https://api.vexcelgroup.com/v2/property/extract`  
| wkt|  | wkt|  this will be for on-demand properties|  `https://api.vexcelgroup.com/v2/property/generate`  
| token|  | token|  |   
| callbackUrl|  | no correlated 2.0 parameter|  |   
| externalRequestID|  | external-request-id|  |   
| property-features|  | no correlated 2.0 parameter| this will be in a separate service://structure/extract//structure/geometry/extract|   
| format|  | metadata-format|  |   
| calculateHeights|  | include=roof-height|  |   
| layer|  | layer|  |   
| aoi|  | collection|  |   
| orientationsource|  | orientation-source|  |   
| usecache|  | `https://api.vexcelgroup.com/v2/property/extract`|  to use the cache you will use the extract|   
| unit-system|  | unit-system|  |   
| suppliedparcel|  | supplied-parcel|  |   
| permit-on-demand|  | no correlated 2.0 parameter|  |   
| search_radius|  | buffer-meter|  |   
| requiredAttributes|  | no correlated 2.0 parameter| use property/extract to define the attributes|   
| maxrecords|  | max-records|  |   
//damage/GetPropertyDamage|  | //damage/property/extract|  |  |  `https://api.vexcelgroup.com/v2/damage/property/extract`  
| wkt|  | wkt|  |   
| token|  | token|  |   
| format|  | no correlated 2.0 parameter|  |   
| aoi|  | collection|  |   
| child_aoi|  | no correlated 2.0 parameter|  |   
| search_radius|  | buffer-meter|  |   
| only_damages|  | include=post-cat-structures|  |   
| unit-system|  | unit-system|  |   
//property/report|  | //property/report|  |  | `https://api.vexcelgroup.com/v2/property/report`  
| wkt|  | wkt|  |   
| token|  | token|  |   
| aoi|  | collection|  |   
| bluesky-childAOIs|  | urban-collections|  |   
| bluesky-high-childAOIs|  | wide-area-collections|  |   
| graysky-childAOIs|  | graysky-collections|  |   
| infrared-childAOIs|  | urban-irg-collections|  |   
| (continued)| | wide-area-irg-collections| |   
| (continued)| | graysky-irg-collections| |   
| unit-system|  | unit-system|  |   
| skip-categories|  | no correlated 2.0 parameter|  |   
| alt-image|  | alt-image|  |   
//damage/report|  | //damage/property/report|  |  |  `https://api.vexcelgroup.com/v2/damage/property/report`  
| wkt|  |  wkt|  |   
| token|  |  token|  |   
| aoi|  | collection|  |   
| bluesky-childAOIs|  | urban-collections|  |   
| bluesky-high-childAOIs|  | wide-area-collections|  |   
| graysky-childAOIs|  | graysky-collections|  |   
| infrared-childAOIs|  | urban-irg-collections|  |   
| (continued)| | wide-area-irg-collections| |   
| (continued)| | graysky-irg-collections| |   
| unit-system|  |  unit-system|  |   
  
### Metadata Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//metadata/ImageMetadata| | //oriented/query| | | `https://api.vexcelgroup.com/v2/oriented/query?`  
| format| | metadata-format| | **Rock and Roll Hall of Fame - Cleveland, Ohio - Demonstrating**` image-name`**,**`metadata-format`**, and**`orientation` Example URL`https://api.vexcelgroup.com/v2/oriented/query?image-name=2020~us-oh-westlake-2020~images~2827-lvl02-oblique-left_rgb&srid=4326&orientation=ALL&metadata-format=JSON&band=RGB&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| discreteId| | image-name| | **Pro Football Hall of Fame - Canton, Ohio - Demonstrating**`metadata-format=xml` Example URL`https://api.vexcelgroup.com/v2/oriented/query?image-name=2023~us-oh-canton-2023~images~NW_20230923_201957_88_3814097389F2A9D_rgb&srid=4326&orientation=ALL&metadata-format=XML&band=ALL&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| token| | token| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
//metadata/TransformDiscretePoints| | //oriented/transform-points| | | `https://api.vexcelgroup.com/v2/oriented/transform-points?operation={operation}&image-name={image-name}&points={points}srid={srid}&token={token}`  
| format| | metadata-format| |  Example URL`https://api.vexcelgroup.com/v2/oriented/transform-points?operation=world-2-pixel&image-name=2022~us-fl-jacksonville-2022~images~NN_20220219_170352_75_389376DF2815A7C_rgb&points=-81.659819,30.320020,-81.658588,30.320846,-81.657524,30.320095,-81.656697,30.319733&srid=4326&metadata-format=JSON&dem-priority=VEXCEL_DTM&token={token}`  
| mode| | operation| |   
| discreteId| | image-name| |   
| points| | points| |   
| EPSG| | srid| |   
| token| | token| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
| precision| | dem-priority| |   
//metadata/FindImages| | //oriented/query| | | `https://api.vexcelgroup.com/v2/oriented/query?`  
| discreteIds| | image-name| | **Graceland, TN - Demonstrating**`image-name`**, and**`metadata-format` Example URL`https://api.vexcelgroup.com/v2/oriented/query?image-name=2023~us-tn-memphis-2023~images~S_20230419_182717_49_2D7777E54977AD2_rgb,2023~us-tn-memphis-2023~images~W_20230419_175253_50_2D7777CFB9EDF16_rgb&srid=4326&orientation=ALL&metadata-format=JSON&band=ALL&include=image-name,geometry,capture-date,collection,product-type,first-publish-date,last-publish-date&token={token}`  
| token| | token| |   
| format| | metadata-format| |   
| jsonpFunction| | no correlated 2.0 parameter| |   
//metadata/OrthoEstimateDates| | //ortho/dates| | | `https://api.vexcelgroup.com/v2/ortho/dates?layer={layer}&wkt={wkt}&token={token}`  
| layer| | layer| | **Knoxville, Tennessee, USA - Mandatory Parameters** Example URL`https://api.vexcelgroup.com/v2/ortho/dates?layer=urban&wkt=POINT(-83.99399755 36.04708649)&srid=4326&token={token}`  
| wkt| | wkt| |   
| token| | token| |   
| year| | collect-year| |   
| startDate| | min-first-capture-date| |   
| endDate| | max-last-capture-date| |   
| aoi| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
  
### Tile Services

**API 1.0 Service**| **API 1.0 Parameter**| **API 2.0 Service**| **API 2.0 Parameter**| **Notes**| **examples**  
---|---|---|---|---|---  
//images/GetDSMTile| | //dsm/tile| | | `https://api.vexcelgroup.com/v2/dsm/tile?layer={layer}&zoom={zoom}&tile-x={tile-x}&tile-y={tile-y}&token={token}`  
| zoom| | zoom| | **Santa Monica Pier - Santa Monica, California - Demonstrating**`layer` **and**`collect-year`**** Example URL`https://api.vexcelgroup.com/v2/dsm/tile?layer=urban&zoom=21&tile-x=358276&tile-y=837688&collect-year=2023&token={token}`  
| tilex| | tile-x| | **Residential Home - Los Angeles, California - Demonstrating**`collection` Example URL`https://api.vexcelgroup.com/v2/dsm/tile?layer=urban&zoom=21&tile-x=359366&tile-y=836944&collection=us-ca-glendale-2022&token={token}`  
| tiley| | tile-y| |   
| token| | token| |   
| layer| | layer| |   
| year| | collect-year| |   
| aoi| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
//images/GetDTMTile| | //dtm/tile| | | `https://api.vexcelgroup.com/v2/dtm/tile?layer={layer}&zoom={zoom}&tile-x={tile-x}&tile-y={tile-y}&token={token}`  
| zoom| | zoom| | **Yulee Sugar Mill Ruins Historic State Park, FL - Demonstrating mandatory parameters,**`layer, tile-x, `**and**`tile-y` Example URL`https://api.vexcelgroup.com/v2/dtm/tile?layer=wide-area&zoom=20&tile-x=283675&tile-y=436681&collect-year=2023&token={token}`  
| tilex| | tile-x| | **Clingmans Dome Observation Tower, Great Smoky Mountains National Park - Demonstrating**`collection` Example URL`https://api.vexcelgroup.com/v2/dtm/tile?layer=wide-area&zoom=17&tile-x=35135&tile-y=51666&collection=n35w83-us-tn-sevierville-2023&token={token}`  
| tiley| | tile-y| |   
| token| | token| |   
| layer| | layer| |   
| year| | collect-year| |   
| aoi| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
//images/GetImageTile| | //oriented/tile| | | `https://api.vexcelgroup.com/v2/oriented/tile?image-name={image-name}&downsample={downsample}&tile-x={tile-x}&tile-y={tile-y}&token={token}`  
| layer| | no correlated 2.0 parameter| |   
| imagename| | image-name| | **Missouri City, TX - Demonstrating**`image-name, downsample `**and**`bands` Example URL`https://api.vexcelgroup.com/v2/oriented/tile?image-name=2020~us-tx-missouricity-2020~images~S_20200225_180655_46_2DC7FF782AFFA34_rgb&downsample=0&tile-x=0&tile-y=0&bands=rgb&image-format=jpeg&token={token}`  
| token| | token| |   
| zoom| | downsample| |   
| xcoordinate| | tile-x| |   
| ycoordinate| | tile-y| |   
| returnOnFailure| | no correlated 2.0 parameter| |   
//images/GetOrthoImageTile| | //ortho/tile| | | `https://api.vexcelgroup.com/v2/ortho/tile?`  
| layer| | layer| | **TPC Scottsdale Stadium Golf Course, Scottsdale Arizona - Demonstrating the different**`bluesky`****`layer` parameters Example URLs`https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom=18&tile-x=49581&tile-y=105036&image-format=png&token={token}``https://api.vexcelgroup.com/v2/ortho/tile?layer=urban-r&zoom=18&tile-x=49581&tile-y=105036&image-format=png&token={token}``https://api.vexcelgroup.com/v2/ortho/tile?layer=wide-area&zoom=18&tile-x=49581&tile-y=105036&image-format=png&token={token}``https://api.vexcelgroup.com/v2/ortho/tile?layer=urban-g&zoom=18&tile-x=49581&tile-y=105036&image-format=png&token={token}`  
| zoom| | zoom| | **Arrowhead Lakes Subdivision, Glendale Arizona - Demonstrating the**`bands`**parameter** Example URLs`https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom=16&tile-x=12346&tile-y=26250&bands=rgb&image-format=jpeg&token={token}``https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom=16&tile-x=12346&tile-y=26250&bands=irg&image-format=jpeg&token={token}`  
| tilex| | tile-x| | **Lafayette Louisiana, Hurricane Delta Gray Sky Imagery - Demonstrating the**`graysky-event `**and**`collection`**parameter** Example URLs`https://api.vexcelgroup.com/v2/ortho/tile?layer=graysky&zoom=17&tile-x=32032&tile-y=53982&graysky-event=us-la-delta-hurricane-2020&collection=graydata-273&image-format=png&token={token}``https://api.vexcelgroup.com/v2/ortho/tile?layer=graysky&zoom=17&tile-x=32032&tile-y=53982&graysky-event=us-la-delta-hurricane-2020&collection=graydata-274&image-format=png&token={token}`  
| tiley| | tile-y| |   
| token| | token| |   
| year| | collect-year| |   
| startDate| | min-first-capture-date| |   
| endDate| | max-first-capture-date| |   
| aoi| | no correlated 2.0 parameter| |   
| ChildAOI| | collection| |   
| renderingRule| | bands| |   
| format| | image-format| |   
| returnTransparent| | no correlated 2.0 parameter| |   
/wmts| | //ortho/wmts| | | `https://api.vexcelgroup.com/v2/ortho/wmts?service=WMTS&request={request}&token={token}`  
| token| | token| | **GetCapabilities Example:** Example URL`https://api.vexcelgroup.com/v2/ortho/wmts?service=WMTS&request=getCapabilities&token={token}`  
| request| | request| | **GetTile Base URL:** Example URL`https://api.vexcelgroup.com/v2/ortho/wmts?service=WMTS&request=getTile&layer={layer}&style={Style}&tileMatrixSet={tileMatrixSet}&tileMatrix={tileMatrix}&tileRow={tileRow}&tileCol={tileCol}&format={format}&token={token}`  
| service| | service| | **GetTile Example** \- Omaha Zoo, Omaha, Nebraska - Demonstrating all parameters: Example URL`https://api.vexcelgroup.com/v2/ortho/wmts?service=WMTS&request=getTile&layer=urban&style=RGB&tileMatrixSet=EPSG_3857&tileMatrix=16&tileRow=24516&tileCol=15304&format=png&token={token}`  
  
1: Multiple API 1.0 metadata services combined into a single API 2.0 service 
