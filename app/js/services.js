'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
        value('version', '0.1').
        factory('user', ['$cookies', 'api', '$http', function($cookies, api, $http) {
                // REMOVE $HTTP LATER.
                var user = {
                    loggedIn: false,
                    steamid: "",
                    inventory: "",
                    inventoryPromise: "",
                    profilePromise: "",
                    steamidPromise: ""
                };

                // Get logged in user from API.
                // If blank/error - then user not logged in.
                // Otherwise save the steamid as logged in user.
                function setLoggedInUser() {
                    user.steamidPromise = api.getLoggedInUser().then(function(response) {
                        var steamid = response.data.data;
                        if (steamid !== "") {
                            user.loggedIn = true;
                            user.steamid = steamid;
                            // Since user is logged in - populate properties.
                            user.inventoryPromise = $http.get("action.php?action=getinventory&steamid=" + user.steamid).success(function(result) {
                                setInventory(result.data);
                            });
                            user.profilePromise = $http.get("action.php?action=getuser&steamid=" + user.steamid).then(function(result) {
                                return result.data;
                            });
                        }
                    });

                }
                setLoggedInUser();

                user.logout = function() {
                    api.logout();
                };

                var setInventory = function(inventoryData) {
                    user.inventory = inventoryData;
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
                user.addToWishList = function(defindex){
                    api.addToWishList(defindex).then(function(result){
                        console.log(result);
                    }, function(fail){
                        console.log(fail);
                    });
                };
                return user;
            }])
        .factory('SearchUser', ['$q', 'api', function($q, api) {
                var isCommunityUrl = function(query) {
                    // Compares if steamcommunity.com is a part of the query.
                    return (query.indexOf("steamcommunity.com") > -1);
                };
                var isSteamid = function(query) {
                    //Steamids are always 17 chars and a number.
                    return ((query.length === 17) && (!isNaN(query)));
                };
                // This function expects a proper community URL.
                var getSteamidFromUrl = function(communityUrl) {
                    var deferred = $q.defer();

                    if (communityUrl.indexOf("/profiles/") > -1) {
                        //Then this URL contains a steamid.
                        var steamid = communityUrl.substr(-17);
                        if (isSteamid(steamid)) {
                            deferred.resolve(steamid);
                        } else {
                            deferred.reject("Malformed Community URL");
                        }
                    } else if (communityUrl.indexOf("/id/") > -1) {
                        //Then this URL contains vanity name.
                        var vanityName = communityUrl.substr(communityUrl.lastIndexOf('/') + 1);
                        api.resolveVanityUrl(vanityName).then(function(result) {
                            if (result.data.success === true) {
                                var steamid = result.data.data;
                                deferred.resolve(steamid);
                            } else {
                                deferred.reject(result.data.data);
                            }
                        });
                    } else {
                        // Seems like input is not a valid Community URL.
                        deferred.reject('Unknown fetch steamid error');
                    }
                    return deferred.promise;
                };
                return {
                    getSteamidFromUrl: getSteamidFromUrl,
                    isSteamid: isSteamid,
                    isCommunityUrl: isCommunityUrl
                };
            }])
        .factory('ItemSearch', ['$http', function($http) {
                var doSearch = function(query) {

                };
            }])
        .factory('SiteSearch', ['SearchUser', function(SearchUser) {
                var doSearch = function(query) {

                };
            }])
        .factory('Trade', ['$http', function($http) {
                var submitTrade = function(defindex, steamid, message) {
                    //Do POST to server with these params.

                };
                var getItemTrades = function(defindex) {
                    //Get (recent) trades submitted for an item.
                };
                var getUserTrades = function(steamid) {
                    //Get all trades that this user has posted.
                };
                var getLatestTrades = function() {
                    //Get some trades that were recently posted (all items/users).
                };

            }])
        .factory('Heroes', ['api', function(api) {
                return{
                    stripNpcPrefix: function(db_hero_name) {
                        return db_hero_name.substring(14);
                    }
                };
            }])
        .factory('api', ['$http', function($http) {

                return {
                    getLoggedInUser: function() {
                        return $http.get('action.php?action=getLoggedInUser')
                                .then(function(response) {
                                    return response;
                                });
                    },
                    logout: function(){
                        return $http.get('action.php?action=logout')
                                .then(function(response){
                                    console.log(response.data.success);
                                });
                    },
                    addToWishList: function(defindex){
                        return $http.post('action.php',
                        {action: 'addToWishlist', defindex: defindex}).then(function(response){
                            return response.data;
                        });
                    },
                    addTrade: function(defindex, steamid, message) {
                        return $http.post('action.php',
                                {action: 'addTrade', defindex: defindex, steamid: steamid, message: message}
                        ).then(function(data) {
                            return data.data;
                        }, function(failData) {

                        });
                    },
                    getTrade: function(tradeId) {

                    },
                    getItemPrice: function(defindex) {
                        return $http.get('action.php?action=getitemprice&defindex=' + defindex)
                                .then(function(successData) {
                                    return successData;
                                });
                    },
                    getLatestTrades: function() {
                        return $http.get('action.php?action=getlatesttrades')
                                .then(function(successResponse) {
                                    return successResponse;
                                });
                    },
                    getActiveTrades: function(defindex) {
                        return $http.get('action.php?action=getitemtrades&defindex=' + defindex)
                                .then(function(successResponse) {
                                    return successResponse.data;
                                }, function(failResponse) {

                                });
                    },
                    getUserTrades: function(steamid) {

                    },
                    resolveVanityUrl: function(vanityName) {
                        return $http.get('action.php?action=getsteamid&vanityurl=' + vanityName).then(function(result) {
                            return result;
                        });
                    },
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
                    },
                    getItemsByType: function(itemTypeName) {
                        return $http.get('action.php?action=getitemsbytype&type=' + itemTypeName).then(function(success) {
                            return success.data;
                        }, function(fail) {

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
