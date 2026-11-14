<!-- source: https://vexcel.atlassian.net/wiki/spaces/APIDOCS/pages/3482288130 -->
# ArcGIS Online/Portal & ArcGIS Pro – Adding Vexcel WMTS & XYZ Services API 2.0

# Adding WMTS into ArcGIS Online

## How to Add Vexcel WMTS into the ArcGIS Online Portal

### **Overview** ****

This document provides relevant information regarding adding services available via the Vexcel API (<https://api.vexcelgroup.com/v2/> [) ](https://api.gic.org/)to an ArcGIS Online organization or ArcGIS Enterprise portal. 

VDP Members and public safety stakeholders may be interested in following these steps to make Vexcel secure services available to members of their organization or portal. 

### **Requirements**

VDP Member or public safety stakeholder logs in as user type **Creator** to their ArcGIS Online organization or ArcGIS Enterprise portal

### **Instructions**

  * Navigate to **Content**

  * Go to **My Content** , and select **New Item**


![image-20241106-194311.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-194311.png?version=1&modificationDate=1732721911876&cacheVersion=1&api=v2&width=699&height=143)

  * Select **URL**


![image-20241106-194425.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-194425.png?version=1&modificationDate=1732721911616&cacheVersion=1&api=v2&width=669&height=304)

  * What type of data are you referencing? select _**WMTS (OGC)**_ **URL** : enter <https://api.vexcelgroup.com/v2/ortho/wmts>


![image-20241106-194828.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-194828.png?version=1&modificationDate=1732721911356&cacheVersion=1&api=v2&width=812&height=266)

  * Click **Add Custom Parameter** to create a parameter and enter:

**Parameter** : api_key 

**Value** : _enter a valid token as provided_ (for long-term tokens it will be **api_key** , for named user accounts it will be **token**)

**Parameter** : Format 

**Value** : **PNG**

![image-20241106-194838.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-194838.png?version=1&modificationDate=1732721911102&cacheVersion=1&api=v2&width=736&height=227)
    * Click **Next**


![image-20241106-195122.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-195122.png?version=1&modificationDate=1732721910567&cacheVersion=1&api=v2&width=506&height=320)

  * Select a layer to add as a new item and then click **Next:**


![image-20241106-195036.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-195036.png?version=1&modificationDate=1732721910828&cacheVersion=1&api=v2&width=518&height=326)

**Layer Name**| **Layer Description**  
---|---  
urban-r| Urban data collected with Condor (7.5 GSD)  
urban| Urban data collected with Osprey (7.5cm GSD)  
urban-g| Urban data collected by Geomni (7.5 GSD)  
wide-area| Wide area data collected with Condor (15-20cm GSD)  
graysky| Gray Sky events collected with either Condor (15-20 cm) or Osprey (7.5 cm) cameras   
graysky-g| Gray Sky events collected by Geomni  
  
  * Edit the item name, summary, and description, in terms of use and sharing, and then hit “**Save** ”


![image-20241106-195138.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-195138.png?version=1&modificationDate=1732721910315&cacheVersion=1&api=v2&width=661&height=419)

### **Sharing with your Organization**

  * This item will appear under the folder you saved it to select the item, hit **share** :


![image-20241106-195856.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-195856.png?version=1&modificationDate=1732721910055&cacheVersion=1&api=v2&width=645&height=125)

  * Select **Organization** and hit **Save** :

  * **NOTE: This should not be shared outside of your organization especially if there is a long-term token appended to the URL - it is a security issue**


![image-20241106-195902.png](https://vexcel.atlassian.net/wiki/download/thumbnails/3482288130/image-20241106-195902.png?version=1&modificationDate=1732721909774&cacheVersion=1&api=v2&width=229&height=307)
