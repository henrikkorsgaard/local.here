# Webstrate PI
### Note: Work in Progress - see [Webstrates](https://github.com/cklokmose/Webstrates) for everything!

This is a thin webstrate client intended for devices such as Raspberry PI's and similar. It uses [Phantomjs](http://phantomjs.org/) to open a webstrate and link this to a particular device. 

`phantom-ws.js` should be run with Phantomjs and takes a configuration file, e.g. `phantomjs phantom-ws.js webstrate.conf`. The configuration file should contain the following:
```
webstrate_name=<DEVICE id>
server=<your favorite webstrate server>
login=<you>
password=<1234>
```

## tentative convetions
In order to keep some semantic seperation between webstrate and webstrate-device interfaces I've decided that webstrates beloning to a particular device (1:1) should follow an UpperCase naming convention, e.g. IPAD_<number || id> or RPI_<number || id>. That way it is a bit easier to see if one is editing on the device webstrate or if it is a different class of webstrate(!).

The architecture/pattern emphasises an extremly thin webstrate for the device (no styling, data, logic etc.). Device specific functionality is transcluded as an api webstrate and logic/bahaviour is transcluded as seperate webstrate. One could transclude the api in the "program" (see below), but the consideration is to expect that the api is at the root of the device webstrate and not deep transcluded (for sanity).

The initial architecture is intended as follows:

\DEVICENAME_id 
```
<html>
  <body>
    <iframe class="api" src="">
    <iframe class="program" src="">
  </body>
</html>
```

This allows us to do several things with the device: We can develop webstrates seperately, transclude (multiple) api's, deploy to multiple devices, seperate api from other webstrates.

# Setting up the RPI image

1. [Get the latest debian distro for the Raspberry PI](https://www.raspberrypi.org/downloads/raspbian/)
2. Optional cleanup - see [here](http://blog.samat.org/2015/02/05/slimming-an-existing-raspbian-install/)
3. Install latest [Node js](http://node-arm.herokuapp.com/) (we might not need it for now, tho).
4. Build [Phantomjs](http://phantomjs.org/build.html)

# License
This work is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

