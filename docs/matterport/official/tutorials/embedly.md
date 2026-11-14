<!-- source: https://developers.matterport.com/tutorials/embedly/ -->

By default, the SDK bundle uses Matterport's embedly account which is only enabled for the Matterport and localhost domains. In order to use media mattertags on your own site, you will need to obtain an embedly key configured for your site from [Embedly](https://embed.ly).

To configure your application, you will need to do the following:

  1. Find `showcase.html` file at the root of the bundle zip file.

  2. Find the application config object in `showcase.html`. It should look like this,



    
    
      var detailObject = {  
    
    
        config: {"apiHost":"https://my.matterport.com","pointerPreventDefault":false}  
    
    
      };  
    

  3. Append `"embedlyKey": "YOUR_EMBEDLY_KEY"` to the config object. Replace `YOUR_EMBEDLY_KEY` with your actual key. The result should look like the following:


    
    
      var detailObject = {  
    
    
        config: {  
    
    
          "apiHost": "https://my.matterport.com",  
    
    
          "pointerPreventDefault": false,  
    
    
          "embedlyKey": "YOUR_EMBEDLY_KEY"  
    
    
        }  
    
    
      };  
    
