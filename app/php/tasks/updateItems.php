<?php
ini_set('max_execution_time', 300);

/**
 * This file is run to refresh the database's list of all Dota items.
 * */
include_once("../config.php");

$schema_file = file_get_contents("http://api.steampowered.com/IEconItems_570/GetSchema/v0001/?language=en&key=" . $api_key);
$schema_json = json_decode($schema_file, true);

//Attempts to get items game url from schema. Usually fails.
$items_game_url = $schema_json["result"]["items_game_url"];
echo "Schema-retrieved URL: " . $items_game_url;

//$items_game_url = "http://media.steampowered.com/apps/570/scripts/items/items_game.8a8e57c59ad4dac1a44d48c0fd7d20488054bcdd.txt";

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

//conection to MYSQL:
$link = mysqli_connect($db_host, $username, $password, $db_name) or die("Error " . mysqli_error($link));

/**
 * Iterate over each item in Schema and insert into database.
 * */
$schema_items = $schema_json["result"]["items"];
foreach ($schema_items as $item) {
    $defindex = $item["defindex"];
    $name = isset($item["name"]) ? $item["name"] : "";
    $name = mysqli_real_escape_string($link, $name);
    $item_class = isset($item["item_class"]) ? $item["item_class"] : "";
    $item_class = mysqli_real_escape_string($link, $item_class);
    $item_type_name = isset($item["item_type_name"]) ? $item["item_type_name"] : "";
    $item_type_name = mysqli_real_escape_string($link, $item_type_name);
    $item_name = isset($item["item_name"]) ? $item["item_name"] : "";
    $item_name = mysqli_real_escape_string($link, $item_name);
    $item_description = isset($item["item_description"]) ? $item["item_description"] : "";
    $item_description = mysqli_real_escape_string($link, $item_description);
    $item_quality = isset($item["item_quality"]) ? $item["item_quality"] : "";
    $item_quality = mysqli_real_escape_string($link, $item_quality);
    $image_url = isset($item["image_url"]) ? $item["image_url"] : "";
    $image_url = mysqli_real_escape_string($link, $image_url);
    $image_url_large = isset($item["image_url_large"]) ? $item["image_url_large"] : "";
    $image_url_large = mysqli_real_escape_string($link, $image_url_large);

    $sqlInsert = "INSERT INTO `item`
		(
		`defindex`,
		`name`,
		`item_class`,
		`item_type_name`,
		`item_name`,
		`item_description`,
		`item_quality`,
		`image_url`,
		`image_url_large`,
                `date_added`
		)
		VALUES
		(
		$defindex,
		'$name',
		'$item_class',
		'$item_type_name',
		'$item_name',
		'$item_description',
		$item_quality,
		'$image_url',
		'$image_url_large',
                CURDATE()
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

    $query = $sqlInsert or die("Error in the consult.." . mysqli_error($link));
    $result = $link->query($query);
}

$items_game_json = json_decode(toJson($items_game_url), true);

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

    $sqlInsert = "UPDATE `item` 
		SET `item_rarity` = '$item_rarity',
		`item_set` = '$item_set',
		`used_by_heroes` = '$used_by_heroes'
		WHERE `defindex` = $defindex;";

    $query = $sqlInsert or die("Error in the consult.." . mysqli_error($link));
    $result = $link->query($query);

    next($items_game_items);
}

mysqli_close($link);
?>