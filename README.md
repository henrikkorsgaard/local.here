# Webstrate PI
### Note: Work in Progress - see [Webstrates](https://github.com/cklokmose/Webstrates) for everything!

The purpose of this project is to use a Raspberry PI to instrument a given location, scan devices in proximity (same WLAN) and expose information about the devices via webstrates and enable communication to the PI via either websockets on WLAN and/or a webstrate event pattern via the PI_api webstrate.

The documentation is as is and for an audience of 1 - my bad memory ;)

## Installation

1. Get [Rasbian Lite](https://www.raspberrypi.org/downloads/raspbian/) 
2. Clone this repository onto PI (/home/pi/
3. run `sudo scripts/setup.sh`
4. run npm install
5. edit the configuration file `/boot/webstrate-pi.config`
6. reboot

### Needed hardware
1. Raspberry PI or similar (linux with some build capabilities).
2. USB WIFI device (with monitor mode capability).
3. Minimum 4gb SD card

## Development

### Clear Database

```
$> mongo
$> use proximagic
$> db.devices.drop()
$> db.locations.drop()
```

### Restart context-server
`sudo forever restartall`

## What it does
tbw

# License
This work is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
