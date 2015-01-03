'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngCookies']).
        controller('NavCtrl', ['$scope', '$location', 'user', function($scope, $location, user) {
                $scope.logout = function() {
                    user.logout();
                    window.location.reload();
                };
                // Loading whether user is logged in.
                user.steamidPromise.then(function(result) {
                    $scope.loggedIn = user.loggedIn;
                    $scope.steamid = user.steamid;
                    // Load user profile and inventory.
                    $scope.loadingProfile = false;
                    $scope.loadingInventory = false;
                    if (user.loggedIn) {
                        $scope.loadingProfile = true;
                        user.profilePromise.then(function(result) {
                            $scope.user = result.data;
                            $scope.loadingProfile = false;
                            //Now load inventory.
                            $scope.loadingInventory = true;
                            user.inventoryPromise.then(function(result) {
                                $scope.loadingInventory = false;
                            });
                        });
                    }
                });

                $scope.isActive = function(viewLocation) {
                    if (viewLocation === $location.path()) {
                        return true;
                    } else if (($location.path().substring(0, viewLocation.length) === viewLocation) && viewLocation !== '/') {
                        return true;
                    } else {
                        return false;
                    }
                    return viewLocation === $location.path();
                };
            }])
        .controller('TitleCtrl', ['$scope', 'title', function($scope, title) {
                $scope.title = title;
            }])
        .controller('FrontPageCtrl', ['$scope', '$http', function($scope, $http) {
                $http.get('friendslist.json').success(function(result) {
                    $scope.users = result.data;
                });
                $scope.rarities = ["common", "uncommon", "rare", "mythical",
                    "legendary", "ancient", "immortal", "arcana"];
                $scope.heroes = [];
                $http.get('action.php?action=getheroes').success(function(data) {
                    angular.forEach(data.data, function(value, key) {
                        var dbName = key.substring(14, key.length);
                        $scope.heroes.push({
                            name: value,
                            dbName: dbName
                        });
                    });
                });
                var timeoutID;
                $scope.$watch('query', function(newVal, oldVal) {
                    var query = $scope.query;
                    $scope.results = [];
                    if (typeof query !== 'undefined') {
                        window.clearTimeout(timeoutID);
                        $scope.loadingQuery = true;
                        timeoutID = window.setTimeout(function() {
                            //URL Conditionals.
                            if (query.substring(0, 35) === "http://steamcommunity.com/profiles/") {
                                var steamid = query.substring(35, query.length);
                                $scope.results.push({
                                    link: "users/" + steamid,
                                    title: "View User Profile"
                                }, {
                                    link: "users/" + steamid + "/friendslist/",
                                    title: "View User Friendslist"
                                });
                                $scope.loadingQuery = false;
                            } else if (query.substring(0, 29) === "http://steamcommunity.com/id/") {
                                var vanity = query.substring(29, query.length);
                                $http.get('action.php?action=getsteamid&vanityurl=' + vanity).success(function(data) {
                                    if (data.success === true) {
                                        var steamid = data.data;
                                        $scope.results.push({
                                            link: "users/" + steamid,
                                            title: "View User Profile"
                                        }, {
                                            link: "users/" + steamid + "/friendslist/",
                                            title: "View User Friendslist"
                                        });
                                        $scope.loadingQuery = false;
                                    } else {
                                        $scope.results.push({
                                            link: "#/",
                                            title: "User does not exist"
                                        });
                                        $scope.loadingQuery = false;
                                    }
                                });
                            } else if (query.substring(0, 22) === "steamcommunity.com/id/") {
                                var vanity = query.substring(22, query.length);
                                $scope.loadingQuery = false;
                            } else if (query.substring(0, 28) === "steamcommunity.com/profiles/") {
                                var steamid = query.substring(28, query.length);
                                $scope.loadingQuery = false;
                            } else if (query.length > 2) {
                                query = query.toLowerCase();
                                //Compare against rarities.
                                angular.forEach($scope.rarities, function(rarity, index) {
                                    if (rarity.substring(0, query.length) === query) {
                                        $scope.results.push({
                                            link: "items/rarity/" + rarity,
                                            title: "View All " + rarity + " Items"
                                        });
                                    }
                                });
                                //Compare against heroes.
                                angular.forEach($scope.heroes, function(hero, index) {
                                    hero.name = hero.name.toLowerCase();
                                    if (hero.name.indexOf(query) !== -1) {
                                        $scope.results.push({
                                            link: "items/hero/" + hero.dbName,
                                            title: "View All " + hero.name + " Items"
                                        });
                                    }
                                });
                                //Compare against item names.
                                $http.get('action.php?action=getmatchingitemcount&query=' + query).success(function(data) {
                                    var matchCount = data.data[0].count;
                                    if (matchCount == 1) {
                                        $http.get('action.php?action=getitem&name=' + query).success(function(data) {
                                            $scope.results.push({
                                                link: "items/id/" + data.data[0].defindex,
                                                title: data.data[0].name
                                            });
                                        });
                                    } else {
                                        $scope.results.push({
                                            link: "items/name/" + query,
                                            title: matchCount + " Items Contain '" + query + "'"
                                        });
                                    }
                                    $scope.loadingQuery = false;
                                });

                            }
                        }, 600);
                    }
                });
            }])
        .controller('ItemCategoriesCtrl', ['$scope', '$http', '$location', 'Heroes', function($scope, $http, $location, Heroes) {
                $scope.heroes = [];
                $http.get('action.php?action=getheroes').success(function(data) {
                    angular.forEach(data.data, function(value, key) {
                        var dbName = Heroes.stripNpcPrefix(key);
                        $scope.heroes.push({
                            name: value,
                            dbName: dbName
                        });
                    });
                });
                $scope.goToSearchResults = function(query) {
                    $location.path('items/name/' + query);
                };
            }])
        .controller('UserFrontCtrl', ['$scope', '$http', 'api', 'SearchUser', function($scope, $http, api, SearchUser) {
                //Get Recent Users
                $http.get('action.php?action=getrecentusers').success(function(data) {
                    $scope.friends = data.data;
                });
                $scope.searching = false;
                $scope.profileReached = false;
                $scope.profileSuccess = false;

                $scope.searchUsers = function(userQuery) {
                    $scope.invalid = false;
                    $scope.searching = true;
                    $scope.profileSuccess = false;
                    if (SearchUser.isSteamid(userQuery)) {
                        //Get profile from this straight away.
                        performProfileFetch(userQuery);
                    } else if (SearchUser.isCommunityUrl(userQuery)) {
                        console.log("fetching user");
                        //Attempt to get steamid from community URL.
                        SearchUser.getSteamidFromUrl(userQuery).then(function(result) {
                            performProfileFetch(result);
                        }, function(rejectReason) {
                            $scope.invalid = true;
                            $scope.searching = false;
                            $scope.invalidReason = rejectReason;
                        });
                    } else {
                        //Unrecognised query format. (Error)
                        $scope.invalid = true;
                        $scope.searching = false;
                        $scope.invalidReason = "You did not enter a valid Steamid or Community URL."
                        console.log("Error");
                    }
                };
                var performProfileFetch = function(steamid) {
                    api.getUserDetails(steamid, function(response) {
                        if (response.success === true) {
                            $scope.profileSuccess = true;
                            $scope.searching = false;
                            $scope.user = response.data;
                        }
                    });
                };
            }])
        .controller('UserDetailCtrl', ['$scope', '$routeParams', 'api', 'ItemList', 'user', function($scope, $routeParams, api, itemList, user) {
                var steamid = $routeParams.steamId;
                $scope.steamId = steamid;

                // Mark the page as loading.
                $scope.loading = true;

                // Set the default number of items to display.
                $scope.totalDisplayed = 120;


                // Check if this is the logged in user's page.
                if (user.loggedIn && user.steamid === steamid) {
                    if (user.steamid === steamid) {
                        $scope.loading = false;
                        $scope.loggedInUserProfile = true;
                        user.profilePromise.then(function(result) {
                            $scope.user = result.data;
                        });
                        user.inventoryPromise.then(function() {
                            $scope.items = user.inventory;
                        });
                    }
                    // Otherwise, this is not a logged in user's page. (Or user is not logged in.)
                } else {

                    api.getUserDetails($scope.steamId, function(data) {
                        if (data.success == true) {
                            $scope.userApiFail = false;
                            $scope.user = data.data;
                            $scope.loading = false;
                            if ($scope.user.community_visibility_state !== '3') {
                                $scope.user.isprivate = true;
                            }
                            api.getInventory($scope.steamId, function(data) {
                                $scope.loading = false;
                                if (data.success == true) {
                                    $scope.items = data.data;
                                    $scope.itemsApiFail = false;
                                } else {
                                    $scope.itemsApiFail = true;
                                    $scope.errorMessage = data.data;
                                }
                            });
                        } else {
                            $scope.loading = false;
                            $scope.userApiFail = true;
                            $scope.errorMessage = data.data;
                        }
                    });
                }

            }])
        .controller('ItemSearchCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
                var searchTerm = $routeParams.searchTerm;
                $http.get('action.php?action=getmatchingitems&name=' + searchTerm).success(function(data) {
                    $scope.items = data.data;
                });
            }])
        .controller('FriendsListCtrl', ['$scope', '$routeParams', 'api', 'title', 'ItemList', function($scope, $routeParams, api, title, itemList) {
                $scope.friendslist = new Array();
                $scope.friendslistPrivate = new Array();
                title.setTitle("Loading Friendslist...");
                var steamId = $routeParams.steamId;
                $scope.friendCount = 0;
                $scope.friendsLoaded = 0;
                $scope.steamId = steamId;
                $scope.totalDisplayed = 120;
                $scope.loadingUser = true;
                $scope.percentComplete = 0;
                //Get main user's details.
                api.getUserDetails(steamId, function(data) {
                    $scope.loadingUser = false;
                    $scope.user = data.data;
                    if ($scope.user.community_visibility_state === '3') {
                        $scope.user.ispublic = true;
                    } else {
                        $scope.user.isprivate = true;
                    }
                });
                $scope.loadingFriends = true;
                //Get friendslist / staemids.
                api.getFriendsList(steamId, function(data) {
                    var friend_ids = data.data;
                    console.log(friend_ids.length);
                    $scope.friendCount = friend_ids.length;
                    var friendslist = new Array();
                    //Iterate over steamids and load profiles.
                    angular.forEach(friend_ids, function(friend, n) {
                        api.getUserDetails(friend['friend_steamid'], function(data) {
                            if (data.success === true) {
                                var friend = data.data;
                                friend.loading = false;
                                friendslist.push(friend);
                                loadInUserInventory(friend);
                            }
                        });
                    });
                    $scope.loadingFriends = false;
                    title.setTitle($scope.user.personaname + "'s Friendslist");
                    $scope.friendslist = friendslist;
                    $scope.items = itemList.getItemList();
                    $scope.owners = itemList.getOwners();
                    $scope.item_count = 0;

                    $scope.friendsPrivate = 0;

                    function toPercent(value, total) {
                        return Math.floor((value / total) * 100);
                    }

                    function loadInUserInventory(friend) {
                        friend.loading = true;
                        if (friend.community_visibility_state === '3') {
                            api.getInventory(friend.steamid, function(data) {
                                friend.loading = false;
                                $scope.friendsLoaded++;
                                $scope.percentComplete = toPercent($scope.friendsLoaded, $scope.friendCount);
                                if (data.success === true) {

                                    friend.inventory_private = false;
                                    var friendItems = data.data;
                                    itemList.addUserItems(friendItems, friend);
                                    $scope.item_count = itemList.getLength();
                                } else {
                                    $scope.friendslistPrivate.push(friend);
                                    $scope.friendsPrivate++;
                                    friend.inventory_private = true;
                                    console.log(friend.personaname + " is private");
                                }
                            });
                        } else {
                            friend.loading = false;
                            $scope.friendsLoaded++;
                        }
                    }
                });
            }])
        .controller('UserWishListCtrl', ['$scope', '$routeParams', 'api', function($scope, $routeParams, api) {
                var steamid = $routeParams.steamId;
                $scope.steamid = steamid;
                api.getUserDetails(steamid, function(data) {
                    $scope.user = data.data;
                });
                api.getWishList(steamid).then(function(response) {
                    $scope.items = response.data;
                });
                $scope.deleteWishList = function() {
                    var result = confirm("Really delete ALL items?");
                    if (result === true) {
                        api.deleteWishList().then(function(){
                            window.location.reload();
                        });
                    }
                    
                };
            }])
        .controller('UserItemsCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
                $scope.steamId = $routeParams.steamId;
                $scope.itemsLoading = true;
                $scope.totalDisplayed = 80;
                $http.get('action.php?action=getinventory&steamid=' + $scope.steamId).success(function(data) {
                    $scope.itemsLoading = false;
                    $scope.items = data.data;
                    $scope.loading = false;
                });
            }])
        .controller('ItemListRarityCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
                var rarity = $routeParams.rarity;
                $scope.rarity = rarity;
                $http.get('action.php?action=getmatchingitems&rarity=' + rarity).success(function(data) {
                    $scope.items = data.data;
                });
            }])
        .controller('ItemListHeroCtrl', ['$scope', '$routeParams', '$http', 'api', function($scope, $routeParams, $http, api) {
                var npcHeroName = 'npc_dota_hero_' + $routeParams.heroName;
                $scope.npcHeroName = $routeParams.heroName;
                $scope.heroName = $routeParams.heroName;
                api.getHeroName(npcHeroName, function(data) {
                    $scope.heroName = data.data.localized_name;
                });
                $http.get('action.php?action=getmatchingitems&hero=' + npcHeroName).success(function(data) {
                    $scope.items = data.data;
                });
            }])
        .controller('ItemListTypeCtrl', ['$scope', '$routeParams', 'api', function($scope, $routeParams, api) {
                var typeName = $routeParams.typeName;
                $scope.typeName = typeName;
                api.getItemsByType(typeName).then(function(successData) {
                    if (successData.success === true) {
                        $scope.items = successData.data;
                    } else {

                    }
                });
            }])
        .controller('FriendsItemsCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {


            }])
        .controller('ItemDetailCtrl', ['$scope', '$routeParams', '$http', 'api', 'user', function($scope, $routeParams, $http, api, user) {
                var defindex = $routeParams.itemId;
                $scope.itemId = defindex;
                $http.get('action.php?action=getitem&defindex=' + $scope.itemId).success(function(data) {
                    var item = data.data[0];
                    var npc_hero_name = item.npc_hero_name;
                    $scope.item = item;
                    if ($scope.item.item_set === "") {
                        $scope.item.item_set = "No Item Set";
                    }
                    if ($scope.item.hero_name === null) {
                        $scope.noHero = true;
                    }
                    if (item.item_description === '') {
                        item.item_description = 'No description available.';
                    }
                    $scope.item.hero_db = npc_hero_name.substring(14, npc_hero_name.length);
                });
                $http.get('friendslist.json').success(function(data) {
                    $scope.traders = data.data;
                });
                $scope.loggedIn = user.loggedIn;
                $scope.ownsItem = false;

                api.getItemPrice(defindex).then(function(resultData) {
                    $scope.marketResultCount = resultData.data.data.length;
                    var firstResult = resultData.data.data[0];
                    var lowest_price = (firstResult.lowest_price / 100).toFixed(2);
                    var median_price = (firstResult.median_price / 100).toFixed(2);
                    var date_fetched = firstResult.date_fetched;
                    $scope.marketData = {
                        lowest_price: lowest_price,
                        median_price: median_price,
                        date_fetched: date_fetched
                    };
                });

                api.getActiveTrades(defindex).then(function(resultData) {
                    if (resultData.success === true) {
                        $scope.itemTrades = resultData.data;

                    } else {
                        console.log(resultData.data);
                    }
                }, function(failResponse) {

                });

                if (user.loggedIn) {
                    var inventoryPromise = user.inventoryPromise;
                    inventoryPromise.then(function() {
                        var inventory = user.inventory;
                        angular.forEach(inventory, function(item, n) {
                            if (item.defindex === defindex) {
                                $scope.ownsItem = true;
                            }
                        });
                    });
                    $scope.addToWishList = function(defindex) {
                        user.addToWishList(defindex);
                    };
                }
                $scope.submitTrade = function(tradeText) {
                    api.addTrade(defindex, user.steamid, tradeText).then(function(successResponse) {
                        if (successResponse.success === true) {

                        } else {
                            var tradeError = successResponse.data;
                            $scope.submitTradeFail = true;
                            $scope.submitTradeFailReason = tradeError;
                        }
                    });
                };
                $scope.currentPage = 1;
                $scope.limiter = 10;
                $scope.$watch('currentPage', function() {
                    $scope.limiter = ($scope.currentPage * 10);
                });
                $scope.limiter = ($scope.currentPage * 10);
                if (user.loggedIn === true) {
                    api.getFriendsOwning(user.steamid, defindex, function(data) {
                        $scope.friendsOwning = data.data;
                    });
                }
            }])
        .controller('TradeCtrl', ['$scope', 'api', function($scope, api) {
                api.getLatestTrades().then(function(successData) {
                    $scope.latestTrades = successData.data.data;
                });
            }])
        .controller('TradeDetailCtrl', ['$scope', '$routeParams', 'api', function($scope, $routeParams, api) {
                $scope.tradeId = $routeParams.tradeId;
            }])
        .controller('StatsCtrl', ['$scope', 'api', function($scope, api) {
                api.getStats(function(data) {
                    $scope.stats = data.data;
                    $scope.stats.averagePerUser = Math.round($scope.stats.uniqueItemCount / $scope.stats.totalUsers);
                });
            }])
        .controller('FaqCtrl', ['$scope', 'api', function($scope, api) {
            }]);