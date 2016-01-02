#!/bin/bash
path=$1
configFile=${path}/config/webstrate-pi.config

# Checking if configuration file exist in /boot
if [ -r /boot/webstrate-pi.config ]; then
	echo "Reading configuraton from /boot/webstrate-pi.config"
	configFile='/boot/webstrate-pi.config'
fi

# Sourcing configuration file
source $configFile

# Checking if configuration files is sufficient
if [[ "$server" == "" || "$login" == "" || "$password" == "" || "$webstrate" == "" || "$port" == "" || "$ssid" == "" || "$wifi_password" == "" ]]
then
	echo "Error reading configuration file!"
	exit
fi

if [ -n "$(hostname | grep ^$webstrate$)" ]; then
	echo "Hostname is already set as $webstrate"
else
	echo "Updating hostname to to $webstrate"
	echo $webstrate > /etc/hostname
	printf "127.0.0.1\tlocalhost\n" > /etc/hosts
	printf "::1\t\tlocalhost ip6-localhost ip6-loopback\n" >> /etc/hosts
	printf "ff02::1\t\tip6-allnodes\n" >> /etc/hosts
	printf "ff02::2\t\tip6-allrouters\n" >> /etc/hosts
	printf "127.0.0.1\t$webstrate\n" >> /etc/hosts
	sudo hostname $webstrate
	sudo /etc/init.d/networking restart
	sleep 5
fi

# Setting up wlan link
if [ -n "$(iw dev wlan0 link | grep $ssid)" ]; then
	echo "Wlan0 is already setup and running on $ssid"
else
	echo "Updating network configuration"
	wpa_passphrase $ssid $wifi_password > /etc/wpa_supplicant/wpa_supplicant.conf
	sudo /etc/init.d/networking restart
	ifup wlan0
	sleep 5
fi

# Setting up monitor device for tspark
if [ -n "$(ifconfig | grep mon0)" ];then
	echo "Monitor device (mon0) already up!"
else
	echo "Setting up monitor device (mon0)"
	sudo iw wlan0 interface add mon0 type monitor
	sudo ip link set mon0 up
fi

if [ -n "$(tvservice -s | grep HDMI)" ];then
	echo "Setting up chrome on HDMI kiosk"
	sudo -u pi xinit ${path}/scripts/browser.sh http://$login:$password@${server#*//}/$webstrate &
fi

echo "starting ${path}/webstrate-pi.js"
sudo node ${path}/webstrate-pi.js > /var/log/webstrate-pi/logs.log 2> /var/log/webstrate-pi/errors.log
