#!/bin/bash
echo 'Setting up webstrate-pi' > /var/log/webstrate-pi.log

# Checking if configuration file exist in /boot
if [ -r /boot/webstrate-pi.config ]; then
	echo "Reading configuraton from /boot/webstrate-pi.config"
	configFile='/boot/webstrate-pi.config'
else
	echo "Error reading configuration file!" >> /var/log/webstrate-pi.log
	exit
fi

# Sourcing configuration file
source $configFile

# Checking if configuration files is sufficient
if [[ "$server" == "" || "$login" == "" || "$password" == "" || "$webstrate" == "" || "$port" == "" || "$ssid" == "" || "$wifi_password" == "" ]]
then
	echo "Error reading configuration file!" >> /var/log/webstrate-pi.log
	exit
fi

ip=`ifconfig | grep 'wlan0' -A2 | grep 'inet addr' | awk '/inet addr/{print substr($2,6)}'`
station=${ip%.*}'.0'

# Setting up wlan link
if [ -n "$(iw dev wlan0 link | grep $ssid)" ]; then
	echo "Wlan0 is already setup and running on $ssid" >> /var/log/webstrate-pi.log
else
	echo "Updating network configuration" >> /var/log/webstrate-pi.log 
	wpa_passphrase $ssid $wifi_password > /etc/wpa_supplicant/wpa_supplicant.conf
	sudo /etc/init.d/networking restart
	ifup wlan0
	sleep 10
fi

if [ -n "$(hostname | grep ^$webstrate$)" ]; then
	echo "Hostname is already set as $webstrate" >> /var/log/webstrate-pi.log 
else
	echo "Updating hostname to to $webstrate" >> /var/log/webstrate-pi.log
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

sudo /home/pi/webstrate-pi/bin/horst -i wlan0 -N -p 4260 &> /dev/null &

cd /home/pi/webstrate-pi/proximagic
sudo java -jar ProxiMagicNode.jar &> /dev/null &

sudo node /home/pi/webstrate-pi/webstrate-pi.js "{\"ip\":\"$ip\", \"station\":\"$station\", \"port\":\"$port\"}" &> /var/log/webstrate-pi.log &

cd /home/pi/webstrate-pi
sudo ./bin/phantomjs --web-security=no webstrate-pi-headless.js "{\"ip\":\"$ip\", \"server\":\"$server\", \"port\":\"$port\", \"login\":\"$login\", \"password\":\"$password\", \"webstrate\":\"$webstrate\"}" &> /var/log/webstrate-pi.log &
