<!-- source: https://vexcel.atlassian.net/wiki/spaces/APIDOCS/pages/3482288435 -->
# ArcGIS Pro – Adding Vexcel WMTS & XYZ Services API 2.0

## How to Add Vexcel WMTS into ArcGIS Pro

### **Requirements**

Being a VDP Member or a public safety stakeholder with a login as a user to their ArcGIS Online account with ArcGIS pro.

### **Instructions**

After logging into ArcGIS Pro:

  * Navigate to **Home**

  * Under New Project Select **Map**


![image-20241106-200141.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241106-200141.png?version=1&modificationDate=1732721918301&cacheVersion=1&api=v2&width=609&height=141)

  * On your New Project:

    * Go to the **Insert** Tab

    * Select **Connections** > **Server** > **New WMTS Server**


![WMTS Add Connection ArcGIS Pro-20241126-151559.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/WMTS%20Add%20Connection%20ArcGIS%20Pro-20241126-151559.png?version=1&modificationDate=1732721920802&cacheVersion=1&api=v2&width=712&height=395)

  * In the Add WMTS Server Connection:

    * For the Server URL: enter <https://api.vexcelgroup.com/v2/ortho/wmts>

    * If you would like to use a username and password (not available for federated authenticated accounts) you may do so, or,

    * Expand out the **Custom request parameters** with your authentication method:

**Parameter** : api_key 

**Value** : _enter a valid token as provided_ (for long-term tokens it will be **api_key** , for named user accounts it will be **token**)


![image-20241106-201800.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241106-201800.png?version=1&modificationDate=1732721920416&cacheVersion=1&api=v2&width=500&height=564)

  * In your Catalog under the Project tab expand out Servers (if it isn’t already) you should see a new Vexcel Group WMTS Server that will have the layers specific to your organization subscription when you expand:


![image-20241126-152141.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241126-152141.png?version=1&modificationDate=1732721920179&cacheVersion=1&api=v2&width=463&height=570)

**Layer Name**| **Layer Description**  
---|---  
urban-r| Urban data collected with Condor (7.5 GSD)  
urban| Urban data collected with Osprey (7.5cm GSD)  
urban-g| Urban data collected by Geomni (7.5 GSD)  
wide-area| Wide area data collected with Condor (15-20cm GSD)  
graysky| Gray Sky events collected with either Condor (15-20 cm) or Osprey (7.5 cm) cameras   
graysky-g| Gray Sky events collected by Geomni  
  
  * Drag and drop the layer into your map to see the imagery


![image-20241126-152315.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241126-152315.png?version=1&modificationDate=1732721919930&cacheVersion=1&api=v2&width=712&height=396)

## How to Add Vexcel XYZ Tile Service into ArcGIS Pro

### **Requirements**

Being a VDP Member or a public safety stakeholder with a login as a user to their ArcGIS Online account with ArcGIS pro.

### **Instructions**

After logging into ArcGIS Pro:

  * Navigate to **Home**

  * Under New Project Select **Map**


![image-20241106-200141.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241106-200141.png?version=1&modificationDate=1732721918301&cacheVersion=1&api=v2&width=609&height=141)

  * On your New Project:

    * Go to the **Map** Tab

    * Select **Add Data** > **From Path**


![XYZ Add Data from Path-20241127-143739.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/XYZ%20Add%20Data%20from%20Path-20241127-143739.png?version=1&modificationDate=1732721918057&cacheVersion=1&api=v2&width=583&height=327)

  * For **Path,** the URL will be formatted differently based on the authentication method you are using:

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

**Parameters**| **Available Values/Notes**| **Example**  
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

  * Service Type = **Automatic**

  * Click **Add**


![XYZ Vector Tile Service-20241127-144700.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/XYZ%20Vector%20Tile%20Service-20241127-144700.png?version=1&modificationDate=1732721917694&cacheVersion=1&api=v2&width=625&height=292)

  * The XYZ service will automatically be added as a layer on the left-hand side of your menu:


![image-20241127-144900.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288435/image-20241127-144900.png?version=1&modificationDate=1732721917399&cacheVersion=1&api=v2&width=720&height=495)
