<?php

/**
 * Steam Link should contain ONLY raw methods which fetch data from Steam. 
 */
class SteamLink {

    private $apiKey = "1FD7302C211037A29D9E9C80D3C130FE";

    private function isJson($json) {
        return !($json == null);
    }

    /**
     * Returns an array of SteamIDs corresponding to friends
     * for the specified user(steamid).
     * @param type $steamid
     */
    public function getFriendList($steamid) {
        $apiUrl = "http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=$this->apiKey&steamid=$steamid&relationship=friend";
        try {
            $result_assoc = $this->getArrayFromJsonUrl($apiUrl);
            //May be empty... but not error as such.
            return $result_assoc["friendslist"]["friends"];
        } catch (Exception $e) {
            throw new Exception("GetFriendList Failed. Error: " . $e->getMessage());
        }
    }

    /**
     * Returns an array of player summaries (profile data) for each steamid
     * given in $steamid_assoc.
     * @param type $steamid_assoc
     */
    public function getPlayerSummaries($steamid_assoc) {
        $commaList = implode(',', $steamid_assoc);
        $apiUrl = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=$this->apiKey&steamids=$commaList";
        $result_assoc = $this->getArrayFromJsonUrl($apiUrl);
        if ($result_assoc === false) {
            throw new Exception("Error interacting with Steam servers.");
        } else {
            //May be empty... but not error as such.
            return $result_assoc["response"]["players"];
        }
    }

    /**
     * Convenience method. Accepts single steamid as input.
     */
    public function getPlayerSummary($steamid) {
        $steamid_assoc[0] = $steamid;
        $playerSummaries = $this->getPlayerSummaries($steamid_assoc);
        if (count($playerSummaries) > 0 && $playerSummaries !== null) {
            return $playerSummaries[0];
        } else {
            return null;
        }
    }

    /**
     * Returns the SteamID associated with this vanityurl if found.
     * @param type $vanityUrl
     */
    public function resolveVanityUrl($vanityUrl) {
        $basename = basename($vanityUrl);
        $apiUrl = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=$this->apiKey&vanityurl=$basename";
        $result_assoc = $this->getArrayFromJsonUrl($apiUrl, true);
        if ($result_assoc === false) {
            throw new Exception("Error interacting with Steam servers.");
        } else {
            if ($result_assoc["response"]["success"] === 1) {
                //Success
                return $result_assoc["response"]["steamid"];
            } else if ($result_assoc["response"]["success"] === 42) {
                //No match for this URL.
                throw new Exception("Steam could not find a match for this Vanity URL.");
            } else {
                //Unknown error code from Steam.
                throw new Exception("Foreign error code returned from Steam.");
            }
        }
    }

    /**
     * Returns a user's item list for Dota 2.
     * @param type $steamid
     */
    public function getPlayerItems($steamid) {
        $apiUrl = "http://api.steampowered.com/IEconItems_570/GetPlayerItems/v0001/?language=en&key=$this->apiKey&steamid=$steamid";
        $result_assoc = $this->getArrayFromJsonUrl($apiUrl);
        if ($result_assoc === false) {
            //error.
        } else {
            if ($result_assoc["result"]["status"] === 1) {
                //Success.
                $playerItems = $result_assoc["result"]["items"];
                return $playerItems;
            } else if ($result_assoc["result"]["status"] === 8) {
                //SteamID is invalid or missing.
                throw new Exception("SteamID is missing in request.");
            } else if ($result_assoc["result"]["status"] === 18) {
                //SteamID does not exist.
                throw new Exception("SteamID does not exist.");
            } else if ($result_assoc["result"]["status"] === 15) {
                //Profile is private.
                throw new Exception("User's inventory is private.");
            } else {
                //Unknown error code from Steam.
                throw new Exception("Foreign error code returned from Steam: " . $result_assoc["result"]["status"]);
            }
        }
    }

    private function getFriendsSteamids($steamid) {
        $apiUrl = "http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=$this->apiKey&steamid=$steamid&relationship=friend";
        $json = $this->getArrayFromJsonUrl($apiUrl, true);
        if ($json != false) {
            $friends = $json["friendslist"]["friends"];
            $steamid_assoc = array();
            foreach ($friends as $friend) {
                $steamid_assoc[] = $friend["steamid"];
            }
            return $steamid_assoc;
        } else {
            return false;
        }
    }

    private function getArrayFromJsonUrl($url) {
        //$url = urlencode($url); Error suprression to avoid error 500.
        $result = @file_get_contents($url);
        if ($result === false) {
            if (isset($http_response_header[0])) {
                //Then file could not be fetched. 
                throw new Exception("URL could not be reached, " . $http_response_header[0]);
            } else {
                throw new Exception("URL could not be reached, Unknown Response");
            }
        }
        if ($this->isJson($result)) {
            return json_decode($result, true);
        } else {
            //File is for some reason not Json.
            throw new Exception("File is not Json.");
        }
    }
    
    public function getFileAndResponseCode($url){   
        $result = @file_get_contents($url);
        $response_code = '-1';
        if($result === false){
            if(isset($http_response_header)){
                //Then URL was reached and returned an error code.
                $response_code = $this->stripCodeFromHeader($http_response_header[0]);
            } else {
                //Could not connect. No response code.
                $response_code = '0';
            }
        } else {
            //URL was reached (200). File in $result.
            $response_code = $this->stripCodeFromHeader($http_response_header[0]);
        }
        return array(
            'contents' => $result,
            'code' => $response_code
        );
    }
    
    private function stripCodeFromHeader($header_string){
        $response_code = substr($header_string, 9, 3);
        $response_message = substr($header_string, 13);
        return $response_code;
    }

}



?>
