<?php

/*

Webserver for local.here and the tomato USB AP http://tomatousb.org/

§place is the link to the particular information space this access point maps onto. The value will be a webstrate on the particular webstrate server of choice.

Example:
$place = "myOffice" will route to webstrateServerOfChoice.org/myOffice

*/


$place = "building";
$location = "firstfloor";

/*
$substrates contains the particular substrates used in the local information space. They will all create webstrates with the pattern $place.substrateName Most common are:

devices -> myOffice.devices -> where potential devices will appear (if told to) 
events -> myOffice.events -> where potential events are inserted (place-event model)
people -> myOffice.people -> where people might add their personal webstrates.

*/

$substrates = ["devices","events","people"];

/*

$server is the particular webstrate server used. If it has a basic auth login and password, this should be inserted within the url.

Without basic auth: http://server.com/
With basic auth: http://login:password@server.com/

NOTE: remeber to add  '/' in the end. Else the redirect below wont work
*/

$server = "<SERVER CONFIG>";

$substrate = str_replace(".here", "",$_SERVER[HTTP_HOST]);

$location = null;
if(in_array ($substrate , $substrates, true)){
	header('Location: ' . $server . $place . "." . $substrate, true, 301);
	exit();
} else if($substrate == "ap"){
	$sys = exec("cat /sys/class/net/eth0/address", $mac);
	$data = ['mac' => $mac[0],'place' => $place, 'location' => $location];
	
	header('Content-type: application/json');
	header('Access-Control-Allow-Origin: *');
	echo json_encode($data);
	exit();
} else if($substrate == "this"){
	$mac = exec("cat /sys/class/net/eth0/address", $result);
	$ip;
	if(!empty($_SERVER['HTTP_CLIENT_IP'])){
		$ip = $_SERVER['HTTP_CLIENT_IP'];
	} else if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
		$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	} else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}
	
	$macString = exec("arp -a ".$ip);
	$macArray = explode(" ",$macString);
	$clientMac = $macArray[3];
	$noise = exec("wl noise");
	$signal = exec("wl rssi ".$clientMac);
	$data = ['signal' => $signal, 'ip' => $ip];
	
	header('Content-type: application/json');
	header('Access-Control-Allow-Origin: *');
	echo json_encode($data);
	exit();
} else {
	header('Location: ' . $server . $place , true, 301);
	exit();
}

?>
