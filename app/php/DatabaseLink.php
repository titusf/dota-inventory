<?php

class DatabaseLink {

    private $config;
    private $DBH;

    function __construct() {
        require($_SERVER['DOCUMENT_ROOT'] . 'dotainventory2/app/php/config.php');
        $this->config = $config;
        $host = $this->config["db_host"];
        $dbname = $this->config["db_name"];
        $user = $this->config["username"];
        $pass = $this->config["password"];
        $this->DBH = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'"));
    }

    function __destruct() {
        $this->DBH = null;
    }

    //Returns a resultset.
    private function runQuery($query) {
        $mysqli = new mysqli($this->config["db_host"], $this->config["username"], $this->config["password"], $this->config["db_name"]);
        $query = $mysqli->real_escape_string($query);
        $result = $mysqli->query($query);
        if ($result == false) {
            throw new Exception($mysqli->error . " SQL: " . $query);
        }
        $mysqli->close();
        return $result;
    }

    public function insertTrade($defindex, $steamid, $message) {
        try {
            $query = "INSERT INTO `trades`(`defindex`, `steamid`, `message`, `date_submitted`)
                VALUES (:defindex, :steamid, :message, NOW())";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->bindParam(':steamid', $steamid);
            $stmt->bindParam(':message', $message);
            $stmt->execute();
        } catch (Exception $ex) {
            throw new Exception("Database:addTrade error: " . $ex->getMessage());
        }
    }

    public function insertWishListItem($defindex, $steamid) {
        try {
            $query = "INSERT INTO `user_wantlist`(`steamid`, `defindex`)
                VALUES (:steamid, :defindex)";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
        } catch (Exception $ex) {
            throw new Exception("Database:insertWishListItem error: " . $ex->getMessage());
        }
    }

    public function selectWishListItems($steamid) {
        try {
            $query = "SELECT i.* FROM `user_wantlist` want
                INNER JOIN `item` i ON want.defindex = i.defindex
                WHERE `steamid` = :steamid";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            
        }
    }

    public function deleteWishListItem($steamid, $defindex) {
        $query = "DELETE FROM `user_wantlist` WHERE `steamid` = :steamid AND `defindex` = :defindex";
        $stmt = $this->DBH->prepare($query);
        $stmt->bindParam(':steamid', $steamid);
        $stmt->bindParam(':defindex', $defindex);
        $stmt->execute();
    }

    public function deleteWishList($steamid) {
        $query = "DELETE FROM `user_wantlist` WHERE `steamid` = :steamid";
        $stmt = $this->DBH->prepare($query);
        $stmt->bindParam(':steamid', $steamid);
        $stmt->execute();
    }

    /**
     * Retrieves the active trade listing for this item that belongs to this
     * user IF the trade exists and is NEWER than the trade-life timer. 
     * @param type $defindex
     * @param type $steamid
     */
    public function selectActiveItemTradeByUser($defindex, $steamid) {
        try {
            $hrsOld = 48;
            $query = "SELECT * FROM `trades`
                    WHERE TIMESTAMPDIFF(HOUR, `date_submitted`, NOW()) <= :hrsOld 
                    AND `defindex` = :defindex AND `steamid` = :steamid";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':hrsOld', $hrsOld);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            throw new Exception("Database:selectActiveItemTradeByUser error: " . $ex->getMessage());
        }
    }

    public function selectLatestTrades() {
        try {
            $query = "SELECT * FROM `trades`
                    WHERE TIMESTAMPDIFF(HOUR, `date_submitted`, NOW()) <= 48 
                    ORDER BY `date_submitted` DESC
                    LIMIT 100";
            $stmt = $this->DBH->prepare($query);
            //$stmt->bindParam(':hrsOld', '48');
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            
        }
    }

    public function selectItemTrades($defindex) {
        try {
            $hrsOld = 48; // Only select trades less than 48 hours old.
            $query = "SELECT * FROM `trades` 
                    WHERE TIMESTAMPDIFF(HOUR, `date_submitted`, NOW()) <= :hrsOld AND `defindex` = :defindex
                    ORDER BY `date_submitted` DESC
                    LIMIT 100";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':hrsOld', $hrsOld);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            throw new Exception("Database:getItemTrades error: " . $ex->getMessage());
        }
    }

    public function getUserTrades($steamid) {
        //Later
    }

    public function selectAllMountItems() {
        try {
            $query = "SELECT * FROM `item` 
                        WHERE `item_type_name` 
                        IN ('warhorse', 'horse', 'my demonic warhorse', 'bat', 'riding cat', 'beast', 'noble beast' 'lizard')
                        OR `item_type_name` LIKE '%mount'";
            $stmt = $this->DBH->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            
        }
    }

    public function selectAllCourierItems() {
        try {
            $query = "SELECT * FROM `item` 
                        WHERE `item_type_name` 
                        LIKE '%courier'";
            $stmt = $this->DBH->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            
        }
    }

    /**
     * Most interesting values for item_type_name except mount and courier are:
     * Taunt: 'taunt'
     * Loading Screen: 'Loading Screen'
     * @param type $item_type_name
     */
    public function selectItemsByType($item_type_name) {
        try {
            $query = "SELECT * FROM `item` 
                        WHERE `item_type_name` = :item_type_name";
            $stmt = $this->DBH->prepare($query);
            $stmt->bindParam(':item_type_name', $item_type_name);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            
        }
    }

    public function getItem($defindex) {
        try {
            $string = 'SELECT item.item_name, item.item_class, item.item_rarity, item.item_type_name,'
                    . ' item.item_description, item.image_url, item.item_set, hero.localized_name AS hero_name, hero.name AS npc_hero_name'
                    . ' FROM  `item`'
                    . ' LEFT JOIN `hero` ON item.used_by_heroes = hero.name WHERE `defindex` = :defindex';
            $stmt = $this->DBH->prepare($string);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $e) {
            throw new Exception("Database:getItem error: " . $e->getMessage());
        }
    }

    //Value is in USD
    public function getItemValue($defindex) {
        try {
            $string = "SELECT `lowest_price`, `median_price`, `date_fetched`
                    FROM `item_prices` WHERE `defindex` = :defindex";
            $stmt = $this->DBH->prepare($string);
            $stmt->bindParam(':defindex', $defindex);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        } catch (Exception $ex) {
            throw new Exception("Database:getItemValue error: " . $e->getMessage());
        }
    }

    //DEPRECATED.
    public function getAllItems() {
        require_once("ItemModel.php");
        $result = $this->runQuery("SELECT `defindex`, `name`, `item_class`, `item_name`, `image_url`, `used_by_heroes`, `item_rarity`, `item_set` FROM `item` WHERE `defindex`>=4000 AND `item_class` <>  'bundle' ");
        $items = mysqli_fetch_all($result, MYSQLI_ASSOC);
        return $items;
    }

    public function getAllHeroes() {
        $result = $this->runQuery("SELECT * FROM `hero` ORDER BY `localized_name`");
        $heroes = array();
        while ($row = mysqli_fetch_array($result)) {
            $heroes[$row["name"]] = $row["localized_name"];
        }
        return $heroes;
    }

    public function logUser($steamid) {
        $this->runQuery("INSERT INTO `log`( steamid ) VALUES ( '$steamid' )");
    }

    public function getLogsForUser($steamid) {
        $result = $this->runQuery("SELECT * FROM `log` WHERE `steamid` = '$steamid'");
        $results = array();
        while ($row = mysqli_fetch_array($result)) {
            $results[$row["id"]] = $row["timestamp"];
        }
        return $results;
    }

    /*     * Ground level SQL statements - for other functions to be built upon. 
     * -------------------------------------------------------------------- * */

//    public function insertInventory($items_assoc, $steamid) {
//        if (count($items_assoc) > 0) {
//            $sql_values = array();
//            $sql_itemids = array();
//            foreach ($items_assoc as $item) {
//                $sql_values[] = '(' . $item['id'] . ', ' . $item['defindex'] . ', ' . $steamid . ')';
//                $sql_itemids[] = $item['id'];
//            }
//            $string1 = 'DELETE FROM `user_inventory` WHERE `steamid` =' . $steamid . ' AND `itemid` NOT IN (' . implode(',', $sql_itemids) . ');';
//            $string2 = ' INSERT INTO `user_inventory`(`itemid`, `defindex`, `steamid`) VALUES ' . implode(',', $sql_values) . ' ON DUPLICATE KEY UPDATE `itemid` = `itemid`;';
//            $this->runQuery($string1);
//            $this->runQuery($string2);
//        }
//        $this->setInventoryUpdatedNow($steamid);
//    }

    public function insertInventory($items_assoc, $steamid) {
        $this->deleteInventory($steamid);
        $stmt = $this->DBH->prepare(
                "INSERT INTO `user_inventory`(`itemid`, `defindex`, `steamid`)
                    VALUES (:itemid, :defindex, :steamid)"
        );
        $stmt->bindParam(':itemid', $itemid);
        $stmt->bindParam(':defindex', $defindex);
        $stmt->bindParam(':steamid', $steamid);
        foreach ($items_assoc as $item) {
            $itemid = $item['id'];
            $defindex = $item['defindex'];
            $stmt->execute();
        }
        $this->setInventoryUpdatedNow($steamid);
    }

    public function deleteInventory($steamid) {
        $stmt = $this->DBH->prepare(
                "DELETE FROM `user_inventory` WHERE `steamid` = :steamid"
        );
        $stmt->bindParam(':steamid', $steamid);
        $stmt->execute();
    }

//    public function insertUsers($summaries_assoc) {
//        try {
//            $sql = array();
//            foreach ($summaries_assoc as $player_summary) {
//                $steamid = isset($player_summary['steamid']) ? mysqli_real_escape_string($player_summary['steamid']) : "";
//                $personaname = isset($player_summary['personaname']) ? mysqli_real_escape_string($player_summary['personaname']) : "";
//                $communityvisibilitystate = isset($player_summary['communityvisibilitystate']) ? mysqli_real_escape_string($player_summary['communityvisibilitystate']) : "";
//                $profilestate = isset($player_summary['profilestate']) ? mysqli_real_escape_string($player_summary['profilestate']) : "NULL";
//                $profileurl = isset($player_summary['profileurl']) ? mysqli_real_escape_string($player_summary['profileurl']) : "";
//                $avatar = isset($player_summary['avatar']) ? mysqli_real_escape_string($player_summary['avatar']) : "";
//                $avatarmedium = isset($player_summary['avatarmedium']) ? mysqli_real_escape_string($player_summary['avatarmedium']) : "";
//                $avatarfull = isset($player_summary['avatarfull']) ? mysqli_real_escape_string($player_summary['avatarfull']) : "";
//
//                $sql[] = "(" . $steamid . ", '" . $personaname . "', " . $communityvisibilitystate . ", " . $profilestate . ", '"
//                        . $profileurl . "', '" . $avatar . "', '" . $avatarmedium . "', '" . $avatarfull . "', NOW())";
//            }
//            if (count($sql) == 0) {
//                die();
//            }
//            $string = 'INSERT INTO `user`(`steamid`, `personaname`, `community_visibility_state`, '
//                    . '`profile_state`, `profile_url`, `avatar_url`, `avatar_medium_url`, `avatar_full_url`, `last_updated`)'
//                    . ' VALUES ' . implode(', ', $sql)
//                    . ' ON DUPLICATE KEY UPDATE `personaname` = VALUES(`personaname`),'
//                    . ' `community_visibility_state` = VALUES(`community_visibility_state`),'
//                    . ' `profile_state` = VALUES(`profile_state`),'
//                    . ' `profile_url` = VALUES(`profile_url`),'
//                    . ' `avatar_url` = VALUES(`avatar_url`),'
//                    . ' `avatar_medium_url` = VALUES(`avatar_medium_url`),'
//                    . ' `avatar_full_url` = VALUES(`avatar_full_url`)'
//                    . ' `last_updated` = NOW()';
//            $this->runQuery($string);
//        } catch (Exception $e) {
//            throw new Exception("Database:insertUsers error: " . $e->getMessage());
//        }
//    }

    public function insertUser($playerSummary, $isFriend) {
        try {
            $stmt_arr = array(
                ':steamid' => isset($playerSummary['steamid']) ? $playerSummary['steamid'] : "",
                ':personaname' => isset($playerSummary['personaname']) ? $playerSummary['personaname'] : "",
                ':community_vis_state' => isset($playerSummary['communityvisibilitystate']) ? $playerSummary['communityvisibilitystate'] : "",
                ':profile_state' => isset($playerSummary['profilestate']) ? $playerSummary['profilestate'] : "NULL",
                ':profile_url' => isset($playerSummary['profileurl']) ? $playerSummary['profileurl'] : "",
                ':avatar_url' => isset($playerSummary['avatar']) ? $playerSummary['avatar'] : "",
                ':avatar_medium' => isset($playerSummary['avatarmedium']) ? $playerSummary['avatarmedium'] : "",
                ':avatar_full' => isset($playerSummary['avatarfull']) ? $playerSummary['avatarfull'] : "",
                ':shallow_update' => $isFriend
            );
            $stmt = $this->DBH->prepare(
                    "INSERT INTO `user`(`steamid`, `personaname`, `community_visibility_state`, 
                    `profile_state`, `profile_url`, `avatar_url`, `avatar_medium_url`, `avatar_full_url`, `last_updated`, `shallow_update`)
                     VALUES (:steamid, :personaname, :community_vis_state, :profile_state, :profile_url, 
                    :avatar_url, :avatar_medium, :avatar_full, NOW(), :shallow_update) 
                    ON DUPLICATE KEY UPDATE `steamid` = VALUES(`steamid`), 
                    `personaname` = VALUES(`personaname`), 
                    `community_visibility_state` = VALUES(`community_visibility_state`), 
                    `profile_state` = VALUES(`profile_state`), 
                    `profile_url` = VALUES(`profile_url`), 
                    `avatar_url` = VALUES(`avatar_url`), 
                    `avatar_medium_url` = VALUES(`avatar_medium_url`), 
                    `avatar_full_url` = VALUES(`avatar_full_url`), 
                    `last_updated` = VALUES(`last_updated`),
                    `shallow_update` = VALUES(`shallow_update`)"
            );
            $stmt->execute($stmt_arr);
            $this->setProfileUpdatedNow($playerSummary['steamid']);
        } catch (Exception $e) {
            error_log("oops" . $e->getMessage());
            throw new Exception("Insert User error: " . $e->getMessage());
        }
    }

    private function setProfileUpdatedNow($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "INSERT INTO `user_updates`(`steamid`, `profile_last_updated`)
                     VALUES (:steamid, NOW())
                     ON DUPLICATE KEY UPDATE `steamid` = VALUES(`steamid`),
                     `profile_last_updated` = VALUES(`profile_last_updated`)"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
        } catch (Exception $ex) {
            error_log("Profile Updated Time Error");
            throw new Exception("Profile Updated Time Error: " . $e->getMessage());
        }
    }

    private function setFriendslistUpdatedNow($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "INSERT INTO `user_updates`(`steamid`, `friendslist_last_updated`)
                     VALUES (:steamid, NOW())
                     ON DUPLICATE KEY UPDATE `steamid` = VALUES(`steamid`),
                     `friendslist_last_updated` = VALUES(`friendslist_last_updated`)"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
        } catch (Exception $ex) {
            error_log("Profile Updated Time Error");
            throw new Exception("Friendslist Updated Time Error: " . $e->getMessage());
        }
    }

    private function setInventoryUpdatedNow($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "INSERT INTO `user_updates`(`steamid`, `inventory_last_updated`)
                     VALUES (:steamid, NOW())
                     ON DUPLICATE KEY UPDATE `steamid` = VALUES(`steamid`),
                     `inventory_last_updated` = VALUES(`inventory_last_updated`)"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
        } catch (Exception $ex) {
            error_log("Profile Updated Time Error");
            throw new Exception("Profile Updated Time Error: " . $e->getMessage());
        }
    }

    public function getHrsSinceProfileUpdate($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "SELECT TIMESTAMPDIFF(HOUR, `profile_last_updated`, NOW()) as `last_updated_hrs` 
                     FROM `user_updates`
                     WHERE `steamid` = :steamid"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($result) > 0) {
                return $result[0]['last_updated_hrs'];
            }
            return null;
        } catch (Exception $ex) {
            
        }
    }

    public function getHrsSinceFriendslistUpdate($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "SELECT TIMESTAMPDIFF(HOUR, `friendslist_last_updated`, NOW()) as `last_updated_hrs` 
                     FROM `user_updates`
                     WHERE `steamid` = :steamid"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($result) > 0) {
                return $result[0]['last_updated_hrs'];
            }
        } catch (Exception $ex) {
            
        }
    }

    public function getHrsSinceInventoryUpdate($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "SELECT TIMESTAMPDIFF(HOUR, `inventory_last_updated`, NOW()) as `last_updated_hrs` 
                     FROM `user_updates`
                     WHERE `steamid` = :steamid"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($result) > 0) {
                return $result[0]['last_updated_hrs'];
            }
        } catch (Exception $ex) {
            
        }
    }

    public function insertUsers($playerSummaries) {
        foreach ($playerSummaries as $playerSummary) {
            $this->insertUser($playerSummary);
        }
    }

//    public function insertFriendList($user_steamid, $friends_assoc) {
//        $this->deleteFriendsList($user_steamid);
//        try {
//            $sql = array();
//            foreach ($friends_assoc as $friend) {
//                $sql[] = '(' . $user_steamid . ',' . $friend['steamid'] . ')';
//            }
//            $string = 'INSERT INTO `user_friends` (`user_steamid`, `friend_steamid`) VALUES ' . implode(',', $sql)
//                    . 'ON DUPLICATE KEY UPDATE `user_steamid` = VALUES(`user_steamid`),'
//                    . '`friend_steamid` = VALUES(`friend_steamid`)';
//            $this->runQuery($string);
//            $this->setFriendslistUpdatedNow($user_steamid);
//        } catch (Exception $e) {
//            error_log("Database:insertFriendList error: " . $e->getMessage());
//            throw new Exception("Database:insertFriendList error: " . $e->getMessage());
//        }
//    }

    public function insertFriendList($steamid, $friends_assoc) {
        try {
            $this->deleteFriendsList($steamid);
            $stmt = $this->DBH->prepare(
                    "INSERT INTO `user_friends`(`user_steamid`, `friend_steamid`)
                     VALUES (:user_steamid, :friend_steamid)"
            );
            $stmt->bindParam(':user_steamid', $steamid);
            $stmt->bindParam(':friend_steamid', $friend_steamid);
            foreach ($friends_assoc as $friend) {
                $friend_steamid = $friend['steamid'];
                $stmt->execute();
            }
        } catch (Exception $ex) {
            throw new Exception("Database:insertFriendList error: " . $ex->getMessage());
        }
    }

    public function setShallowUpdate($steamid, $isShallowUpdate) {
        try {

            $string = 'UPDATE `user`
                        SET `shallow_update` = :isShallowUpdate
                        WHERE `steamid` = :steamid';
            $stmt = $this->DBH->prepare($string);
            $stmt->bindParam(':isShallowUpdate', $isShallowUpdate);
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
        } catch (Exception $ex) {
            error_log("SetShallowUpdate error: " . $ex->getMessage());
            throw new Exception("Database:setShallowUpdate error");
        }
    }

    public function selectRecentlyUpdatedUsers() {
        try {
            $stmt = $this->DBH->prepare(
                    "SELECT * FROM `user` 
                    ORDER BY `last_updated` DESC
                    LIMIT 10"
            );
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $ex) {
            throw new Exception("Database:selectRecentlyUpdatedUsers error: " . $e->getMessage());
        }
    }

    public function selectFriendsList($user_steamid) {
        try {
            $string = 'SELECT `user`.* FROM `user` '
                    . 'INNER JOIN `user_friends` '
                    . 'ON `user_friends`.`friend_steamid` = `user`.`steamid` '
                    . 'WHERE `user_friends`.`user_steamid` = :steamid';
            $stmt = $this->DBH->prepare($string);
            $stmt->bindParam(':steamid', $user_steamid);
            $stmt->execute();
            $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $fetch_assoc;
        } catch (Exception $e) {
            error_log("Database:selectFriendsList error");
            throw new Exception("Database:selectFriendsList error: " . $e->getMessage());
        }
    }

    public function selectFriendslistSteamids($steamid) {
        try {
            $stmt = $this->DBH->prepare(
                    "SELECT `friend_steamid` FROM `user_friends` 
                     WHERE `user_steamid` = :steamid"
            );
            $stmt->bindParam(':steamid', $steamid);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $ex) {
            throw new Exception("Database:selectFriendsList error: " . $e->getMessage());
        }
    }

    private function deleteFriendsList($user_steamid) {
        $string = 'DELETE FROM `user_friends` WHERE `user_steamid` = :steamid';
        $stmt = $this->DBH->prepare($string);
        $stmt->bindParam(':steamid', $user_steamid);
        $stmt->execute();
    }

//    public function selectUsers($steamid_assoc) {
//        $string = 'SELECT * FROM `user` WHERE `steamid` IN (' . implode(',', $steamid_assoc) . ')';
//        try {
//            $result = $this->runQuery($string);
//            $users = mysqli_fetch_all($result, MYSQLI_ASSOC);
//            return $users;
//        } catch (Exception $e) {
//            throw new Exception("Database:selectUsers error: " . $e->getMessage());
//        }
//    }

    public function selectUsers($steamid_assoc) {
        $place_holders = implode(',', array_fill(0, count($steamid_assoc), '?'));
        $stmt = $this->DBH->prepare("SELECT * FROM `user` WHERE `steamid` IN ($place_holders)");
        $stmt->execute($steamid_assoc);
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

//    public function selectUser($steamid) {
//        $string = 'SELECT * FROM `user` WHERE `steamid` = ' . $steamid;
//        $result = $this->runQuery($string);
//        $user = mysqli_fetch_all($result, MYSQLI_ASSOC);
//        return $user;
//    }

    public function selectHeroName($npcHeroName) {
        $string = "SELECT `localized_name` FROM `hero` WHERE `name` = :npcHeroName";
        $stmt = $this->DBH->prepare($string);
        $stmt->bindParam(':npcHeroName', $npcHeroName);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc[0];
    }

    public function selectUser($steamid) {
        try {
            $string = "SELECT `steamid`, `personaname`, `community_visibility_state`, "
                    . "`profile_state`, `profile_url`, `avatar_url`, `avatar_medium_url`, "
                    . "`avatar_full_url`, TIMESTAMPDIFF(HOUR, `last_updated`, NOW()) as last_updated, `shallow_update` "
                    . "FROM `user` WHERE `steamid` = :steamid";
            $stmt = $this->DBH->prepare($string);
            $stmt->bindParam(':steamid', $steamid, PDO::PARAM_STR);
            $stmt->execute();
            $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $fetch_assoc;
        } catch (Exception $e) {
            error_log("Error with select user " + $e->getMessage());
            return null;
        }
    }

    public function selectItemByName($name) {
        $stmt = $this->DBH->prepare("SELECT * FROM `item` WHERE `name` LIKE ?");
        $param = "%" . $name . "%";
        $stmt->execute(array($param));
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectInventoryItems($steamid) {
        $string = 'SELECT item.*, count(user_inventory.defindex) as quantity FROM item'
                . ' INNER JOIN user_inventory'
                . ' ON item.defindex = user_inventory.defindex'
                . ' WHERE user_inventory.steamid = :steamid'
                . ' group by item.defindex';
        $stmt = $this->DBH->prepare($string);
        $stmt->bindParam(':steamid', $steamid);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $result;
    }

    /**
     * Fetches an associative array of steamids belonging to friends of the specified
     * user with $steamid who own the item with $defindex.
     * @param type $steamid
     * @param type $defindex
     */
    public function selectFriendsWhoOwn($steamid, $defindex) {
        $string = 'SELECT DISTINCT `user`.* FROM `user`
                    INNER JOIN `user_friends`
                    ON `user`.`steamid` = `user_friends`.`friend_steamid`
                    INNER JOIN `user_inventory`
                    ON `user_friends`.`friend_steamid` = `user_inventory`.`steamid`
                    WHERE `user_friends`.`user_steamid` = :steamid AND `user_inventory`.`defindex` = :defindex';
        $stmt = $this->DBH->prepare($string);
        $stmt->bindParam(':steamid', $steamid, PDO::PARAM_STR);
        $stmt->bindParam(':defindex', $defindex, PDO::PARAM_STR);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectLastUpdatedUser($steamid) {
        $string = 'SELECT TIMESTAMPDIFF(HOUR, `time`, NOW()) as `last_updated` FROM `user_updated` WHERE `steamid`=' . $steamid;
    }

    public function insertLastUpdatedUser($steamid) {
        $string = 'INSERT INTO `user_updated`(`steamid`, `time`) VALUES(' . $steamid . ', NOW())'
                . 'ON DUPLICATE KEY UPDATE `time` = NOW()';
    }

    public function selectMatchingItemCount($nameQuery) {
        $stmt = $this->DBH->prepare("SELECT count(*) AS count FROM `item` WHERE `name` LIKE ? AND `defindex` >= 3000");
        $param = "%" . $nameQuery . "%";
        $stmt->execute(array($param));
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectMatchingItems($nameQuery) {
        $stmt = $this->DBH->prepare("SELECT * FROM `item` WHERE `name` LIKE ? AND `defindex` >= 3000");
        $param = "%" . $nameQuery . "%";
        $stmt->execute(array($param));
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectItemsByRarity($rarity) {
        $stmt = $this->DBH->prepare("SELECT * FROM `item` WHERE `item_rarity` = ? AND `defindex` >= 3000");
        $stmt->execute(array($rarity));
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectItemsByHero($heroDbName) {
        $stmt = $this->DBH->prepare("SELECT * FROM `item` WHERE `used_by_heroes` = ? AND `defindex` >= 3000");
        $stmt->execute(array($heroDbName));
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    private function selectItems() {
        
    }

    public function selectMostCommonItems() {
        //Top 10 wearable items.
        $string = "SELECT item.*, COUNT(item.defindex) AS quantity FROM item
                    INNER JOIN user_inventory
                    ON item.defindex = user_inventory.defindex
                    WHERE item.item_class = 'dota_item_wearable'
                    GROUP BY  item.defindex 
                    ORDER BY  quantity DESC 
                    LIMIT 0, 10";
        $stmt = $this->DBH->prepare($string);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectDistinctItemCount() {
        $string = "SELECT count(*) as count FROM `item`";
        $stmt = $this->DBH->prepare($string);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectUniqueItemCount() {
        $string = "SELECT count(*) as count FROM `user_inventory`";
        $stmt = $this->DBH->prepare($string);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    public function selectUserCount() {
        $string = "SELECT count(*) as count FROM `user`";
        $stmt = $this->DBH->prepare($string);
        $stmt->execute();
        $fetch_assoc = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $fetch_assoc;
    }

    private function doesUserDataExist($steamid) {
        
    }

}

?>