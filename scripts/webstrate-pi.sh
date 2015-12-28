#!/bin/bash

#default configuration file
configFile='../webstrate-pi-example-config-file.conf'

#checking for a custom configuration file provided by the user on boot
if [ -r /boot/webstrate-pi.conf ]; then
	echo "reading configuraton from /boot/webstrate-pi.conf"
	configFile='/boot/webstrate-pi.conf'
fi

source $configFile

#Setup wlan0 to connect to the correct ssid
if [ -n "$(iw dev wlan0 link | grep $ssid)" ]
then
	echo "Wlan0 is already setup and running on $ssid"
else
	echo "Updating network configuration"
	wpa_passphrase $ssid $wifi_password > /etc/wpa_supplicant/wpa_supplicant.conf
	sudo /etc/init.d/networking restart
	ifup wlan0
	sleep 5
fi

if [ -n "$(ifconfig | grep mon0)" ]
then
	echo "Monitor device (mon0) already up!"
else
	echo "Setting up monitor device (mon0)"
	iw wlan0 interface add mon0 type monitor
	ip link set mon0 up
fi

#Do the stuff the writes to a local config file
ip="$(ifconfig wlan0 | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*')"
broadcastIP="$(ifconfig wlan0 | grep -Eo ' (Bcast:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*')"
mac="$(ifconfig wlan0 | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}')"
stationIP="$(arp -a| grep $ssid | grep -Eo -m 1 '([0-9]*\.){3}[0-9]*')"
stationMAC="$(iw dev wlan0 link | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}')"

os="$(cat /proc/version)"
cpu="$(cat /proc/cpuinfo | grep model | grep -o ":.*" | cut -f2- -d':')"
usb="$(lsusb | sed "s/.*/\"&\"/" | paste -sd,)"
usb="[$usb]"

if [ -z "$ip" ]
then
	echo "ERROR: Unable to verify device ip. This is essentail to running the service. Are you sure that wlan0 is set up and has an ip?"
	exit
elif [ -z "$broadcastIP" ]
then
	echo "ERROR: Unable to obtain the broadcast address of the network. This is essentail to running the service. Are you sure that wlan0 is set up and able to connect to station: $ssid?"
	exit
elif [ -z "$mac" ]
then
	echo "ERROR: Unable to obtain device mac for wlan0. This is essentail to running the service. Are you sure there is a wirelss device connected to the PI?"
	exit
elif [ -z "$stationIP" ]
then
	echo "ERROR: Unable to obtain station ip address. This is essentail to running the service. Are you sure that wlan0 is set up and able to connect to station: $ssid?"
	exit
elif [ -z "$stationMAC" ]
then
	echo "ERROR: Unable to obtain station mac address. This is essentail to running the service. Are you sure that wlan0 is set up and able to connect to station: $ssid?"
	exit
else
	echo "Generating the local settings and writing to file: webstrate-pi-local.settings"
	echo "{\"ATTENTION\":\"THIS SETTINGS FILE IS AUTO-GENERATE BY THE STARTUP SCRIPT AND SHOULD NOT BE EDITED\", \"server\": \"$server\", \"login\": \"$login\",\"password\": \"$password\", \"webstrate\": \"$webstrate\", \"ssid\": \"$ssid\", \"ip\": \"$ip\", \"port\": \"$port\", \"mac\": \"$mac\", \"broadcastIP\": \"$broadcastIP\", \"stationIP\": \"$stationIP\", \"stationMAC\": \"$stationMAC\", \"os\":\"$os\", \"peripherals\":$usb, \"cpu\":\"$cpu\"}" > ../webstrate-pi-local-configuration.conf

fi
