<!-- source: https://developers.matterport.com/api-changelog/page-5/ -->

On this page

## 2022.04.14​

_April 14, 2022_

This is a major feature release to expose notes functionality over the public apis as well as clean up doc a bit and refresh the experience.

  * Exposed Note Query and Mutations
  * Deprecated updateMattertagMedia and enabled updating the external URL via patchMattertag
  * API doc experience refreshed and more closely integrated with SDK doc



* * *

## 2022.03.22​

_March 22, 2022_

  * Exposed a generate assets request which will allow assets for bundles to be generated on demand.



* * *

## 2022.01.18​

_January 18, 2022_

**Account API**

Changes to access query in user.schema

  * Added ID for the resource (denoting SID of the resource) in `AccessInfo` type for access query



* * *

## 2021.12.16​

_December 16, 2021_

  * Fixed a type in measurmentPath to be measurementPath under rooms.



* * *

## 2021.07.29​

_July 29, 2021_

  * Added a 1,000 page limit to the models query, this also fixed an issue where asking for a page size of 10,000 or more results would cause nextOffset to not be populated even when there were additional hits.



* * *

## 2021.05.13​

_May 13, 2021_

  * Fixed an issue that allowed an API token to access models that the token creator had access to outside of the token’s organization. Note that this includes restricting access to public models outside of the organization the token belongs to.



* * *

## 2021.04.22​

_April 22, 2021_

This release adds official support for controlling more options related to the Matterport Showcase and additional information associated with public models.
    
    
      
    
    
    query {  
    
    
    	model(id: ID!) {  
    
    
    		options {  
    
    
    			addressVisibility  
    
    
    			tourButtonsEnabled  
    
    
    			tourButtonsOverride  
    
    
    			dollhouseEnabled  
    
    
    			dollhouseOverride  
    
    
    			floorplanEnabled  
    
    
    			floorplanOverride  
    
    
    			labelsEnabled  
    
    
    			labelsOverride  
    
    
    			dollhouseLabelsEnabled  
    
    
    			dollhouseLabelsOverride  
    
    
    			highlightReelEnabled  
    
    
    			highlightReelOverride  
    
    
    			tourAutoplayEnabled  
    
    
    			tourAutoplayOverride  
    
    
    			backgroundColor  
    
    
    			unitType  
    
    
    			measurements  
    
    
    			address  
    
    
    		}  
    
    
    	}  
    
    
    }  
    
    
      
    
    
    mutation {  
    
    
    	patchModel(  
    
    
    		id: ID!,  
    
    
    		patch: {  
    
    
    			options: {  
    
    
    				backgroundColor: BackgroundColorSettingOverride  
    
    
    				tourButtonsOverride: SettingOverride  
    
    
    				dollhouseOverride: SettingOverride  
    
    
    				floorplanOverride: SettingOverride  
    
    
    				labelsOverride: SettingOverride  
    
    
    				dollhouseLabelsOverride: SettingOverride  
    
    
    				highlightReelOverride: SettingOverride  
    
    
    				tourAutoplayOverride: SettingOverride  
    
    
    				unitType: UnitSettingOverride  
    
    
    				measurements: MeasurementsModeOverride  
    
    
    			}  
    
    
    		}  
    
    
    	)  
    
    
    }  
    

* * *

## 2021.03.29​

_March 29, 2021_

  * Removed some leaked references to internal API structures



* * *

## 2021.02.11​

_February 11, 2021_

This is a maintenance release with updates focused on addressing integration concerns and preparing for expanded add ons in the future.

  * Added an estimate of the total dimensions of the space under Model.dimensions
  * GSV and homeaway bundles will now show up as locked if they are associated with a compatible model but it is still not possible to unlock them via the API.



* * *

## 2020.12.17​

_December 17, 2020_

The focus of this release is continued bug fixing / enhancements to enable workshop / showcase to operate over the new graph API.

  * Made all fields which may return an error (such as unauthorized or not found) to be nullable (removed the exclamation mark). This will allow partial data to be returned in a wider variety of cases but may result in changes to generated clients.
  * Added a patch photo mutation to allow the label associated with a photo to be updated.



* * *

  * 2022.04.14
  * 2022.03.22
  * 2022.01.18
  * 2021.12.16
  * 2021.07.29
  * 2021.05.13
  * 2021.04.22
  * 2021.03.29
  * 2021.02.11
  * 2020.12.17


