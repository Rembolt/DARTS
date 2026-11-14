<!-- source: https://developers.matterport.com/reference/scene/icomponentcontext/ -->

On this page

**Component Context**

The context object contains the three.js module and the main aspects of the rendering engine.

The camera, scene, or renderer may will likely be replaced in the future with an sdk module.
    
    
    function Cylinder() {  
    
    
       this.onInit = function() {  
    
    
         var THREE = this.context.three;  
    
    
         var geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );  
    
    
         var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );  
    
    
         var cylinder = new THREE.Mesh( geometry, material );  
    
    
       };  
    
    
    }  
    

Properties

  * camera
  * renderer
  * scene
  * three



## Properties​

### camera​

camera: THREE.Camera

The main camera. It is read-only.

See <https://threejs.org/docs/#api/en/cameras/Camera>

### renderer​

renderer: THREE.WebGLRenderer

The showcase three.js renderer.

See <https://threejs.org/docs/#api/en/renderers/WebGLRenderer>

### scene​

scene: THREE.Scene

The showcase scene.

See <https://threejs.org/docs/#api/en/scenes/Scene>

### three​

three: typeof THREE

The three.js module.

  * Properties
    * camera
    * renderer
    * scene
    * three



  * Properties
    * camera
    * renderer
    * scene
    * three


