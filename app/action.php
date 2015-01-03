<?php

//Merge possibly json encode methods to server api.
include_once("php/AjaxResponse.php");
include_once("php/ServerActions.php");
$serverApi = new ServerActions();


if (isset($_GET['action'])) {
    $action = $_GET['action'];
    switch ($action) {
        case "login":
            require 'php/lightopenid/steam-openid.php';
            $steamAuth = new SteamAuth();
            $val = $steamAuth->login();
            break;
        case "logout":
            // Initialize the session.
            session_start();
            // Unset all of the session variables.
            $_SESSION = array();
            // If it's desired to kill the session, also delete the session cookie.
            // Note: This will destroy the session, and not just the session data!
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]
                );
            }
            // Finally, destroy the session.
            session_destroy();
            $response = new AjaxResponse(true, "Logged out successfully.");
            echo json_encode($response->toArray());
            break;
        case "getLoggedInUser":
            session_start();
            if (isset($_SESSION['steamid'])) {
                // Then user appears to be logged in.
                $response = new AjaxResponse(true, $_SESSION['steamid']);
                echo json_encode($response->toArray());
            } else {
                // Then user appears to be logged out.
                $response = new AjaxResponse(true, "");
                echo json_encode($response->toArray());
            }
            break;
        case "getuser":
            if (isset($_GET['steamid'])) {
                $steamid = $_GET['steamid'];
                echo $serverApi->getUser($steamid);
            } else if (isset($_GET['vanityurl'])) {
                $vanityUrl = $_GET['vanityurl'];
                echo $serverApi->getUserByVanityUrl($vanityUrl);
            } else {
                $response = new AjaxResponse(false, "No parameter was set.");
                echo json_encode($response->toArray());
            }
            break;
        case "getsteamid":
            if (isset($_GET['vanityurl'])) {
                $vanityurl = $_GET['vanityurl'];
                echo $serverApi->resolveVanityUrl($vanityurl);
            }
            break;
        case "getrecentusers":
            echo $serverApi->getRecentlyUpdatedUsers();
            break;
        case "getallitems":
            echo $serverApi->getAllItems();
            break;
        case "getitems":
            $ajax = new AjaxResponse(false, "Method undefined so far.");
            if (isset($_GET['rarity'])) {
                //Append each filter?
            }
            if (isset($_GET['hero'])) {
                //Append each filter?
            }
            echo json_encode($ajax->toArray());
            break;
        case "getitem":
            if (isset($_GET['defindex'])) {
                $defindex = $_GET['defindex'];
                echo $serverApi->getItem($defindex);
            } else if (isset($_GET['name'])) {
                $name = $_GET['name'];
                echo $serverApi->getItemByName($name);
            } else {
                $response = new AjaxResponse(false, "No paramater was set.");
                echo json_encode($response->toArray());
            }
            break;
        case "getitemprice":
            if (isset($_GET['defindex'])) {
                $defindex = $_GET['defindex'];
                echo $serverApi->getItemPrice($defindex);
            }
            break;
        case "getinventory":
            if (isset($_GET['steamid'])) {
                $steamid = $_GET['steamid'];
                echo $serverApi->getInventory($steamid);
            } else {
                $response = new AjaxResponse(false, "No paramater was set.");
                echo json_encode($response->toArray());
            }
            break;
        case "getfriendslist":
            if (isset($_GET['steamid'])) {
                $steamid = $_GET['steamid'];
                echo $serverApi->getFriendList($steamid);
            } else {
                $response = new AjaxResponse(false, "No paramater was set.");
                echo json_encode($response->toArray());
            }
            break;
        case "getfriendsowning":
            if (isset($_GET['steamid']) && isset($_GET['defindex'])) {
                $steamid = $_GET['steamid'];
                $defindex = $_GET['defindex'];
                echo $serverApi->getFriendOwners($steamid, $defindex);
            } else {
                $response = new AjaxResponse(false, "Missing parameters.");
                echo json_encode($response->toArray());
            }
            break;
        case "getheroes":
            echo $serverApi->getHeroes();
            break;
        case "getheroname":
            if (isset($_GET['npcheroname'])) {
                $npcHeroName = $_GET['npcheroname'];
                echo $serverApi->getMatchingHero($npcHeroName);
            } else {
                
            }
            break;
        case "getmatchingitemcount":
            if (isset($_GET['query'])) {
                $query = $_GET['query'];
                echo $serverApi->getMatchingItemCount($query);
            } else {
                
            }
            break;
        case "getmatchingitems":
            if (isset($_GET['name'])) {
                $query = $_GET['name'];
                echo $serverApi->getMatchingItems($query);
            } else if (isset($_GET['hero'])) {
                $hero = $_GET['hero'];
                echo $serverApi->getHeroItems($hero);
            } else if (isset($_GET['rarity'])) {
                $rarity = $_GET['rarity'];
                echo $serverApi->getRarityItems($rarity);
            }
            break;
        case "getitemsbytype":
            if (isset($_GET['type'])) {
                $type = $_GET['type'];
                echo $serverApi->getItemsByType($type);
            }
            break;
        case "getitemtrades":
            if (isset($_GET['defindex'])) {
                $defindex = $_GET['defindex'];
                echo $serverApi->getItemTrades($defindex);
            }
            break;
        case "getlatesttrades":
            echo $serverApi->getLatestTrades();
            break;
        case "getstats":
            echo $serverApi->getStats();
    }
}
// POST Requests (JSON input).
$postdata = file_get_contents("php://input");
$request = json_decode($postdata);
if (isset($request->action)) {
    $action = $request->action;
    switch ($action) {
        case "addTrade":
            if (isset($request->defindex) && isset($request->steamid) && isset($request->message)) {
                echo $serverApi->addTrade($request->defindex, $request->steamid, $request->message);
            }
            break;
        // -- METHODS THAT REQUIRE AUTHENTICATION -- 
        case "addToWishlist":
            if (isset($request->defindex) && isset($request->steamid)) {
                if (validateUser($request->steamid)) {
                    $response = new AjaxResponse(true, "You are authorized!");
                    echo json_encode($response->toArray());
                } else {
                    // User is not logged in as the requested user.
                    header("HTTP/1.1 401 Unauthorized");
                    $response = new AjaxResponse(false, "You are not logged in as this user.");
                    echo json_encode($response->toArray());
                }
            }
    }
}

function validateUser($steamid) {
    session_start();
    if (isset($_SESSION['steamid'])) {
        // If the steamid matches the session steamid - user is authenticated.
        return $steamid === $_SESSION['steamid'];
    }
    // Will be reached if steamid session var is not set. (Not logged in).
    return false;
}

?>