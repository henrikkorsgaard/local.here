#/bin/bash

xset -dpms
xset s off
xset s noblank

while true; do
	sudo matchbox-window-manager -use_cursor no -use_titlebar no &
	sudo -u pi epiphany-browser -a --profile ~/.config $1
done;
