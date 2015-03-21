'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngCookies']).
        controller('NavCtrl', ['$scope', '$location', 'user', function ($scope, $location, user) {
                $scope.logout = function () {
                    user.logout();
                    window.location.reload();
                };
                $scope.isCollapsed = true;
                // Loading whether user is logged in.
                user.steamidPromise.then(function (result) {
                    $scope.loggedIn = user.loggedIn;
                    $scope.steamid = user.steamid;
                    // Load user profile and inventory.
                    $scope.loadingProfile = false;
                    $scope.loadingInventory = false;
                    if (user.loggedIn) {
                        $scope.loadingProfile = true;
                        user.profilePromise.then(function (userProfile) {
                            $scope.user = userProfile;
                            $scope.loadingProfile = false;
                            //Now load inventory.
                            $scope.loadingInventory = true;
                            user.inventoryPromise.then(function (result) {
                                $scope.loadingInventory = false;
                            });
                        });
                    }
                });

                $scope.isActive = function (viewLocation) {
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
        .controller('TitleCtrl', ['$scope', 'title', function ($scope, title) {
                $scope.title = title;
            }])
        .controller('FrontPageCtrl', ['$scope', '$http', 'api', 'Heroes', function ($scope, $http, api, Heroes) {
                $scope.rarities = ["common", "uncommon", "rare", "mythical",
                    "legendary", "ancient", "immortal", "arcana"];
                $scope.heroes = [];
                api.getHeroes(function (data) {
                    angular.forEach(data.data, function (value, key) {
                        var dbName = key.substring(14, key.length);
                        $scope.heroes.push({
                            name: value,
                            dbName: dbName
                        });
                    });
                });
                var timeoutID;
                $scope.$watch('query', function (newVal, oldVal) {
                    var query = $scope.query;
                    $scope.results = [];
                    if (typeof query !== 'undefined') {
                        window.clearTimeout(timeoutID);
                        $scope.loadingQuery = true;
                        timeoutID = window.setTimeout(function () {
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
                                api.resolveVanityUrl(vanity).then(function (data) {
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
                                angular.forEach($scope.rarities, function (rarity, index) {
                                    if (rarity.substring(0, query.length) === query) {
                                        $scope.results.push({
                                            link: "items/rarity/" + rarity,
                                            title: "View All " + rarity + " Items"
                                        });
                                    }
                                });
                                //Compare against heroes.
                                Heroes.getArray().then(function (heroes) {
                                    angular.forEach(heroes, function (heroName, dbKey) {
                                        var heroNameLower = heroName.toLowerCase();
                                        if (heroNameLower.indexOf(query) !== -1) {
                                            $scope.results.push({
                                                link: "items/hero/" + Heroes.stripNpcPrefix(dbKey),
                                                title: "View All " + heroName + " Items"
                                            });
                                        }
                                    });
                                });
                                //Compare against item names.
                                $http.get('api/items?fields=id,name&name=' + query).success(function (data) {
                                    var matchCount = data.length;
                                    if (matchCount == 1) {
                                        $scope.results.push({
                                            link: "items/id/" + data[0].defindex,
                                            title: data[0].name
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
        .controller('ItemCategoriesCtrl', ['$scope', '$location', 'Heroes', 'title', function ($scope, $location, Heroes, title) {
                title.setTitle("Browse Dota 2 Items - DotaInventory.com");

                $scope.heroes = [];
                Heroes.getArray().then(function (heroes) {
                    angular.forEach(heroes, function (value, key) {
                        var shortDbName = Heroes.stripNpcPrefix(key);
                        $scope.heroes.push({
                            name: value,
                            dbName: shortDbName
                        });
                    });
                });
                Heroes.getProperName("npc_dota_hero_ursa").then(function (heroName) {
                    console.log(heroName);
                }, function (fail) {
                    console.log(fail);
                });
                $scope.goToSearchResults = function (query) {
                    $location.path('items/name/' + query);
                };
            }])
        .controller('UserFrontCtrl', ['$scope', '$http', 'api', 'SearchUser', 'title', function ($scope, $http, api, SearchUser, title) {
                title.setTitle("Steam User Search - DotaInventory.com")

                //Get Recent Users
                $http.get('api/action.php?action=getrecentusers').success(function (data) {
                    $scope.friends = data.data;
                });
                $scope.searching = false;
                $scope.profileReached = false;
                $scope.profileSuccess = false;

                $scope.searchUsers = function (userQuery) {
                    $scope.invalid = false;
                    $scope.searching = true;
                    $scope.profileSuccess = false;
                    if (SearchUser.isSteamid(userQuery)) {
                        //Get profile from this straight away.
                        performProfileFetch(userQuery);
                    } else if (SearchUser.isCommunityUrl(userQuery)) {
                        //Attempt to get steamid from community URL.
                        SearchUser.getSteamidFromUrl(userQuery).then(function (result) {
                            performProfileFetch(result);
                        }, function (rejectReason) {
                            $scope.invalid = true;
                            $scope.searching = false;
                            $scope.invalidReason = rejectReason;
                        });
                    } else {
                        //Unrecognised query format. (Error)
                        $scope.invalid = true;
                        $scope.searching = false;
                        $scope.invalidReason = "You did not enter a valid Steamid or Community URL."
                        console.log("Error (user search)");
                    }
                };
                var performProfileFetch = function (steamid) {
                    api.getUserDetails(steamid).then(function (response) {
                        $scope.profileSuccess = true;
                        $scope.searching = false;
                        $scope.user = response.data;
                    });
                };
            }])
        .controller('UserDetailCtrl', ['$scope', '$routeParams', 'api', 'user', 'title', function ($scope, $routeParams, api, user, title) {
                var steamid = $routeParams.steamId;
                $scope.steamId = steamid;

                // Mark the page as loading.
                $scope.loading = true;

                // Set the default number of items to display.
                $scope.totalDisplayed = 120;

                // Check if this is the logged in user's page.
                if (user.loggedIn && user.steamid === steamid) {
                    if (user.steamid === steamid) {
                        $scope.loggedInUserProfile = true;
                    }
                    // Otherwise, this is not a logged in user's page. (Or user is not logged in.)
                }

                api.getUserDetails($scope.steamId).then(function (response) {
                    title.setTitle(response.data.personaname + "'s Inventory - DotaInventory.com");
                    $scope.userApiFail = false;
                    $scope.user = response.data;
                    $scope.loading = false;
                    if ($scope.user.community_visibility_state !== '3') {
                        $scope.user.isprivate = true;
                    }
                    api.getInventory($scope.steamId, function (inventoryItems) {
                        $scope.loading = false;
                        var defindexes = [];
                        angular.forEach(inventoryItems, function (item, key) {
                            defindexes.push(item.defindex);
                        });
                        if (defindexes.length > 0) {
                            // Now pass in the array of defindexes to itemSearch api call.
                            api.searchItems(null, null, null, null, defindexes).then(function (items) {
                                $scope.items = items;
                            });
                        } else {
                            $scope.items = [];
                        }
                    }, function (fail) {
                        $scope.itemsApiFail = true;
                        $scope.errorMessage = fail;
                    });
                }, function (fail) {
                    $scope.loading = false;
                    $scope.userApiFail = true;
                    $scope.errorMessage = fail;
                });

            }])
        .controller('ItemSearchCtrl', ['$scope', '$routeParams', '$http', function ($scope, $routeParams, $http) {
                var searchTerm = $routeParams.searchTerm;
                $http.get('api/items?name=' + searchTerm).success(function (data) {
                    $scope.items = data;
                });
            }])
        .controller('FriendsListCtrl', ['$scope', '$routeParams', 'api', 'title', 'ItemList', function ($scope, $routeParams, api, title, itemList) {
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

                $scope.items = [];
                //Get main user's details.
                api.getUserDetails(steamId).then(function (response) {
                    $scope.loadingUser = false;
                    $scope.user = response.data;
                    if ($scope.user.community_visibility_state === '3') {
                        $scope.user.ispublic = true;
                    } else {
                        $scope.user.isprivate = true;
                    }
                });
                $scope.loadingFriends = true;

                var defindexMasterList = [];
                var owners = [];

                //Get friendslist / staemids.
                api.getFriendsList(steamId, function (friends) {
                    var friend_ids = friends;
                    $scope.friendCount = friend_ids.length;
                    var friendslist = new Array();
                    //Iterate over steamids and load profiles.
                    angular.forEach(friend_ids, function (friend, n) {
                        api.getUserDetails(friend['friend_steamid']).then(function (response) {
                            var friend = response.data;
                            friend.loading = false;
                            friendslist.push(friend);
                            combineDefindexLists(friend);
                        }, function (error) {
                            console.log("Could not load friend: " + friend['friend_steamid']);
                        });
                    });

                    $scope.loadingFriends = false;
                    title.setTitle($scope.user.personaname + "'s Friendslist");
                    $scope.friendslist = friendslist;
                    //$scope.items = itemList.getItemList();
                    $scope.item_count = 0;

                    $scope.friendsPrivate = 0;

                    function toPercent(value, total) {
                        return Math.floor((value / total) * 100);
                    }

                    function combineDefindexLists(friend) {
                        friend.loading = true;
                        if (friend.community_visibility_state === '3') {
                            api.getUserInventory(friend.steamid).then(function (response) {
                                var inventory = response.data;
                                friend.inventory_private = false;

                                // Loop that attempts to add defindexes without dupes.
                                for (var i = 0; i < inventory.length; i++) {
                                    var inventoryItem = inventory[i];
                                    // Owner stuff (add to)
                                    if (typeof owners[inventoryItem.defindex] === "undefined") {
                                        owners[inventoryItem.defindex] = [];
                                    }
                                    owners[inventoryItem.defindex].push({
                                        details: {
                                            steamid: friend.steamid,
                                            personaname: friend.personaname
                                        },
                                        quantity: inventoryItem.quantity
                                    });

                                    var isItemAlreadyThere = false;
                                    for (var j = 0; j < defindexMasterList.length; j++) {
                                        if (inventoryItem.defindex === defindexMasterList[j]) {
                                            isItemAlreadyThere = true;
                                            break;
                                        }
                                    }
                                    if (!isItemAlreadyThere) {
                                        defindexMasterList.push(inventoryItem.defindex);
                                    }
                                }
                            }, function (error) {
                                friend.inventory_private = true;
                            }).finally(function () {
                                friend.loading = false;
                                $scope.friendsLoaded++;
                                $scope.percentComplete = toPercent($scope.friendsLoaded, $scope.friendCount);

                                if ($scope.percentComplete === 100) {
                                    getItemsViaMultiRequests();
                                    $scope.owners = owners;
                                }
                            });
                        } else {
                            friend.inventory_private = true;
                            friend.loading = false;
                            $scope.friendsLoaded++;
                        }
                    }

                    function getItemsViaMultiRequests() {
                        while (defindexMasterList.length) {
                            api.searchItems(null, null, null, null, defindexMasterList.splice(0, 100)).then(function (items) {
                                $scope.items = $scope.items.concat(items);
                            });
                        }
                    }

                }
                );
            }
        ])
        .controller('UserWishListCtrl', ['$scope', '$routeParams', 'api', 'user', 'title', function ($scope, $routeParams, api, user, title) {
                var steamid = $routeParams.steamId;
                $scope.steamid = steamid;
                api.getUserDetails(steamid).then(function (response) {
                    $scope.user = response.data;
                    title.setTitle($scope.user.personaname + "'s Wishlist - DotaInventory.com");
                });
                api.getWishList(steamid).then(function (response) {
                    $scope.items = response;
                });
                $scope.deleteWishList = function () {
                    var result = confirm("Really delete ALL items?");
                    if (result === true) {
                        api.deleteWishList().then(function () {
                            window.location.reload();
                        });
                    }
                };
                if (user.loggedIn && user.steamid === steamid) {
                    if (user.steamid === steamid) {
                        $scope.loggedInUserProfile = true;
                    }
                }
            }])
        .controller('ItemHeroCtrl', ['$scope', 'api', 'Heroes', function ($scope, api, Heroes) {
                $scope.heroes = [];
                api.getHeroes(function (data) {
                    angular.forEach(data, function (value, key) {
                        var dbName = Heroes.stripNpcPrefix(key);
                        $scope.heroes.push({
                            name: value,
                            dbName: dbName
                        });
                    });
                });
            }])
        .controller('UserItemsCtrl', ['$scope', '$routeParams', 'api', function ($scope, $routeParams, api) {
                $scope.steamId = $routeParams.steamId;
                $scope.itemsLoading = true;
                $scope.totalDisplayed = 80;
                api.getInventory($scope.steamId, function (data) {
                    $scope.itemsLoading = false;
                    $scope.items = data;
                    $scope.loading = false;
                });
            }])
        .controller('ItemListRarityCtrl', ['$scope', '$routeParams', 'api', 'title', function ($scope, $routeParams, api, title) {
                var rarity = $routeParams.rarity;
                title.setTitle(rarity + " Dota 2 Items - DotaInventory.com");
                $scope.rarity = rarity;
                api.searchItems([rarity], null, null, null, null).then(function (items) {
                    $scope.items = items;
                });
            }])
        .controller('ItemListHeroCtrl', ['$scope', '$routeParams', 'api', 'Heroes', 'title', function ($scope, $routeParams, api, Heroes, title) {
                var npcHeroName = 'npc_dota_hero_' + $routeParams.heroName;
                $scope.npcHeroName = $routeParams.heroName;
                $scope.heroName = $routeParams.heroName;

                Heroes.getProperName(npcHeroName).then(function (properName) {
                    $scope.heroName = properName;
                    title.setTitle(properName + " Hero Items - DotaInventory.com");
                });
                api.searchItems(null, [npcHeroName], null, null, null).then(function (items) {
                    $scope.items = items;
                });
            }])
        .controller('ItemListTypeCtrl', ['$scope', '$routeParams', 'api', 'title', function ($scope, $routeParams, api, title) {
                var typeName = $routeParams.typeName;
                title.setTitle("Dota 2 " + typeName + "s - DotaInventory.com");
                $scope.typeName = typeName;
                api.getItemsByType(typeName).then(function (successData) {
                    $scope.items = successData;
                });
            }])
        .controller('FriendsItemsCtrl', ['$scope', '$routeParams', '$http', function ($scope, $routeParams, $http) {


            }])
        .controller('ItemDetailCtrl', ['$scope', '$routeParams', 'api', 'user', 'Member', 'title', function ($scope, $routeParams, api, user, Member, title) {
                var defindex = $routeParams.itemId;
                $scope.itemId = defindex;
                api.getItem($scope.itemId).success(function (data) {
                    var item = data[0];

                    title.setTitle(item.item_name + " - DotaInventory.com");

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
                    if ($scope.item.item_class === "bundle") {
                        api.getBundleIds().then(function (response) {
                            var bundles = response.data;
                            angular.forEach(bundles, function (bundle, key) {
                                if (item.item_name.indexOf(bundle.normal_name) > -1) {
                                    $scope.bundleId = bundle.id_name;
                                }
                            });
                        });
                    }
                });
                $scope.loggedIn = user.loggedIn;
                $scope.ownsItem = false;

                api.getItemPrice(defindex).then(function (resultData) {
                    $scope.marketResultCount = resultData.data.length;
                    var firstResult = resultData.data[0];
                    var lowest_price = (firstResult.lowest_price / 100).toFixed(2);
                    var median_price = (firstResult.median_price / 100).toFixed(2);
                    var date_fetched = firstResult.date_fetched;
                    $scope.marketData = {
                        lowest_price: lowest_price,
                        median_price: median_price,
                        date_fetched: date_fetched
                    };
                });

                Member.isLoggedIn().then(function (success) {
                    $scope.loggedIn = true;
                    Member.isItemInInventory(defindex).then(function (itemIsInInventory) {
                        if (itemIsInInventory)
                            $scope.ownsItem = true;
                    });
                    Member.isItemInWishlist(defindex).then(function (itemIsInWishlist) {
                        if (itemIsInWishlist)
                            $scope.inWishList = true;
                    });

                    $scope.removeFromWishlist = function (defindex) {
                        Member.removeFromWishlist(defindex).then(function (ok) {
                            $scope.inWishList = false;
                        });
                    }
                    $scope.addToWishlist = function (defindex) {
                        Member.addToWishlist(defindex).then(function (ok) {
                            $scope.inWishList = true;
                        });
                    }
                });

                $scope.currentPage = 1;
                $scope.limiter = 10;
                $scope.$watch('currentPage', function () {
                    $scope.limiter = ($scope.currentPage * 10);
                });
                $scope.limiter = ($scope.currentPage * 10);
                if (user.loggedIn === true) {
                    api.getFriendsOwning(user.steamid, defindex, function (data) {
                        $scope.friendsOwning = data.data;
                    });
                }
            }])
        .controller('TradeCtrl', ['$scope', 'api', function ($scope, api) {

            }])
        .controller('TradeDetailCtrl', ['$scope', '$routeParams', 'api', function ($scope, $routeParams, api) {
                $scope.tradeId = $routeParams.tradeId;
            }])
        .controller('BundlesRootCtrl', ['$scope', 'api', 'title', function ($scope, api, title) {
                title.setTitle("Dota 2 Bundles - DotaInventory.com");
                api.getBundleIds().then(function (response) {
                    $scope.bundles = response.data;
                });
            }])
        .controller('BundleDetailCtrl', ['$scope', '$routeParams', 'api', 'Heroes', 'Price', 'title', function ($scope, $routeParams, api, Heroes, Price, title) {
                var id_name = $routeParams.bundle_id_name;
                api.getBundle(id_name).then(function (response) {
                    var bundle = response.data;
                    title.setTitle(bundle.normal_name + " Bundle - DotaInventory.com");
                    $scope.bundle = bundle;

                    var bundlePrice = 0;
                    api.searchItems(null, null, null, [bundle.normal_name], null).then(function (response) {
                        angular.forEach(response, function (item, key) {
                            if (item.item_class === "bundle") {
                                $scope.bundleItem = item;
                                // Get bundle price.
                                Price.getLatest(item.defindex).then(function (result) {
                                    bundlePrice = result.lowest_price;
                                    $scope.bundlePrice = Price.format(result.lowest_price);
                                });
                            }
                        });
                    });

                    var bundleItemIds = [];
                    $scope.bundleItemPrices = [];
                    var contentsPrice = 1;
                    angular.forEach(bundle.contents, function (item, key) {
                        bundleItemIds.push(item.defindex);
                        Price.getLatest(item.defindex).then(function (result) {
                            if (typeof (result.lowest_price) !== "undefined") {
                                $scope.bundleItemPrices[item.defindex] = Price.format(result.lowest_price);
                                var lowestPrice = parseInt(result.lowest_price);
                                contentsPrice += lowestPrice;
                                $scope.contentsPrice = Price.format(contentsPrice);
                            } else {
                                $scope.contentsPriceMissing = true;
                            }
                        });
                    });
                    api.searchItems(null, null, null, null, bundleItemIds).then(function (items) {
                        $scope.bundleItems = items;
                    });
                });
                Heroes.getArray().then(function (heroes) {
                    $scope.heroes = heroes;
                });
                $scope.stripNpcPrefix = function (db_name) {
                    return Heroes.stripNpcPrefix(db_name);
                };
            }])
        .controller('StatsCtrl', ['$scope', 'api', function ($scope, api) {
                api.getStats(function (data) {
                    $scope.stats = data.data;
                    $scope.stats.averagePerUser = Math.round($scope.stats.uniqueItemCount / $scope.stats.totalUsers);
                });
            }])
        .controller('GiveawayFrontCtrl', ['$scope',  function ($scope) {
                var giveaways = [
                    {
                        id: 1,
                        status: "active",
                        millisLeft: "1232141",
                        title: "First Official Giveaway",
                        host: {
                            imageUrl: "..."
                        }
                    },
                    {id: 2, status: "empty"}, {id: 3, status: "empty"}, {id: 4, status: "empty"}, {id: 5, status: "empty"}, {id: 6, status: "empty"}
                ];
                $scope.giveaways = giveaways;
            }])
        .controller('GiveawayDetailCtrl', ['$scope', '$interval', function ($scope, $interval) {
                var model = {
                    id: 1,
                    title: 'Dota Inventory Giveaway I',
                    items: [4387],
                    entrants: 47,
                    dateStart: '03/21/2015 19:00',
                    dateFinish: '03/22/2015 19:00'
                };
                var itemModel = {
                    defindex: 4387

                };
                
                $scope.giveaway = model;
                
                $scope.entered = false;
                $scope.enter = function(){
                    console.log("Entered!");
                    $scope.entered = true;
                };
                
                $scope.expired = true;
                $scope.winner = {
                    name: "xXFluffyMaidenXx",
                    avatar: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/6f/6fedb697dd6af5b003ece695ff45a2dd7cbf17b4_full.jpg"
                };
                
                

                function msToTime(s) {

                    function addZ(n) {
                        return (n < 10 ? '0' : '') + n;
                    }

                    var ms = s % 1000;
                    s = (s - ms) / 1000;
                    var secs = s % 60;
                    s = (s - secs) / 60;
                    var mins = s % 60;
                    var hrs = (s - mins) / 60;

                    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
                }

                var currentTime = new Date().getTime();
                var millisLeft = Date.parse(model.dateFinish) - currentTime;
                if (millisLeft > 1000) {
                    $scope.timeLeft = msToTime(millisLeft);

                    var ticker = $interval(function () {
                        millisLeft -= 1000;
                        $scope.timeLeft = msToTime(millisLeft);
                    }
                    , 1000);
                } else {
                    $scope.timeLeft = "00:00:00";
                }
            }])
        .controller('FaqCtrl', ['$scope', 'api', function ($scope, api) {
            }]);