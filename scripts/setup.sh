#!/bin/bash
path=${PWD%webstrate*}webstrate-pi
# CHECKNING FOR ROOT/SUDO
if [ `whoami` != root ]; then
    echo "Please run this script as root or using sudo!"
	echo "If you are encountering this as part of a npm install, then please run the npm install as sudo or the script/setup.sh script on its own as sudo!"
    exit
fi

echo "We need to do a bit of work - go make a cup of coffes, it's gonna take a while!"

if [ -r /var/log/webstrate-pi ]; then
	echo "Log dir already exist. Continuing"
	rm -f /var/log/webstrate-pi/logs.log
	touch /var/log/webstrate-pi/logs.log
	chmod 666 /var/log/webstrate-pi/logs.log
	rm -f /var/log/webstrate-pi/errors.log
	touch /var/log/webstrate-pi/errors.log
	chmod 666 /var/log/webstrate-pi/errors.log
else
	echo "Creating log dir in /var/log/webstrate-pi"
	mkdir /var/log/webstrate-pi
	touch /var/log/webstrate-pi/logs.log
	chmod 666 /var/log/webstrate-pi/logs.log
	touch /var/log/webstrate-pi/errors.log
	chmod 666 /var/log/webstrate-pi/errors.log
fi

cat ${path}/scripts/initHeaderTemplate > webstrate-pi
printf "\npath=$path\n" >> webstrate-pi
cat ${path}/scripts/initScriptTemplate >> webstrate-pi
chmod 666 /etc/hostname 
cp ${path}/scripts/webstrate-pi /etc/init.d/webstrate-pi
chmod +x /etc/init.d/webstrate-pi
sudo update-rc.d webstrate-pi defaults

# INSTALL DEPENDENCIES
LIST_OF_DEPENDENCIES="mongodb tshark nmap libkrb5-dev matchbox" 
echo "Installing dependencies"
apt-get update
apt-get install -y $LIST_OF_DEPENDENCIES

if [ -r /boot ]; then
	if [ ! -f /boot/webstrate-pi.config ]; then
		echo "Generating configuration file in /boot"
		cp ${path}/config/config_template.txt /boot/webstrate-pi.config
	fi
else
	if [ ! -f ${path}/config/webstrate-pi.config ]; then
		echo "Generating configuration file in /webstrate-pi"
		cp ${path}/config/config_template.txt ${path}/config/webstrate-pi.config
	fi
fi

cp ${path}/bin/phantomjs /bin/



