#!/bin/bash

start(){
	
	echo "" > /home/pi/log
	
	cd /home/pi/proximagicYFI
	if [[ ! -f /boot/proximagic.config ]] ; then
		cp proximagic.config.template /boot/proximagic.config
		echo "Please configure proximagic via the config file in /boot/"
		exit
	fi

	source /boot/proximagic.config

	if [[ -z $name || -z $port || -z $ssid || -z $password ]]; then
		echo "Incorrect configuration file /boot/proximagic.config"
		exit
	fi

	if [ -z "$(hostname | grep ^$name)" ]; then
		echo "Changing hostname and restaring network service"
		printf $name > /etc/hostname
		printf "127.0.0.1\tlocalhost\n" > /etc/hosts
		printf "127.0.0.1\t$name" >> /etc/hosts
		hostname $name
		sleep 1
	fi

	sudo wpa_passphrase $ssid $password > /etc/wpa_supplicant/wpa_supplicant.conf
	sudo systemctl start networking.service &
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
		sudo mkdir /ramdata
	fi
	
	sudo mount -t tmpfs -o size=64M tmpfs /ramdata/
	sudo systemctl start mongodb
	
	sudo node /home/pi/proximagicYFI/server.js "{\"ip\":\"$ip\", \"station\":\"$station\", \"port\":\"$port\", \"mac\":\"$mac\", \"name\":\"$name\"}" &> /dev/null &
}
	cd /home/pi/proximagicYFI/proximagic
	sudo java -jar ProxiMagicNode.jar &> /dev/null &
	
	sudo horst -i wlan0 -N -p 4260 &>/dev/null &
	
	
	
	

stop(){
	echo "Stopping!"
}


case $1 in
	start|stop) "$1" ;;
esac

