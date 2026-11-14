<!-- source: https://developers.matterport.com/tutorials/xr/ -->

On this page

note

xr mode + sdk is experimental at this time and not guaranteed to work with all sdk functionality.

## Developing SDK Applications with XR​

  1. For embed SDK applications (or bundle applications hosted on another origin), make sure the iframe that loads the showcase.html file has the attribute `allow='xr-spatial-tracking'`. This is already set for our SDK embed examples.

  2. There are two ways to connect to a local development server from a headset:

     * Port forward over USB so the headset will transparently connect to the computer's localhost
     * Enable HTTPS and connect to the IP of the development machine on the local network



In either case, you can also develop in the computer's browser using a WebXR emulator extension at the same time, though we recommend exercising caution, as many WebXR APIs available to a computer browser will not work on the headset.

### Port Forwarding​

The most direct way to do XR development is to port forward between the headset and your development machine, so that going to `localhost:8000` on the headset will connect to another computer's local development environment. For android-based headsets that are connected over USB, the commands to do this are as follows:

`adb devices`

will retrieve the device ID, which can be inserted into this command

`adb -s <INSERT-DEVICE-ID> reverse tcp:8000 tcp:8000`

to create the port forward. If you are using the Meta Quest Developer Hub, you can create a `Custom Command` to do this second command for various ports, as USB device IDs tend not to change.

Once the port forward is connected, going to `http://localhost:8000` on the headset will open anything served from that port on your local machine.

For many headsets, this will allow activating XR mode even without HTTPs, as browsers often have an exception to allow enabling XR on non-SSL connections for localhost.

### Connecting on a Local Network Connection​

For a headset to access a development server without port forwarding generally requires enabling https on your development server. In webpack-dev-server, which is what the SDK examples use, that looks something like this:
    
    
      module.exports = {  
    
    
        //...  
    
    
        devServer: {  
    
    
          https: true  
    
    
        }  
    
    
      };  
    

See [Webpack dev-server](https://webpack.js.org/configuration/dev-server/) for more details.

In some cases, you may need to add exceptions to your computer's firewall system to enable accessing the ports you are serving from.

Note that you will also have to add the development IP address to your SDK key's allowed hosts in [Account Settings -> Developer Tools](https://my.matterport.com/settings/account/devtools). Local network IPs can change, so you also may want to set up a reserved DHCP IP in this case.

## Remote debugging Android devices over USB​

With either of the above techniques, in order to step through and see console messages from the code running on the headset, you will need to use some form of remote debugging. If the headset SDK tools don't provide this directly, and the headset is based on Android (like the Meta Quest), you can use [Chrome Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/#debug) to interact with the software running on the headset.

  * Developing SDK Applications with XR
    * Port Forwarding
    * Connecting on a Local Network Connection
  * Remote debugging Android devices over USB


