<?php

/**
 * This class returns JSON representation of AJAX Response class ALWAYS.
 */
require_once("SteamLink.php");
require_once("DatabaseLink.php");

class ServerActions {

    private $databaseLink;
    private $steamLink;
    private $updateInterval = 24;

    function __construct() {
        $this->databaseLink = new DatabaseLink();
        $this->steamLink = $steamLink = new SteamLink();
    }

    private function makeResponseJson($success, $data) {
        require_once("AjaxResponse.php");
        $response = new AjaxResponse($success, $data);
        return json_encode($response->toArray());
    }

    /**
     * Get user profile data. Will fetch/update if data does not exist or is old.
     * @param type $steamid
     * @param type $isFriend
     * @return type
     */
    public function getUser($steamid, $isFriend = 0) {
        $time = microtime(true);
        $user_result = $this->databaseLink->selectUser($steamid);
        //Attempt to fetch user.
        if (count($user_result) === 0) {
            $this->fetchAndStoreUser($steamid, $isFriend);
            $user_result = $this->databaseLink->selectUser($steamid);
        } else {
            //If user exists, check when it was last updated.
            $user = $user_result[0];
            if ($user["last_updated"] > $this->updateInterval) {
                $this->fetchAndStoreUser($steamid, $isFriend);
            }
            $user_result = $this->databaseLink->selectUser($steamid);
        }
        if (count($user_result) > 0) {
            //Convert to response object -> json -> return.
            return $this->makeResponseJson(true, $user_result[0]);
        } else {
            //Even after trying to fetch, user does not exist.
            return $this->makeResponseJson(false, "Error with server getting user (0 results).");
        }
    }

    /**
     * Update profile first. If profile is public then also update items and 
     * friendslist to database.
     * @param type $steamid
     */
    private function updateUser($steamid, $isFriend) {
        ignore_user_abort(true);
        set_time_limit(0);
        //Get/update profile info.
        //Get/update items.
        //Get/update friendslist.
        try {
            //Fetch profile info for this user.
            $playerSummary = $this->steamLink->getPlayerSummary($steamid);
            if ($playerSummary !== null) {


                //Store updated profile. <-- problem
                $this->databaseLink->insertUser($playerSummary, $isFriend);

                //Fetch newly stored user data.
                $user = $this->databaseLink->selectUser($steamid);
                if (isset($user) && count($user) > 0) {
                    if ($user[0]["community_visibility_state"] === '3') {
                        //Fetch new item list.
                        $items_assoc = $this->steamLink->getPlayerItems($steamid);
                        //Store new item list.
                        $this->databaseLink->insertInventory($items_assoc, $steamid);
                        //If this user is a friend, fetching their friends would be infinite.
                        if (!$isFriend) {
                            $friends_assoc = $this->updateFriendsList($steamid);
//                            //Update friend users shallow.
//                            foreach ($friends_assoc as $friend) {
//                                $friend_steamid = $friend['steamid'];
//                                $this->getUser($friend_steamid, true);
//                            }
                        }
                    }
                }
            } else {
                //Something done goofed / Steam server did not work.
                error_log("Something went wrong trying to update user records for user $steamid.");
            }
        } catch (Exception $e) {
            error_log("Error updating user with message: " + $e->getMessage());
        }
    }

    private function fetchAndStoreUser($steamid) {
        $playerSummary = $this->steamLink->getPlayerSummary($steamid);
        if ($playerSummary !== null) {
            //Store updated profile. <-- problem
            $this->databaseLink->insertUser($playerSummary, false);
        }
    }

    private function fetchAndStoreInventory($steamid) {
        $items_assoc = $this->steamLink->getPlayerItems($steamid);
        //Store new item list.
        $this->databaseLink->insertInventory($items_assoc, $steamid);
    }

    private function fetchAndStoreFriendslist($steamid) {
        $friends_assoc = $this->steamLink->getFriendList($steamid);
        $this->databaseLink->insertFriendList($steamid, $friends_assoc);
    }

    private function updateFriendsList($steamid) {
        //Fetch friendsList.
        $friends_assoc = $this->steamLink->getFriendList($steamid);
        //Store friendslist.
        $this->databaseLink->insertFriendList($steamid, $friends_assoc);
        return $friends_assoc;
    }

    public function resolveVanityUrl($vanityUrl) {
        try {
            //Perform request on steam server.
            $result = $this->steamLink->resolveVanityUrl($vanityUrl);
            //Return json.
            return $this->makeResponseJson(true, $result);
        } catch (Exception $e) {
            return $this->makeResponseJson(false, $e->getMessage());
        }
    }

    public function getUserByVanityUrl($vanityUrl) {
        $steamid = $this->resolveVanityUrl($vanityUrl);
        return $this->getUser($steamid, false);
    }

    public function getAllItems() {
        //Simply get all items from database.
        $result_assoc = $this->databaseLink->getAllItems();
        return $this->makeResponseJson(true, $result_assoc);
        //Return Json.
    }

    public function getItems($filters) {
        //
    }

    public function getItem($defindex) {
        //Get item from database.
        $item = $this->databaseLink->getItem($defindex);
        return $this->makeResponseJson(true, $item);
        //Return json.
    }
    
    public function getItemPrice($defindex){
        $prices = $this->databaseLink->getItemValue($defindex);
        return $this->makeResponseJson(true, $prices);
    }

    public function getItemsByType($item_type_name) {
        try {
            $result = "";
            if ($item_type_name === 'courier') {
                // do courier request.
                $result = $this->databaseLink->selectAllCourierItems();
            } else if ($item_type_name === 'mount') {
                // do mount request.
                $result = $this->databaseLink->selectAllMountItems();
            } else {
                // Search on the exact item type given.
                $result = $this->databaseLink->selectItemsByType($item_type_name);
            }
            return $this->makeResponseJson(true, $result);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getInventory($steamid) {
        try {
            //Get last updated inventory.
            $last_updated = $this->databaseLink->getHrsSinceInventoryUpdate($steamid);
            //If data is old or doesn't exist fetch new
            if ($last_updated === null || $last_updated >= $this->updateInterval) {
                $this->fetchAndStoreInventory($steamid);
            }
            $items = $this->databaseLink->selectInventoryItems($steamid);
            return $this->makeResponseJson(true, $items);
        } catch (Exception $e) {
            return $this->makeResponseJson(false, $e->getMessage());
        }
    }

    /**
     * 
     * @param type $steamid
     * @param type $defindex
     * @return type
     */
    public function getFriendOwners($steamid, $defindex) {
        try {
            $result = $this->databaseLink->selectFriendsWhoOwn($steamid, $defindex);
            return $this->makeResponseJson(true, $result);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getFriendList($steamid) {
        try {
            $last_updated = $this->databaseLink->getHrsSinceFriendslistUpdate($steamid);
            if ($last_updated === null || $last_updated >= $this->updateInterval) {
                $this->fetchAndStoreFriendslist($steamid);
            }
            $friends_ids = $this->databaseLink->selectFriendslistSteamids($steamid);

            return $this->makeResponseJson(true, $friends_ids);
        } catch (Exception $e) {
            return $this->makeResponseJson(false, $e->getMessage());
        }
    }

    public function getHeroes() {
        try {
            $heroes = $this->databaseLink->getAllHeroes();
            return $this->makeResponseJson(true, $heroes);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, "Error occurred with get heroes.");
        }
    }

    public function getMatchingHero($npcHeroName) {
        try {
            $heroName = $this->databaseLink->selectHeroName($npcHeroName);
            return $this->makeResponseJson(true, $heroName);
        } catch (Exception $ex) {
            error_log($ex->getMessage());
        }
    }

    public function getMatchingItemCount($query) {
        try {
            $count = $this->databaseLink->selectMatchingItemCount($query);
            return $this->makeResponseJson(true, $count);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getMatchingItems($query) {
        try {
            $items = $this->databaseLink->selectMatchingItems($query);
            return $this->makeResponseJson(true, $items);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getHeroItems($heroDbName) {
        try {
            $items = $this->databaseLink->selectItemsByHero($heroDbName);
            return $this->makeResponseJson(true, $items);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getRarityItems($rarity) {
        try {
            $items = $this->databaseLink->selectItemsByRarity($rarity);
            return $this->makeResponseJson(true, $items);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getItemByName($name) {
        try {
            $item = $this->databaseLink->selectItemByName($name);
            return $this->makeResponseJson(true, $item);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

    public function getStats() {
        $topTenItems = $this->databaseLink->selectMostCommonItems();
        $userCount = $this->databaseLink->selectUserCount();
        $dotaItemCount = $this->databaseLink->selectDistinctItemCount();
        $uniqueItemCount = $this->databaseLink->selectUniqueItemCount();
        $result = array(
            "topTen" => $topTenItems,
            "totalUsers" => $userCount[0]["count"],
            "dotaItemCount" => $dotaItemCount[0]["count"],
            "uniqueItemCount" => $uniqueItemCount[0]["count"]
        );
        return $this->makeResponseJson(true, $result);
    }

    public function getRecentlyUpdatedUsers() {
        $users = $this->databaseLink->selectRecentlyUpdatedUsers();
        return $this->makeResponseJson(true, $users);
    }

    public function addTrade($defindex, $steamid, $message) {
        // Should not return more than one row, if it does - user has circumvented trade expiry policy.
        $currentUserTrade = $this->databaseLink->selectActiveItemTradeByUser($defindex, $steamid);
        if (count($currentUserTrade) === 1) {
            // User must wait until trade listing has expired.
            return $this->makeResponseJson(false, 'Trade already exists. Wait to expire.');
        } else if (count($currentUserTrade) > 1) {
            // Some logic went wrong, user was allowed to post more than 1 trade.
            return $this->makeResponseJson(false, 'You managed to create more than 1 trade, well done.');
        } else {
            // Add the trade.
            try {
                $this->databaseLink->insertTrade($defindex, $steamid, $message);
                return $this->makeResponseJson(true, 'Trade added successfully.');
            } catch (Exception $ex) {
                return $this->makeResponseJson(false, $ex->getMessage());
            }
        }
    }

    public function getLatestTrades() {
        try {
            $result = $this->databaseLink->selectLatestTrades();
            return $this->makeResponseJson(true, $result);
        } catch (Exception $ex) {
            
        }
    }

    public function getItemTrades($defindex) {
        try {
            $result = $this->databaseLink->selectItemTrades($defindex);
            return $this->makeResponseJson(true, $result);
        } catch (Exception $ex) {
            return $this->makeResponseJson(false, $ex->getMessage());
        }
    }

}

?>
