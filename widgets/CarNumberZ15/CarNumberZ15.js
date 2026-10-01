'use strict';
/**
 * This widget simply displays the car number using the colors returned by the SIM.
 * <p>
 * You can provide an image of your car number that is based on the league id returned by the SIM.
 * It requires your league be run using iRacing's leagues.
 * It will not work if it is a hosted session because iRacing does not return a league number.
 * The image path should be as follows:
 * <p>
 * Documents/SIMRacingApps/CarNumbers/LeagueID-{leagueId}/{carNumber}.png
 * <p>
 * The leagueId can be found in iRacing's League Directory listing by clicking on the league you are in 
 * and looking at the URL for that page. 
 * If you want to make numbers for your official races, use the league id of 0. 
 * Then create numbers for 1-60 to cover them all. These will be used by all cars.
 * <p>
 * Example: Documents/SIMRacingApps/CarNumbers/LeagueID-1489/61.png
 * <p>
 * All images should have an aspect ratio of 1.666 (i.e. 800 wide, 480 high) to cover the original number.
 * Note: Taking a screen shot of your number while in iRacing creates a dull image.
 * <p>
 * Example(s):
 * <p><b>
 * &lt;sra-car-number data-sra-args-car="ME"&gt;&lt;/sra-car-number&gt;<br />
 * &lt;div data-sra-car="ME"&gt;&lt;/div&gt;
 * </b>
 * <img src="../widgets/CarNumber/icon.png" />
 * @ngdoc directive
 * @name sra-car-number
 * @param {carIdentifier} data-sra-args-car The <a href="../JavaDoc/com/SIMRacingApps/Session.html#getCar-java.lang.String-" target="_blank">Car Identifier</a> to get the number from.
 * @param {integer} data-sra-args-interval The interval, in milliseconds, that this widget will update from the server. Default is 2000.
 * @author Jeffrey Gilliam
 * @since 1.0
 * @copyright Copyright (C) 2015 - 2024 Jeffrey Gilliam
 * @license Apache License 2.0
 */
define(['SIMRacingApps','css!widgets/CarNumberZ15/CarNumberZ15'],
function(SIMRacingApps) {

    var self = {
        name:            "sraCarNumberZ15",
        url:             'CarNumberZ15',
        template:        'CarNumberZ15.html',
        defaultWidth:    800,
        defaultHeight:   480,
        defaultInterval: 300   //initialize with the default interval
    };

    self.module = angular.module('SIMRacingApps'); //get the main module
	
	// TINT EXPERIMENT (disabled) - uncomment to re-enable per-car gradient tinting.
	// Matching HTML changes are in CarNumberZ15.html (search for "TINT EXPERIMENT").
	/*
	self.module.filter('sraTint', function() {
    return function(value, amount, baseColor) {
        if (!value)
            return value;
        amount = (amount === undefined) ? 0.5 : amount; // 0 = pure base, 1 = pure car color
        baseColor = baseColor || '40,40,40'; // matches your original #282828

        var match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match)
            return value;

        var base = baseColor.split(',').map(Number);
        var r = Math.round(match[1] * amount + base[0] * (1 - amount));
        var g = Math.round(match[2] * amount + base[1] * (1 - amount));
        var b = Math.round(match[3] * amount + base[2] * (1 - amount));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    };
});
	*/

    self.module.directive(self.name,
           ['sraDispatcher', '$filter','$rootScope',
    function(sraDispatcher,   $filter,  $rootScope) {
        return {
            restrict: 'EA',
            scope: true,
            templateUrl: sraDispatcher.getWidgetUrl(self.url) + '/' + self.template,
            controller: [ '$scope', function($scope) {
                $scope.directiveName   = self.name;
                $scope.defaultWidth    = self.defaultWidth;
                $scope.defaultHeight   = self.defaultHeight;
                $scope.defaultInterval = self.defaultInterval;
                
                $scope.CarNumber                = "";
                $scope.CarNumberSlant           = "right"; //normal, left, right, forward, backwards
                $scope.CarNumberFont            = "Arial";
                $scope.CarColor                 = "";
                $scope.CarColorNumber           = "";
                $scope.CarColorNumberOutline    = "";
                $scope.CarColorNumberBackground = "";
                $scope.transform                = "";
            }]
            , link: function($scope,$element,$attrs) {
                //copy arguments to our $scope
                //$scope.value = $scope[self.name] = $attrs[self.name] || $attrs.sraArgsCar || $attrs.sraArgsCarNumber || "REFERENCE";
                $scope.value = 
                $scope[self.name] = sraDispatcher.getTruthy($scope.sraArgsCAR, $attrs.sraArgsCar, $attrs.sraArgsCarNumber, $scope.sraArgsVALUE, $attrs[self.name], $attrs.sraArgsValue, "REFERENCE");
                // TINT EXPERIMENT (disabled) - only needed if the per-car gradient
                // tint above is re-enabled; see the matching commented block in
                // CarNumberZ15.html.
                // $scope.gradientId = "numberGradient-" + $scope.$id;

                //removed these attributes from the template because sraCar was not resolved at the time of compilation
                $attrs.sraArgsData =
                    ";Car/" + $scope.value + "/Number"                
                  + ";Car/" + $scope.value + "/NumberSlant"                               
                  + ";Car/" + $scope.value + "/Color"
                  + ";Car/" + $scope.value + "/ColorNumber"
                  + ";Car/" + $scope.value + "/ColorNumberOutline"
                  + ";Car/" + $scope.value + "/ColorNumberBackground"
                  + ";Session/LeagueID";
				  
				function isBadColor(c) {
                    if (c === null || c === undefined) return false;

    // fast check for pure black/white
                    if (c === 0 || c === 16777215) return true;

    // extract RGB
                    var r = (c >> 16) & 255;
                    var g = (c >> 8) & 255;
                    var b = c & 255;

    // near-black check - catches colors like #100f0f or #0c0807 that are
    // technically not pure black (0) or perfectly grayscale, but are dark
    // enough that they're indistinguishable from black once rendered
    // (e.g. as a stripe or tinted gradient against a dark row background)
                    if ((r + g + b) < 100) return true;

    // near-white check - mirror of the near-black check above, catches
    // colors like #f7f4f4 that are technically not pure white (16777215)
    // or perfectly grayscale, but are bright enough to be indistinguishable
    // from white once rendered. Max possible sum is 765 (255*3), so this
    // uses the same 60-point margin measured from the top instead of 0.
                    if ((r + g + b) > (765 - 60)) return true;

    // grayscale check
                    return (r === g && g === b);
}  

                $scope.$watch("data.Car['"+$scope.value+"'].Number.Value", function() {
                    $scope.CarNumber = $scope.data.Car[$scope.value].Number.ValueFormatted;
                });
                
                $scope.$watch("data.Car['"+$scope.value+"'].NumberSlant.Value", function() {
                    $scope.CarNumberSlant = $scope.data.Car[$scope.value].NumberSlant.Value;
                    if ($scope.CarNumberSlant == "left")
                        $scope.transform = "translate(50,0) skewX(-10)";
                    else
                    if ($scope.CarNumberSlant == "right")
                        $scope.transform = "translate(50,0) skewX(-10)";
                    else
                    if ($scope.CarNumberSlant == "forward")
                        $scope.transform = "translate(50,0) skewX(-10)";
                    else
                    if ($scope.CarNumberSlant == "backwards")
                        $scope.transform = "translate(50,0) skewX(-10)";
                    else
                        $scope.transform = "translate(50,0) skewX(-10)";
                        
                });
                
                
                $scope.$watch("data.Car['"+$scope.value+"'].NumberFont.Value", function() {

    var car = $scope.data.Car[$scope.value];

    if (!car || !car.NumberFont) {
        $scope.CarNumberFont = "Arial";
        return;
    }

    $scope.CarNumberFont = car.NumberFont.Value;
});
                
                $scope.$watchGroup([
                    "data.Car['"+$scope.value+"'].Color.Value",
                    "data.Car['"+$scope.value+"'].ColorNumber.Value",
                    "data.Car['"+$scope.value+"'].ColorNumberBackground.Value",
                    "data.Car['"+$scope.value+"'].ColorNumberOutline.Value"
                ], function() {

    var car = $scope.data.Car[$scope.value];

    // No active iRacing data
    if (!car || !car.Color || car.Color.State !== "NORMAL") {
        $scope.CarColor = 14540253; // #DDDDDD
        return;
    }

    var c1 = car.Color.Value;
    var c2 = car.ColorNumber.Value;
    var c3 = car.ColorNumberBackground.Value;
    var c4 = car.ColorNumberOutline.Value;

    var finalColor = c1;

    // Try alternate colors if the primary color is black, white, or grayscale
    if (isBadColor(finalColor)) finalColor = c2;
    if (isBadColor(finalColor)) finalColor = c3;
    if (isBadColor(finalColor)) finalColor = c4;

    // If everything was unusable, use gray
    if (isBadColor(finalColor))
        finalColor = 14540253; // #DDDDDD

    $scope.CarColor = finalColor;
});

                $scope.$watch("data.Car['"+$scope.value+"'].ColorNumber.Value", function() {
                    $scope.CarColorNumber = $scope.data.Car[$scope.value].ColorNumber.Value;
                });

                $scope.$watch("data.Car['"+$scope.value+"'].ColorNumberOutline.Value", function() {
                    $scope.CarColorNumberOutline = $scope.data.Car[$scope.value].ColorNumberOutline.Value;
                });

                $scope.$watch("data.Car['"+$scope.value+"'].ColorNumberBackground.Value", function() {
                    $scope.CarColorNumberBackground = $scope.data.Car[$scope.value].ColorNumberBackground.Value;
                });

            /**standard code that should be in every directive **/
                $rootScope.$on('sraResize', sraDispatcher.resize($scope,$element,self.defaultWidth,self.defaultHeight));

                $scope.names = sraDispatcher.subscribe($scope,$attrs,self.defaultInterval); //register subscriptions and options to the dispatcher

            }
        };
    }]);

    return self;
});
