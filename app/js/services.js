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
                    wishlist: "",
                    inventoryPromise: "",
                    profilePromise: "",
                    steamidPromise: "",
                    wishlistPromise: ""
                };

                // Get logged in user from API.
                // If blank/error - then user not logged in.
                // Otherwise save the steamid as logged in user.
                function setLoggedInUser() {
                    user.steamidPromise = api.getLoggedInUser().then(function(response) {
                        var steamid = response.data.steamid;
                        if (steamid !== "" && steamid !== "false") {
                            user.loggedIn = true;
                            user.steamid = steamid;
                            // Since user is logged in - populate properties.
                            user.inventoryPromise = $http.get("api/users/" + user.steamid + "/inventory").success(function(result) {
                                setInventory(result.data);
                            });
                            user.profilePromise = $http.get("api/users/" + user.steamid).then(function(result) {
                                return result.data;
                            });
                            user.wishlistPromise = api.getWishList(steamid).then(function(result) {
                                user.wishlist = result.data;
                            });
                        }
                    }, function(denied) {
                        // Not logged in.
                        console.log("Could not get logged in steamid. Not logged in!");
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
                        $http.get('api/users/' + user.steamid).success(function(data) {
                            callback(data.data);
                        });
                    } else {
                        console.log("Error getting profile: user not logged in.");
                    }
                };


                user.addToWishList = function(defindex) {
                    api.addToWishList(defindex).then(function(result) {
                        console.log(result);
                    }, function(fail) {
                        console.log(fail);
                    });
                };
                user.removeFromWishList = function(defindex) {
                    api.removeFromWishList(defindex).then(function(result) {
                        console.log(result);
                    }, function(fail) {
                        console.log(fail);
                    });
                };

                user.deleteWishList = function() {
                    api.deleteWishList().then(function(result) {
                        console.log(result);
                    });
                };

                user.isInWishList = function(defindex) {
                    for (var i = 0; i < user.wishlist.length; i++) {
                        if (user.wishlist[i].defindex === defindex) {
                            return true;
                        }
                    }
                    return false;
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
                    // Remove trailing slash
                    communityUrl = communityUrl.replace(/\/$/, "");
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
                            var steamid = result.data.steamid;
                            deferred.resolve(steamid);
                        }, function(error) {
                            deferred.reject(result.data.data);
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
        .factory('SiteSearch', ['api', 'SearchUser', function(api, SearchUser) {
                var rarities_arr = ["common", "uncommon", "rare", "mythical",
                    "legendary", "ancient", "immortal", "arcana"];
                var heroes_arr = [];
                api.getHeroes(function(data) {
                    heroes_arr = data.data;
                });
                function isRarity(someString) {
                    return (rarities_arr.indexOf(someString) > -1) ? true : false;
                }
                function isHero(someString) {
                    return (heroes_arr.indexOf(someString) > -1) ? true : false;
                }
                var doSearch = function(query) {

                };
            }])
        .factory('Heroes', ['api', function(api) {
                var heroesPromise = api.getAllHeroes();
                var heroesService = {
                    getArray: function() {
                        return heroesPromise.then(function(response) {
                            // Return just the resulting array of Hero names.
                            return response.data;
                        }, function(reason) {
                            console.log("API Fail: could not get Heroes.");
                        });
                    },
                    getProperName: function(db_hero_name) {
                        return this.getArray().then(function(response) {
                            return response[db_hero_name];
                        });
                    },
                    stripNpcPrefix: function(db_hero_name) {
                        return db_hero_name.substring(14);
                    }
                };
                return heroesService;
            }])
        .factory('Member', ['api', function(api) {
                var steamidPromise = api.getLoggedInUser();
                var inventoryPromise = null;
                var wishlistPromise = null;
                // Refreshes the wishlist and inventory promise objects.
                var reloadMember = function() {
                    steamidPromise.then(function(response) {
                        // Set the inventory promise.
                        inventoryPromise = api.getUserInventory(response.data.steamid);
                        wishlistPromise = api.getUserWishlist(response.data.steamid);
                    }, function(errorResponse) {
                        // Don't set anything, since could not get steamid.
                    });
                };
                // initial 'reload'.
                reloadMember();

                var memberService = {
                    isLoggedIn: function() {
                        return steamidPromise.then(function(steamid) {
                            return true;
                        }, function(errorResponse) {
                            return false;
                        });
                    },
                    getSteamid: function() {
                        return steamidPromise.then(function(steamid) {
                            return steamid;
                        }, function(errorResponse) {
                            console.log("[Member Service] User is not logged in: could not return steamid.");
                            return false;
                        });
                    },
                    isItemInInventory: function(defindex) {
                        return inventoryPromise.then(function(response) {
                            var isInInventory = false;
                            angular.forEach(response.data, function(item, key) {
                                if (item.defindex === defindex)
                                    isInInventory = true;
                            });
                            return isInInventory;
                        });
                    },
                    isItemInWishlist: function(defindex) {
                        return wishlistPromise.then(function(response) {
                            var isInWishlist = false;
                            angular.forEach(response.data, function(item, key) {
                                if (item.defindex === defindex)
                                    isInWishlist = true;
                            });
                            return isInWishlist;
                        });
                    },
                    removeFromWishlist: function(defindex) {
                        return api.removeFromWishList(defindex).then(function(ok) {
                            reloadMember();
                        });
                    },
                    addToWishlist: function(defindex) {
                        return api.addToWishList(defindex).then(function(ok) {
                            reloadMember();
                        });
                    }
                };
                return memberService;
            }])
        .factory('Items', ['api', function(api) {
                var itemsService = {
                    search: function() {

                    }

                };

                return itemsService;
            }])
        .factory('Price', ['api', function(api) {
                var priceService = {
                    getLatest: function(defindex){
                        return api.getItemPrice(defindex).then(function(response){
                            return response.data[0];
                        });
                    },
                    getAll: function(defindex){
                        return api.getItemPrice(defindex).then(function(response){
                            return response.data;
                        });
                    },
                    format: function(priceInt){
                        return "$" + (priceInt / 100).toFixed(2);
                    }
                };

                return priceService;
            }])
        .factory('api', ['$http', function($http) {
                /**
                 * Handles conversion of parameters into server-accepted
                 * format and returns search results.
                 * @param {array} rarities
                 * @param {array} heroes
                 * @param {array} types
                 * @param {string} name
                 * @returns {$http.get} search results
                 */
                var searchItems = function(rarities, heroes, types, name, defindexes) {
                    // Construct the params object dynamically so as not to include unwanted params.
                    var params = {};
                    if (rarities !== null && rarities.length > 0)
                        params.rarity = rarities.join(',');
                    if (heroes !== null && heroes.length > 0)
                        params.hero = heroes.join(',');
                    if (types !== null && types.length > 0)
                        params.type = types.join(',');
                    if (name !== null && name !== "")
                        params.name = name;
                    if (defindexes !== null && defindexes.length > 0)
                        params.defindex = defindexes.join(',');
                    return $http.get("api/items", {params: params}).then(function(response) {
                        return response.data;
                    }, function(fail) {
                        console.log("API Item search failed.");
                    });
                };

                return {
                    searchItems: searchItems,
                    getItem: function(defindex) {
                        return $http.get('api/items/' + defindex);
                    },
                    getLoggedInUser: function() {
                        return $http.get('api/members/me/steamid');
                    },
                    logout: function() {
                        return $http.get('api/members/me/logout')
                                .then(function(response) {
                                    console.log(response.data.success);
                                });
                    },
                    addToWishList: function(defindex) {
                        // e.g. [PUT] members/me/wishlist/3000
                        return $http.put('api/members/me/wishlist/' + defindex).then(function(response) {
                            return response.data;
                        });
                    },
                    removeFromWishList: function(defindex) {
                        // e.g. [DELETE] members/me/wishlist/3000
                        return $http.delete('api/members/me/wishlist/' + defindex).then(function(response) {
                            return response.data;
                        });
                    },
                    deleteWishList: function() {
                        return $http.post('api/action.php',
                                {action: 'deleteWishList'}).then(function(response) {
                            return response.data;
                        });
                    },
                    getWishList: function(steamid) {
                        return $http.get('api/members/' + steamid + '/wishlist')
                                .then(function(response) {
                                    console.log("WISHLIST API " + response);
                                    return response.data;
                                });
                    },
                    getUserWishlist: function(steamid) {
                        return $http.get('api/members/' + steamid + '/wishlist');
                    },
                    getItemPrice: function(defindex) {
                        return $http.get('api/items/' + defindex + '/price')
                                .then(function(successData) {
                                    return successData;
                                });
                    },
                    resolveVanityUrl: function(vanityName) {
                        return $http.get('api/users/vanity/' + vanityName).then(function(result) {
                            return result;
                        });
                    },
                    getInventory: function(steamid, callback) {
                        $http.get('api/users/' + steamid + '/inventory').success(function(data) {
                            callback(data);
                        });
                    },
                    getUserInventory: function(steamid) {
                        return $http.get('api/users/' + steamid + '/inventory');
                    },
                    getUserDetails: function(steamid, callback) {
                        return $http.get('api/users/' + steamid);
                    },
                    getFriendsList: function(steamid, callback) {
                        $http.get('api/users/' + steamid + '/friends').success(function(data) {
                            callback(data);
                        });
                    },
                    getHeroes: function(callback) {
                        $http.get('api/items/heroes').success(function(data) {
                            callback(data);
                        });
                    },
                    getAllHeroes: function() {
                        return $http.get('api/items/heroes');
                    },
                    // To be refactored out of API.
                    getFriendsOwning: function(steamid, defindex, callback) {
                        $http.get('api/action.php?action=getfriendsowning&steamid=' + steamid + '&defindex=' + defindex).success(function(data) {
                            callback(data);
                        });
                    },
                    getStats: function(callback) {
                        $http.get('api/action.php?action=getstats').success(function(data) {
                            callback(data);
                        });
                    },
                    getItemsByType: function(itemTypeName) {
                        return $http.get('api/items?type=' + itemTypeName).then(function(success) {
                            return success.data;
                        }, function(fail) {

                        });
                    },
                    getBundleIds: function(){
                        return $http.get('api/bundles');
                    },
                    getBundle: function(id_name){
                        return $http.get('api/bundles/' + id_name);
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
