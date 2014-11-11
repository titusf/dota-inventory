'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
        value('version', '0.1').
        factory('user', ['$cookies', '$http', function($cookies, $http) {
                
                var user = {
                    loggedIn: false,
                    steamid: "",
                    inventory: "",
                    inventoryPromise: ""
                };
                
                if (typeof $cookies.steamid !== 'undefined' && $cookies.steamid !== "") {
                    user.loggedIn = true;
                    user.steamid = $cookies.steamid;
                }
                if (user.loggedIn === true) {
                    user.inventoryPromise = $http.get("action.php?action=getinventory&steamid=" + user.steamid).success(function(result){
                        user.inventory = result.data;
                    });
                }
                user.logout = function() {
                    $cookies.steamid = "";
                };



                user.getProfile = function(callback) {
                    if (user.loggedIn === true) {
                        $http.get('action.php?action=getuser&steamid=' + user.steamid).success(function(data) {
                            callback(data.data);
                        });
                    } else {
                        console.log("Error getting profile: user not logged in.");
                    }
                };
                return user;
            }]).factory('api', ['$http', function($http) {
        return {
            getInventory: function(steamid, callback) {
                $http.get("action.php?action=getinventory&steamid=" + steamid).success(function(data) {
                    callback(data);
                });
            },
            getUserDetails: function(steamid, callback) {
                $http.get('action.php?action=getuser&steamid=' + steamid).success(function(data) {
                    callback(data);
                });
            },
            getFriendsList: function(steamid, callback) {
                $http.get('action.php?action=getfriendslist&steamid=' + steamid).success(function(data) {
                    callback(data);
                });
            },
            getHeroes: function(callback) {
                $http.get('action.php?action=getheroes').success(function(data) {
                    callback(data);
                });
            },
            getFriendsOwning: function(steamid, defindex, callback) {
                $http.get('action.php?action=getfriendsowning&steamid=' + steamid + '&defindex=' + defindex).success(function(data) {
                    callback(data);
                });
            },
            getStats: function(callback) {
                $http.get('action.php?action=getstats').success(function(data) {
                    callback(data);
                });
            },
            getHeroName: function(npcHeroName, callback) {
                $http.get('action.php?action=getheroname&npcheroname=' + npcHeroName).success(function(data) {
                    callback(data);
                });
            }
        };
    }])
        .factory('title', function() {
            var title = "Dota 2 Item Database";
            return {
                setTitle: function(newTitle) {
                    title = newTitle;
                },
                getTitle: function() {
                    return title;
                }
            };
        })
        .factory('ItemList', function() {
            var items = [];
            var itemCheckList = [];
            var owners = [];
            var setItems = function(itemList) {
                items = [];
                addItems(itemList);
            };
            var addItems = function(itemList) {
                if (typeof itemList !== 'undefined') {
                    for (var i = 0; i < itemList.length; i++) {
                        var item = itemList[i];
                        if (typeof itemCheckList[item.defindex] === "undefined") {
                            items.push(item);
                            itemCheckList[item.defindex] = true;
                            owners[item.defindex] = [];
                        }
                    }
                }
            };
            var addUserItems = function(itemList, user) {
                if (typeof itemList !== 'undefined') {
                    for (var i = 0; i < itemList.length; i++) {
                        var item = itemList[i];
                        var ownership = {
                            details: user,
                            quantity: item.quantity
                        };
                        //If item hasn't yet been added, add it and initialise.
                        if (typeof itemCheckList[item.defindex] === "undefined") {
                            items.push(item);
                            itemCheckList[item.defindex] = true;
                            owners[item.defindex] = [];
                        }
                        owners[item.defindex].push(ownership);
                    }
                }
            };
            var getOwners = function() {
                return owners;
            };

            var getItemList = function() {
                return items;
            };

            return {
                addItems: addItems,
                setItems: setItems,
                addUserItems: addUserItems,
                getItemList: getItemList,
                getOwners: getOwners,
                getLength: function() {
                    return items.length;
                }
            };
        });
