<?php

include_once("../config.php");

$url = "http://api.steampowered.com/IEconDOTA2_570/GetHeroes/v0001/?key=1FD7302C211037A29D9E9C80D3C130FE&language=en_us";
	
$heroes_json = json_decode(file_get_contents($url), true);
	
//conection to MYSQL:
$link = mysqli_connect($db_host, $username, $password, $db_name) or die("Error " . mysqli_error($link));

/**
* Iterate over each item in Schema and insert into database.
**/
$heroes = $heroes_json["result"]["heroes"];
foreach($heroes as $hero){
    $heroid = mysqli_escape_string($link, $hero["id"]);
    $name = mysqli_escape_string($link, $hero["name"]);
    $localized_name = mysqli_escape_string($link, $hero["localized_name"]);
    $sqlInsert = 
    "INSERT INTO `hero`
    (
    `heroid`,
    `name`,
    `localized_name`
    )
    VALUES
    (
    $heroid,
    '$name',
    '$localized_name'
    )";
    
    $query = $sqlInsert or die("Error in the consult.." . mysqli_error($link));
    $result = $link->query($query);
    echo $result;
}

?>
