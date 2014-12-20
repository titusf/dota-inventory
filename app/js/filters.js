'use strict';

/* Filters */

angular.module('myApp.filters', []).
        filter('interpolate', ['version', function(version) {
                return function(text) {
                    return String(text).replace(/\%VERSION\%/mg, version);
                };
            }])
        .filter('limitFromTo', function() {
            return function(input, from, to) {
                return (input !== undefined) ? input.slice(from, to) : '';
            };
        });
;
