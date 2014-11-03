<?php
	include_once("../config.php");
	/**
	* __Table 'item'__
	* defindex - a unique item ID as used by Valve
	* name - of course the name of the item
	* item_class - the type of item, for example player card or treasure chest
	* item_type_name - the type of item in display format
	* item_name - appears to be identical to name
	* item_description - a description of the item
	* item_quality - a quality ID (quality is strange etc...)
	* image_url - URL to the image
	* image_url_large - ...
	* used_by_heroes - the (one) hero that uses this item (if any).
	* item_rarity - name of the item's rarity
	* item_set - name of the item's set
	**/
	$sqlCreateString =
	"CREATE TABLE IF NOT EXISTS item 
	(
	defindex int NOT NULL,
	name varchar(1023),
	item_class varchar(255),
	item_type_name varchar(255),
	item_name varchar(255),
	item_description varchar(2047),
	item_quality int,
	image_url varchar(255),
	image_url_large varchar(255),
	used_by_heroes varchar(255),
	item_rarity varchar(255),
	item_set varchar(255),
	PRIMARY KEY (defindex)
	)";
	
	//conection:
	$link = mysqli_connect($db_host, $username, $password, $db_name) or die("Error " . mysqli_error($link));
	
	//consultation:
	
	$query = $sqlCreateString or die("Error in the consult.." . mysqli_error($link));
	
	//execute the query.
	
	$result = $link->query($query);
        
        $sqlCreateString =
	"CREATE TABLE IF NOT EXISTS hero 
	(
	heroid int NOT NULL,
	name varchar(1023),
        localized_name varchar(1023),
	PRIMARY KEY (heroid)
	)";
	
	//conection:
	$link = mysqli_connect($db_host, $username, $password, $db_name) or die("Error " . mysqli_error($link));
	
	//consultation:
	
	$query = $sqlCreateString or die("Error in the consult.." . mysqli_error($link));
	
	//execute the query.
	
	$result = $link->query($query);
	
?>