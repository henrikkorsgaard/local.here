#!/bin/bash

start(){
	
	cd /home/pi/webstrate-pi
	if [[ ! -f /boot/webstrate-pi.config ]] ; then
		echo "missing configuration file in /boot/webstrate-pi.config"
		cp webstrate-pi.config.template /boot/webstrate-pi.config
	fi

	source /boot/webstrate-pi.config

	if [[ -z $server || -z $login || -z $password || -z $webstrate || -z $port || -z $ssid || -z $wifi_password ]]; then
		echo "Incorrect configuration file /boot/webstrate-pi.config"
		systemctl stop webstrate-pi.service
		exit
	fi

	if [ -z "$(hostname | grep ^$webstrate)" ]; then
		echo "Changing hostname and restaring network service"
		printf $webstrate > /etc/hostname
		printf "127.0.0.1\tlocalhost\n" > /etc/hosts
		printf "127.0.0.1\t$webstrate" >> /etc/hosts
		hostname $webstrate
		sleep 1
	fi

	wpa_passphrase $ssid $wifi_password > /etc/wpa_supplicant/wpa_supplicant.conf
	systemctl start networking.service &
	sleep 1

	while [ `ifconfig wlan0 | grep -q "inet addr" ; echo $?` == 1 ]; do
		echo "waiting for IP on wlan0"
		sleep 2
	done

	ip=`ifconfig wlan0 | grep "inet addr" | awk 'sub(/addr:/, ""){print $2}'`
	station=${ip%.*}'.0'
	mac=`cat /sys/class/net/wlan0/address`

	# Setup mongodb in ram
	if [ ! -d /ramdata ] ; then
		mkdir /ramdata
	fi
	
	mount -t tmpfs -o size=64M tmpfs /ramdata/
	systemctl start mongodb
	
	sudo /home/pi/webstrate-pi/bin/horst -i wlan0 -N -p 4260 -q &>/dev/null &
	
	cd /home/pi/webstrate-pi/proximagic
	sudo java -jar ProxiMagicNode.jar &> /dev/null &
	
	#cd /home/pi/webstrate-pi
	#sudo ./bin/phantomjs --web-security=no webstrate-pi-headless.js "{\"ip\":\"$ip\", \"server\":\"$server\", \"port\":\"$port\", \"login\":\"$login\", \"password\":\"$password\", \"webstrate\":\"$webstrate\"}" &> /home/pi/log &
	
	sudo node /home/pi/webstrate-pi/server.js "{\"ip\":\"$ip\", \"station\":\"$station\", \"port\":\"$port\", \"mac\":\"$mac\", \"webstrate\":\"$webstrate\"}"
}

stop(){
	echo "Stopping!"
}


case $1 in
	start|stop) "$1" ;;
esac

