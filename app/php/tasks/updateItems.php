<?php

ini_set('max_execution_time', 300);
ini_set('memory_limit','32M');

/**
 * This file is run to refresh the database's list of all Dota items.
 * */
include_once("../config.php");
$host = $config["db_host"];
$dbname = $config["db_name"];
$user = $config["username"];
$pass = $config["password"];
$DBH = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);

$schema_file = file_get_contents("http://api.steampowered.com/IEconItems_570/GetSchema/v0001/?language=en&key=" . $api_key);
$schema_json = json_decode($schema_file, true);

//Attempts to get items game url from schema. 
$items_game_url = $schema_json["result"]["items_game_url"];

function toJson($vdf_url) {
    //load json either from API call or fetching from file/url
    //no matter your method, $json must contain the data from items_game.txt
    $json = file_get_contents($vdf_url);

    //encapsulate in braces
    $json = "{\n$json\n}";

    //replace open braces
    $pattern = '/"([^"]*)"(\s*){/';
    $replace = '"${1}": {';
    $json = preg_replace($pattern, $replace, $json);

    //replace values
    $pattern = '/"([^"]*)"\s*"([^"]*)"/';
    $replace = '"${1}": "${2}",';
    $json = preg_replace($pattern, $replace, $json);

    //remove trailing commas
    $pattern = '/,(\s*[}\]])/';
    $replace = '${1}';
    $json = preg_replace($pattern, $replace, $json);

    //add commas
    $pattern = '/([}\]])(\s*)("[^"]*":\s*)?([{\[])/';
    $replace = '${1},${2}${3}${4}';
    $json = preg_replace($pattern, $replace, $json);

    //object as value
    $pattern = '/}(\s*"[^"]*":)/';
    $replace = '},${1}';
    $json = preg_replace($pattern, $replace, $json);

    return $json;
}

/**
 * Iterate over each item in Schema and insert into database.
 * */
$schema_items = $schema_json["result"]["items"];

$sqlInsertString = "INSERT INTO `item`(
		`defindex`, `name`, `item_class`, `item_type_name`, `item_name`,
		`item_description`, `item_quality`, `image_url`, `image_url_large`, `date_added`
		)
		VALUES(
                :defindex, :name, :item_class, :item_type_name, :item_name,
		:item_description, :item_quality, :image_url, :image_url_large, CURDATE()
		) 
		on duplicate key update
		`name` = values(`name`),
		`item_class` = values(`item_class`),
		`item_type_name` = values(`item_type_name`),
		`item_name` = values(`item_name`),
		`item_description` = values(`item_description`),
		`item_quality` = values(`item_quality`),
		`image_url` = values(`image_url`),
		`image_url_large` = values(`image_url_large`);";

$stmt = $DBH->prepare($sqlInsertString);
$stmt->bindParam(':defindex', $defindex);
$stmt->bindParam(':name', $name);
$stmt->bindParam(':item_class', $item_class);
$stmt->bindParam(':item_type_name', $item_type_name);
$stmt->bindParam(':item_name', $item_name);
$stmt->bindParam(':item_description', $item_description);
$stmt->bindParam(':item_quality', $item_quality);
$stmt->bindParam(':image_url', $image_url);
$stmt->bindParam(':image_url_large', $image_url_large);
foreach ($schema_items as $item) {
    $defindex = $item["defindex"];
    $name = isset($item["name"]) ? $item["name"] : "";
    $item_class = isset($item["item_class"]) ? $item["item_class"] : "";
    $item_type_name = isset($item["item_type_name"]) ? $item["item_type_name"] : "";
    $item_name = isset($item["item_name"]) ? $item["item_name"] : "";
    $item_description = isset($item["item_description"]) ? $item["item_description"] : "";
    $item_quality = isset($item["item_quality"]) ? $item["item_quality"] : "";
    $image_url = isset($item["image_url"]) ? $item["image_url"] : "";
    $image_url_large = isset($item["image_url_large"]) ? $item["image_url_large"] : "";
    $stmt->execute();
}


$items_game_json = json_decode(toJson($items_game_url), true);
echo $items_game_json;

/**
 * Iterate over each item in items_game and insert into database.
 * Specifically: item_rarity, item_set and used_by_heroes.
 * */
$items_game_items = $items_game_json["items_game"]["items"];
while ($item = current($items_game_items)) {
    $defindex = key($items_game_items);
    $item_rarity = isset($item["item_rarity"]) ? $item["item_rarity"] : "common";
    $item_set = isset($item["item_set"]) ? $item["item_set"] : "";
    $used_by_heroes = "";
    if (isset($item["used_by_heroes"])) {
        $used_by_heroes = is_string($item["used_by_heroes"]) ? "" : key($item["used_by_heroes"]);
    }

    $sqlInsertString = "UPDATE `item` 
		SET `item_rarity` = :item_rarity,
		`item_set` = :item_set,
		`used_by_heroes` = :used_by_heroes
		WHERE `defindex` = :defindex ;";

    $stmt = $DBH->prepare($sqlInsertString);
    $stmt->bindParam(':item_rarity', $item_rarity);
    $stmt->bindParam(':item_set', $item_set);
    $stmt->bindParam(':used_by_heroes', $used_by_heroes);
    $stmt->bindParam(':defindex', $defindex);
    $stmt->execute();
    
    next($items_game_items);
}

?>