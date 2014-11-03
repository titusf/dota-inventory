<?php

class SteamAuth {

    function __construct() {
        
    }

    function login() {
        require 'openid.php';
        try {
            # Change 'localhost' to your domain name.
            $openid = new LightOpenID('localhost/DotaInventory2');
            if (!$openid->mode) {
                $openid->identity = 'http://steamcommunity.com/openid';
                header('Location: ' . $openid->authUrl());
            } elseif ($openid->mode == 'cancel') {
                echo 'User has canceled authentication!';
            } else {
                if ($openid->validate()) {
                    $steamid = str_replace("http://steamcommunity.com/openid/id/", "", $openid->identity);
                    setcookie("steamid", $steamid);
                    header('Location: ' . 'http://localhost/DotaInventory2/app/');
                } else {
                    //failed.
                    echo "User login was unsuccessful.";
                }
            }
        } catch (ErrorException $e) {
            echo $e->getMessage();
        }
    }

}
