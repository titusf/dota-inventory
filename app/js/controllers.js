'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngCookies']).
        controller('NavCtrl', ['$scope', 'user', function($scope, user) {
                $scope.loggedIn = user.loggedIn;
                $scope.steamid = user.steamid;
                $scope.logout = function() {
                    user.logout();
                    window.location.reload();
                };
                if (user.loggedIn) {
                    user.getProfile(function(data) {
                        $scope.user = data;
                    });
                }
            }])
        .controller('TitleCtrl', ['$scope', 'title', function($scope, title) {
                $scope.title = title;
            }])
        .controller('FrontPageCtrl', ['$scope', '$http', function($scope, $http) {
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
                                    link: "#/users/" + steamid,
                                    title: "View User Profile"
                                }, {
                                    link: "#/users/" + steamid + "/friendslist/",
                                    title: "View User Friendslist"
                                });
                                $scope.loadingQuery = false;
                            } else if (query.substring(0, 29) === "http://steamcommunity.com/id/") {
                                var vanity = query.substring(29, query.length);
                                $http.get('action.php?action=getsteamid&vanityurl=' + vanity).success(function(data) {
                                    if (data.success === true) {
                                        var steamid = data.data;
                                        $scope.results.push({
                                            link: "#/users/" + steamid,
                                            title: "View User Profile"
                                        }, {
                                            link: "#/users/" + steamid + "/friendslist/",
                                            title: "View User Friendslist"
                                        });
                                        $scope.loadingQuery = false;
                                    } else {
                                        $scope.results.push({
                                            link: "#",
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
                                            link: "#/items/rarity/" + rarity,
                                            title: "View All " + rarity + " Items"
                                        });
                                    }
                                });
                                //Compare against heroes.
                                angular.forEach($scope.heroes, function(hero, index) {
                                    hero.name = hero.name.toLowerCase();
                                    if (hero.name.indexOf(query) !== -1) {
                                        $scope.results.push({
                                            link: "#/items/hero/" + hero.dbName,
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
                                                link: "#/items/id/" + data.data[0].defindex,
                                                title: data.data[0].name
                                            });
                                        });
                                    } else {
                                        $scope.results.push({
                                            link: "#/items/name/" + query,
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
        .controller('ItemCategoriesCtrl', ['$scope', '$http', function($scope, $http) {
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
            }])
        .controller('UserListCtrl', ['$scope', '$http', 'api', function($scope, $http, api) {
                //Get Recent Users
                $http.get('action.php?action=getrecentusers').success(function(data) {
                    $scope.friends = data.data;
                });
                $scope.searching = false;
                $scope.communityUrlReached = false;
                $scope.communityUrlSuccess = false;
                $scope.profileReached = false;
                $scope.profileSuccess = false;
                
                $scope.searchUsers = function(vanityUrl) {
                    $scope.invalid = false;
                    $scope.searching = true;
                    $scope.profileSuccess = false;
                    $http.get('action.php?action=getsteamid&vanityurl=' + vanityUrl).success(function(data) { 
                        $scope.communityUrlReached = true;
                        if(data.success === true){
                            api.getUserDetails(data.data, function(response){
                                if(response.success === true){
                                    $scope.profileSuccess = true;
                                    $scope.searching = false;
                                    $scope.user = response.data;
                                }
                            });
                        } else {
                            $scope.invalid = true;
                        }
                    });
                };

            }])
        .controller('UserDetailCtrl', ['$scope', '$routeParams', 'api', 'ItemList', function($scope, $routeParams, api, itemList) {
                $scope.steamId = $routeParams.steamId;

                $scope.loading = true;
                $scope.totalDisplayed = 120;
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
                    
                    function toPercent(value, total){
                        return Math.floor((value/total)*100);
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
                $scope.loggedIn = user.loggedIn;
                if (user.loggedIn === true) {
                    api.getFriendsOwning(user.steamid, defindex, function(data) {
                        $scope.friendsOwning = data.data;
                    });
                }
            }])
        .controller('StatsCtrl', ['$scope', 'api', function($scope, api) {
                api.getStats(function(data) {
                    $scope.stats = data.data;
                    $scope.stats.averagePerUser = Math.round($scope.stats.uniqueItemCount / $scope.stats.totalUsers);
                });
            }])
        .controller('FaqCtrl', ['$scope', 'api', function($scope, api) {
            }]);