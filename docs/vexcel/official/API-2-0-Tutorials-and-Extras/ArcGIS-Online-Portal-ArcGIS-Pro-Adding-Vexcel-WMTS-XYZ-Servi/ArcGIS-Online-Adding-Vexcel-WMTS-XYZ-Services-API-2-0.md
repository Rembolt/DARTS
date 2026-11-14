<!-- source: https://vexcel.atlassian.net/wiki/spaces/APIDOCS/pages/3482288324 -->
# ArcGIS Online – Adding Vexcel WMTS & XYZ Services API 2.0

## How to Add Vexcel WMTS into ArcGIS Online

### **Requirements**

VDP Members or public safety stakeholders log in as a user to their ArcGIS Online organization

### **Instructions**

  * Under Layers select “Add > Add Layer from URL”


![image-20241126-152753.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241126-152753.png?version=1&modificationDate=1732721914802&cacheVersion=1&api=v2&width=229&height=264)

  * Enter in the URL:




<https://api.vexcelgroup.com/v2/ortho/wmts>

![image-20241106-194828.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241106-194828.png?version=1&modificationDate=1732721916885&cacheVersion=1&api=v2&width=812&height=266)

  * Click **Add Custom Parameter** to create a parameter and enter:

**Parameter** : api_key 

**Value** : _enter a valid token as provided_ (for long-term tokens it will be **api_key** , for named user accounts it will be **token**)

**Parameter** : Format 

**Value** : **PNG**

    * Click **Next**


![image-20241106-195122.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241106-195122.png?version=1&modificationDate=1732721916620&cacheVersion=1&api=v2&width=448&height=283)

  * Select a layer to add as a new layer and then click **Add to map:**


![Add to Map-20241126-153457.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/Add%20to%20Map-20241126-153457.png?version=1&modificationDate=1732721916357&cacheVersion=1&api=v2&width=448&height=284)

**Layer Name**| **Layer Description**  
---|---  
urban-r| Urban data collected with Condor (7.5 GSD)  
urban| Urban data collected with Osprey (7.5cm GSD)  
urban-g| Urban data collected by Geomni (7.5 GSD)  
wide-area| Wide area data collected with Condor (15-20cm GSD)  
graysky| Gray Sky events collected with either Condor (15-20 cm) or Osprey (7.5 cm) cameras   
graysky-g| Gray Sky events collected by Geomni  
  
  * The layer will show under the Layer menu on the left-hand side:


![image-20241126-153727.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241126-153727.png?version=1&modificationDate=1732721916108&cacheVersion=1&api=v2&width=302&height=102)

## How to Add Vexcel XYZ Tile Service into ArcGIS Online

### **Requirements**

VDP Members or public safety stakeholders log in as a user to their ArcGIS Online organization

### **Instructions**

  * Under Layers select “Add > Add Layer from URL”


![image-20241126-152753.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241126-152753.png?version=1&modificationDate=1732721914802&cacheVersion=1&api=v2&width=229&height=264)

  * The URL will be formatted differently based on the authentication method you are using:

    * For **long-term tokens** :

      * [https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom={z}&tile-x={x}&tile-y={y}&image-format=png&api_key=X](https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom={z}&tile-x={x}&tile-y={y}&image-format=png&api_key=X)

    * For **named user accounts** :

      * [https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom={z}&tile-x={x}&tile-y={y}&image-format=png&token=X](https://api.vexcelgroup.com/v2/ortho/tile?layer=urban&zoom={z}&tile-x={x}&tile-y={y}&image-format=png&token=X)

  * Mandatory Parameters:

    * **Layer**

      *  _Available values_ : urban, urban-r, urban-g, wide-area, graysky, graysky-g




**Layer Name**| **Layer Description**  
---|---  
urban-r| Urban data collected with Condor (7.5 GSD)  
urban| Urban data collected with Osprey (7.5cm GSD)  
urban-g| Urban data collected by Geomni (7.5 GSD)  
wide-area| Wide area data collected with Condor (15-20cm GSD)  
graysky| Gray Sky events collected with either Condor (15-20 cm) or Osprey (7.5 cm) cameras   
graysky-g| Gray Sky events collected by Geomni  
  
* * *

  * Optional Parameters which you can append onto the URL as desired:




#### Optional Parameters XYZ Table 

Expand to see all the optional parameters you can include in the XYZ service (listed on the [API 2.0 documentation](https://api.vexcelgroup.com/v2/) under ortho/tile)

Optional Parameters for XYZ Service API 2.0

**Parameter Name**| **Available Values/Notes**| **Example**  
---|---|---  
graysky-event| The name of the graysky event| `graysky-event=us-fl-helene-hurricane-2024`  
collection| The identifier of the AOI (Area of Interest) which contains the desired imagery.| `collection=n30w83-us-fl-valdosta-2024`  
order-by| The method by which to order the coverages, separated by commas.  
**Allowed values** : _layer-asc, layer-desc, first-capture-date-asc, first-capture-date-desc, last-capture-date-asc, last-capture-date-desc, first-publish-date-asc, first-publish-date-desc, last-publish-date-asc, last-publish-date-desc, avg-gsd-asc, avg-gsd-desc, area-asc, area-desc_  
Additionally, a single collection can be written at the very start to place it on top of everything else._**Default value**_ : layer-asc, last-capture-date-desc, avg-gsd-asc| `order-by=layer-asc,collection-last-capture-date-desc,image-center-distance-asc`  
collect-year| The year of collection. | `collect-year=2024`  
min-first-capture-date| The date of the earliest acceptable first capture date. Collections with first capture date prior to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `min-first-capture-date=2024-01-01T00:00:00`  
max-first-capture-date| The date of the latest acceptable first capture date. Collections with first capture date after to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `max-first-capture-date=2024-03-31T23:59:59`  
min-last-capture-date| The date of the earliest acceptable last capture date. Collections with last capture date prior to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `min-last-capture-date=2024-01-31T00:00:00`  
max-last-capture-date| The date of the latest acceptable last capture date. Collections with last capture date after to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `max-last-capture-date=2024-03-31T23:59:59`  
min-first-publish-date| The date of the earliest acceptable first publish date. Collections with first publish date prior to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `min-first-publish-date=2024-03-31T23:59:59`  
max-first-publish-date| The date of the latest acceptable first publish date. Collections with first publish date after to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `max-first-publish-date=2024-05-31T23:59:59`  
min-last-publish-date| The date of the earliest acceptable last publish date. Collections with last publish date prior to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `min-last-publish-date=2024-05-30T23:59:59`  
max-last-publish-date| The date of the latest acceptable last publish date. Collections with last publish date after to this date will be excluded. (pattern: yyyy-MM-ddTHH:mm:ss)| `max-last-publish-date=2024-08-31T23:59:59`  
bands| 

  * **rgb** (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.
  * **irg** : Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.

| `bands=irg`  
image-format|  _Available values_ : jpeg, png, tiff, jpeg/png| `image-format=png`  
  
* * *

  * Type = **Tile layer**

  * Click **Next**


![XYZ Map Next-20241126-221425.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/XYZ%20Map%20Next-20241126-221425.png?version=1&modificationDate=1732721914556&cacheVersion=1&api=v2&width=684&height=436)

  * Add in a title that makes sense (please note the below is specific to the example that’s been used) and attribution = Vexcel Imaging/Imagery or Vexcel

  * Click **Add to map**


![XYZ Add to Map-20241126-221642.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/XYZ%20Add%20to%20Map-20241126-221642.png?version=1&modificationDate=1732721914275&cacheVersion=1&api=v2&width=568&height=362)

  * The layer will show under the Layer menu on the left-hand side:


![image-20241126-221840.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288324/image-20241126-221840.png?version=1&modificationDate=1732721913875&cacheVersion=1&api=v2&width=622&height=414)
