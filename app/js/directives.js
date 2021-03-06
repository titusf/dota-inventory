'use strict';

/* Directives */


angular.module('myApp.directives', []).
        directive('appVersion', ['version', function(version) {
                return function(scope, elm, attrs) {
                    elm.text(version);
                };
            }]).
        directive('itemSearch', ['api', function(api) {
                return{
                    template: ""
                };
            }]).
        directive('userList', [function() {
                return {
                    restrict: 'E',
                    templateUrl: 'partials/user-list.html',
                    scope: {
                        users: '=',
                        heading: '=',
                        subheading: '='
                    },
                    link: function(scope, elem, attrs) {
                        scope.currentPage = 1;
                        scope.limiter = 10;
                        scope.$watch('currentPage', function() {
                            scope.limiter = (scope.currentPage * 10);
                        });
                    }
                };
            }]).
        directive('itemList', ['$timeout', 'api', '$filter', function($timeout, api, $filter) {
                return {
                    scope: {
                        items: '=',
                        owners: '=',
                        rarityDisabled: '=',
                        heroDisabled: '='
                    },
                    templateUrl: 'partials/item-list.html',
                    link: function(scope, elem, attrs) {

                        // Pagination
                        scope.currentPage = 1;

                        api.getHeroes(function(data) {
                            scope.heroes = data.data;
                        });
                        scope.displayGrid = true;

                        scope.filterText = '';

                        var tempFilterText = '', filterTextTimeout;
                        scope.$watch('searchQuery', function(val) {
                            if (filterTextTimeout)
                                $timeout.cancel(filterTextTimeout);

                            tempFilterText = val;
                            filterTextTimeout = $timeout(function() {
                                scope.filterText = tempFilterText;
                            }, 600); //Delay 600ms for user search.
                        });

                        scope.$watch('items', function(n, o) {
                            if (typeof scope.items !== 'undefined') {
                                scope.loadingItems = false;
                                scope.sortedItems = scope.items;
                            } else {
                                scope.loadingItems = true;
                            }
                        });
                        scope.viewAsGrid = function() {
                            scope.displayGrid = true;
                        };
                        scope.viewAsList = function() {
                            scope.displayGrid = false;
                        };

                        var mapping = {
                            'common': 0,
                            'uncommon': 1,
                            'rare': 2,
                            'mythical': 3,
                            'legendary': 4,
                            'ancient': 5,
                            'immortal': 6,
                            'arcana': 7
                        };
                        scope.orderItems = function(sortBy) {
                            scope.sortedItems = $filter('orderBy')(scope.items, sortItems, true);
                        };
                        var sortItems = function(item) {
                            if (scope.orderProp === 'rarity') {
                                return [mapping[item.item_rarity], item.used_by_heroes, item.item_class];
                            } else {
                                return [item[scope.orderProp], mapping[item.item_rarity], item.item_class];
                            }
                        };

                    }
                };
            }]).
        directive('userTitle', function() {
            return{
                scope: {
                    user: '=',
                    activePage: '='
                },
                templateUrl: 'partials/user-title.html',
                link: function(scope, elem, attrs) {

                }
            };
        }).
        directive('dotaItemBlock', ['Heroes', 'Member', function(Heroes, Member) {
                return{
                    restrict: 'E',
                    scope: {
                        item: '=',
                        owners: '='
                    },
                    templateUrl: 'templates/dota-item-block.html',
                    link: function(scope, elem, attrs) {
                        var defindex = scope.item.defindex;
                        Heroes.getArray().then(function(result){
                            scope.heroes = result;
                        });
                        scope.constructHeroIconUrl = function(db_hero_name) {
                            return "img/heroes/icons/" + Heroes.stripNpcPrefix(db_hero_name) + "_icon.png";
                        };
                        Member.isLoggedIn().then(function(ok) {
                            Member.isItemInWishlist(defindex).then(function(isInWishlist){
                                scope.inWishlist = isInWishlist;
                            });
                            scope.addToWishlist = function() {
                                Member.addToWishlist(defindex).then(function(ok){
                                    scope.inWishlist = true;
                                });
                            };
                            scope.removeFromWishlist = function() {
                                Member.removeFromWishlist(defindex).then(function(ok){
                                    scope.inWishlist = false;
                                });
                            };
                        });
                    }
                };
            }]).
        directive('loaderScreen', ['$interval', function($interval) {
                return{
                    restrict: 'E',
                    scope: {
                        title: '=',
                        message: '='
                    },
                    templateUrl: 'partials/loading.html',
                    link: function(scope, elem, attrs) {
                        scope.loadingTime = 0;
                        scope.loadingTimeMessage = "Seconds Elapsed";
                        $interval(function() {
                            scope.loadingTime++;
                            if (scope.loadingTime > 20) {
                                scope.loadingTimeMessage = "Seconds Elapsed... This seems to be taking a while.";
                            }
                        }, 1000);
                    }
                };
            }]).
        directive('myAdSense', function() {
            return {
                templateUrl: 'partials/adsense.html',
                restrict: 'A',
                transclude: true,
                replace: true,
                controller: function() {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                },
                link: function($scope, element, attrs) {
                }
            }
        })
