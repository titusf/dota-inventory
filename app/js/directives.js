'use strict';

/* Directives */


angular.module('myApp.directives', []).
        directive('appVersion', ['version', function(version) {
                return function(scope, elm, attrs) {
                    elm.text(version);
                };
            }]).
        directive('itemList', ['api', function(api) {
                return {
                    scope: {
                        items: '=',
                        owners: '='
                    },
                    templateUrl: 'partials/item-list.html',
                    link: function(scope, elem, attrs) {
                        api.getHeroes(function(data) {
                            scope.heroes = data.data;
                        });
                        scope.maxDisplayed = 120;
                        scope.displayGrid = true;
                        scope.showMore = function() {
                            scope.maxDisplayed += 60;
                        };
                        scope.$watch('items', function(n, o) {
                            if (typeof scope.items !== 'undefined') {
                                scope.loadingItems = false;
                            } else {
                                scope.loadingItems = true;
                            }
                        });
                        scope.viewAsGrid = function() {
                            scope.displayGrid = true;
                        }
                        scope.viewAsList = function() {
                            scope.displayGrid = false;
                        }

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
                        scope.sortItems = function(item) {
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
        });
