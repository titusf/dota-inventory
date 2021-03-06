'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers',
    'ui.bootstrap',
    'angulartics', 
    'angulartics.google.analytics'
], function() {}).
        config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
                //Setup HTML5Mode
                $locationProvider.html5Mode(true);
                
                //User routes.
                $routeProvider.when('/users', {templateUrl: 'partials/user-front.html', controller: 'UserFrontCtrl'});
                $routeProvider.when('/users/:steamId', {templateUrl: 'partials/user-detail.html', controller: 'UserDetailCtrl'});
                $routeProvider.when('/users/:steamId/friendslist', {templateUrl: 'partials/user-friendslist.html', controller: 'FriendsListCtrl'});
                $routeProvider.when('/users/:steamId/wishlist', {templateUrl: 'partials/user-wishlist.html', controller: 'UserWishListCtrl'});
                //Item Routes.
                $routeProvider.when('/items', {templateUrl: 'partials/item-categories.html', controller: 'ItemCategoriesCtrl'});
                $routeProvider.when('/items/id/:itemId', {templateUrl: 'partials/item-detail.html', controller: 'ItemDetailCtrl'});
                $routeProvider.when('/items/rarity', {templateUrl: 'partials/item-rarity-front.html', controller: 'ItemRarityCtrl'});
                $routeProvider.when('/items/rarity/:rarity', {templateUrl: 'partials/item-list-rarity.html', controller: 'ItemListRarityCtrl'});
                $routeProvider.when('/items/hero', {templateUrl: 'partials/item-heroes-front.html', controller: 'ItemHeroCtrl'});
                $routeProvider.when('/items/hero/:heroName', {templateUrl: 'partials/item-list-hero.html', controller: 'ItemListHeroCtrl'});
                $routeProvider.when('/items/set/:setName', {templateUrl: 'partials/item-list-set.html', controller: 'ItemListSetCtrl'});
                $routeProvider.when('/items/name/:searchTerm', {templateUrl: 'partials/item-search.html', controller: 'ItemSearchCtrl'});
                $routeProvider.when('/items/type/:typeName', {templateUrl: 'partials/item-list-type.html', controller: 'ItemListTypeCtrl'});
                // Bundles Routes
                $routeProvider.when('/bundles', {templateUrl: 'partials/bundles-list.html', controller: 'BundlesRootCtrl'});
                $routeProvider.when('/bundles/:bundle_id_name', {templateUrl: 'partials/bundle-detail.html', controller: 'BundleDetailCtrl'});
                // Giveaway routes
                $routeProvider.when('/giveaways', {templateUrl: 'partials/giveaways-front.html', controller: 'GiveawayFrontCtrl'});
                $routeProvider.when('/giveaways/:giveawayid', {templateUrl: 'partials/giveaway-detail.html', controller: 'GiveawayDetailCtrl'});
                //Trade routes (lol)
                $routeProvider.when('/trades', {templateUrl: 'partials/trade-front.html', controller: 'TradeCtrl'});
                $routeProvider.when('/trades/id/:tradeId', {templateUrl: 'partials/trade-detail.html', controller: 'TradeDetailCtrl'});
                //Stats page.
                $routeProvider.when('/stats', {templateUrl: 'partials/stats.html', controller: 'StatsCtrl'});
                //FAQ Page.
                $routeProvider.when('/faq', {templateUrl: 'partials/faq.html', controller: 'FaqCtrl'});
                //Search Page.
                $routeProvider.when('/search', {templateUrl: 'partials/search.html', controller: 'SearchCtrl'});
                //Support Us / Donations page
                $routeProvider.when('/support-us', {templateUrl: 'partials/support-us.html'})
                //Redirect to homepage otherwise.
                $routeProvider.otherwise({templateUrl: 'partials/front-page.html', controller: 'FrontPageCtrl'});
            }]);

