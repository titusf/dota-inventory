<?php

ini_set('max_execution_time', 0);

// http://steamcommunity.com/market/priceoverview/?country=US&currency=3&appid=730&market_hash_name=StatTrak%E2%84%A2%20P250%20%7C%20Steel%20Disruption%20%28Factory%20New%29
//For each item in the database: get market price.
/*
 *  {
  "success": true,
  "lowest_price": "1,43&#8364; ",
  "volume": "562",
  "median_price": "1,60&#8364; "
  }
 */

echo "Script started: ".date("H:i:s")."<br/>";

include_once("../config.php");
$host = $config["db_host"];
$dbname = $config["db_name"];
$user = $config["username"];
$pass = $config["password"];
$DBH = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);

function formatPrice($price_result) {
    return preg_replace('/[^0-9]/', '', html_entity_decode($price_result));
}

$stmt = $DBH->prepare("SELECT * FROM `item` WHERE `defindex` > 1000");
$stmt->execute();
$results = $stmt->fetchAll();

// Setup the query to insert market values.
$insert_query = "INSERT INTO `item_prices`(`defindex`, `lowest_price`, `median_price`, `volume`, `date_fetched`)
            VALUES(:defindex, :lowest_price, :median_price, :volume, NOW())";
$stmt = $DBH->prepare($insert_query);
$stmt->bindParam(':defindex', $defindex);
$stmt->bindParam(':lowest_price', $lowest_price);
$stmt->bindParam(':median_price', $median_price);
$stmt->bindParam(':volume', $volume);
// Iterate over each item from the DB.
$successCount = 0;
$attemptCount = 0;
foreach ($results as $result) {
    $attemptCount++;
    $defindex = $result['defindex'];
    $item_name = $result['name'];
    echo "<strong>$defindex</strong> - $item_name <br/>";
    $url = "http://steamcommunity.com/market/priceoverview/?currency=1&appid=570&market_hash_name=" . rawurlencode($item_name);
    echo "getting contents of: " . $url . "<br />";
    $json_file = @file_get_contents($url);
    $json_decoded = json_decode($json_file);
    if (isset($json_decoded->success)) {
        if ($json_decoded->success) {
            $successCount++;
            $lowest_price = isset($json_decoded->lowest_price) ? formatPrice($json_decoded->lowest_price) : null;
            $median_price = isset($json_decoded->median_price) ? formatPrice($json_decoded->median_price) : null;
            $volume = isset($json_decoded->volume) ? formatPrice($json_decoded->volume) : null;
            echo "Currently worth " . $median_price . "<br />";
            $stmt->execute();
        } else {
            echo "<span style='font-color:red;'>Market Get Fail</span>";
        }
    } else {
        echo "<p style='color:red;'>Success Not Set. File contents appear as: </p>";
        echo $json_file;
    }
    echo "--------------------------------------------------------- <br/>";
}
echo "<strong>".$successCount."</strong> items scraped (out of $attemptCount) <br/>";
echo "Script finished: ".date("H:i:s");
