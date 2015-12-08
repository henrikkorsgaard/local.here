# Webstrate PI
### Note: Work in Progress - see [Webstrates](https://github.com/cklokmose/Webstrates) for everything!

The purpose of this project is to use a Raspberry PI to instrument a given location, scan devices in proximity (same WLAN) and expose information about the devices via webstrates and enable communication to the PI via either websockets on WLAN and/or a webstrate event pattern via the PI_api webstrate.

The documentation is as is and for an audience of 1 - my bad memory ;)

## Setup

### Hardware
1. Raspberry PI or similar (linux with some build capabilities).
2. USB WIFI device (with monitor mode capability).

### Software
1. [Get the latest debian distro for the Raspberry PI](https://www.raspberrypi.org/downloads/raspbian/)
2. Optional cleanup - see [here](http://blog.samat.org/2015/02/05/slimming-an-existing-raspbian-install/)
3. Needed libs: tshark, iw tools, node, mongodb and phantomjs (build phantomjs yourself or use in the /bin folder - build for ARMv6 HF on Jessie November 2015 )

### Run
0. Test tshark, mongodb etc. so that it runs at startup
1. Once setup pull the code from here
2. Move cp phantomjs from /bin to /usr/bin/ 
3. Run webstrate-pi.sh in /scripts and check that it works (this should run on startup)

## tentative convetions
In order to keep some semantic seperation between webstrate and webstrate-device interfaces I've decided that webstrates beloning to a particular device (1:1) should follow an UpperCase naming convention, e.g. IPAD_<number || id> or PI_<number || id>. That way it is a bit easier to see if one is editing on the device webstrate or if it is a different class of webstrate(!).

Each PI should have one PI webstrate and one api-bridge webstrate, and clients transcludes the api-bridge (and not the PI webstrate)

### What the PI does
The current services running on the PI are as follows

#### Proximity scanner:
A tshark based WLAN network scanning tool that inserts the list of current active devices on the same network as the PI into a mongodb database. This can be used for validating devices prior to doing anything in webstrates, granting token based access on presence in the proximity of the PI, and give priviliged access to the PI (see active devices, signal strengt, invoke shell commands etc.) to people within procimity.

#### API server:
The API server handles direct API requests and indirect requests via the PI webstrates.

Client can communicate with the PI in three distinct ways:
1. Directly via the websocket API server running on the PI. This requires the client device to be on the same subnet as the PI and varify as such (valid ip, detected mac and active signal).
2. Indirectly in clear text by pushing events to the `<div id="pi-events></div>` queue in the api-bridge webstrate. Very few API commands are available in this 'global' clear text format.
3. Indirectly in by pushing events to the `<div id="pi-events></div>` queue in the api-bridge webstrate, WITH a AES encrypted request and a signature. The message and answer is encrypted with AES using the public key obtained via method 1 as passphrase and a unique user signature. This token based communication is restricted with a 4 hour session.

#### PhantomJS:
The PhantomJS has two roles. It loads the PI webstrate and the PI_api webstrates and sets/governs the needed DOM elements, `<div id="pi-ip"></div>` and `<div id="pi-events"></div>` in the api-bridge. PhantomJS uses MutationObservers to observe for two specific events: 1. If the innerHTML of the pi-ip element is changed, PhantomJS will revert this to the correct IP address, 2. It monitors the pi-events event queue for PING events and responds with a PONG. This is so that clients can check if the PI is awake and responding.

# License
This work is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
