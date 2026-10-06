'use strict';
/**
 * This widget displays the official standings of the top 60 cars in a larger view so more data can be displayed than the Standings widget. 
 * These usually only change as you cross the start/finish line.
 * The cars are color coded as Red(At least a lap ahead), Blue (At least a lap behind), White (Same lap as you), Cyan (Off track).
 * In the header the Strength of Field (SOF) and current lap for the leader are displayed.
 * 
 * Column values displayed are: Position, Number, Name, Club, Blk(Blink Counter), Rating, Lap, Pit/Run(Pit Time/Laps since pitting), Behind Leader, Best, Last times.
 * 
 * Red box around the name indicates below minimum speed. 
 * Green box around Best is fastest lap overall and Last is fastest last lap if you are within 2 laps of the leader.
 * 
 * A caution-flag icon is shown next to a driver's name for 15 seconds after they are detected as likely involved
 * in an incident. Since iRacing does not reliably report other drivers' Incidents count during Official sessions,
 * this is inferred instead from a combination of: going off track, or losing significantly more pace than the
 * rest of the field is losing at that same moment (relative, not absolute, so it self-adjusts per track/car).
 * Cars that are pitting (entering, on pit road, in the stall, leaving, in the garage, or currently invalid) are
 * always excluded so a normal pit stop is never flagged as an incident.
 * <p>
 * Example:
 * <p><b>
 * &lt;sra-standings-top-60&gt;&lt;/sra-standings-top-60&gt;<br />
 * </b>
 * <img src="../widgets/StandingsTop60/icon.png" />
 * @ngdoc directive
 * @name sra-standings-top-60
 * @param {integer} data-sra-args-interval The interval, in milliseconds, that this widget will update from the server. Default is 1000.
 * @author Jeffrey Gilliam
 * @since 1.0
 * @copyright Copyright (C) 2015 - 2024 Jeffrey Gilliam
 * @license Apache License 2.0
 */
define(['SIMRacingApps','css!widgets/StandingsTop60Z15/StandingsTop60Z15','widgets/CarNumberZ15/CarNumberZ15'],
function(SIMRacingApps) {
    var self = {
        name:            'sraStandingsTop60Z15',
        url:             'StandingsTop60Z15',
        template:        'StandingsTop60Z15.html',
        defaultWidth:    600,
        defaultHeight:   1059,
        defaultInterval: 300,
        module:          angular.module('SIMRacingApps')
    };

    self.module.filter('removeTrailingNumbers', function() {
        return function(value) {
            if (!value)
                return value;
            return value.replace(/[0-9]+$/, '');
        };
    });
	
	self.module.filter('sraAbbreviateThousands', function() {
        return function(value) {
            if (value === undefined || value === null || isNaN(value))
                return value;
            return (value / 1000).toFixed(1) + 'K';
        };
    });

    // Session/Name is a raw pass-through of whatever iRacing itself calls the session
    // (SIM-dependent, no fixed list of values), so most session types display exactly
    // as iRacing sends them (e.g. TESTING, RACE). QUALIFY is the one exception where a
    // fuller word is wanted for display - matched by substring so it also catches
    // variants like "LONE QUALIFY" or "OPEN QUALIFY" without needing to know iRacing's
    // exact string. The replacement is looked up in translations (see text-en.json's
    // QUALIFYING key) rather than hardcoded, so other locales can supply their own word.
    // Add further { match, key } entries here if another raw value ever needs renaming.
    self.module.filter('sraSessionRename', function() {
        var RENAMES = [
            { match: 'QUALIFY', key: 'QUALIFYING' }
        ];
        return function(value, translations) {
            if (!value)
                return value;
            var upper = value.toUpperCase();
            for (var i = 0; i < RENAMES.length; i++) {
                if (upper.indexOf(RENAMES[i].match) !== -1)
                    return (translations && translations[RENAMES[i].key]) || value;
            }
            return value;
        };
    });

    self.module.directive(self.name,
           ['sraDispatcher',
    function(sraDispatcher) {
        return {
            restrict: 'EA',
            scope: true,
            templateUrl: sraDispatcher.getWidgetUrl(self.url) + '/' + self.template,
            controller: ['$scope', function($scope) {
                $scope.directiveName   = self.name;
                $scope.defaultWidth    = self.defaultWidth;
                $scope.defaultHeight   = self.defaultHeight;
                $scope.defaultInterval = self.defaultInterval;

                $scope.positions = ['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P17','P18','P19','P20','P21','P22','P23','P24','P25','P26','P27','P28','P29','P30','P31','P32','P33','P34','P35','P36','P37','P38','P39','P40','P41','P42','P43','P44','P45','P46','P47','P48','P49','P50','P51','P52','P53','P54','P55','P56','P57','P58','P59','P60'];
                //load translations
                sraDispatcher.loadTranslations(sraDispatcher.getWidgetUrl(self.url),'text',function(path) {
                    $scope.translations = sraDispatcher.getTranslation(path);
                });
            }]
            , link: function($scope,$element,$attrs) {
                $attrs.sraArgsData = $attrs.sraArgsData || ""; 
                $attrs.sraArgsData += ";Car/REFERENCE/Position";
                $scope.names = sraDispatcher.subscribe($scope,$attrs,self.defaultInterval); //register subscriptions and options to the dispatcher
                //if the reference car is out of view, put them at the bottom
                $scope.$watch("data.Car.REFERENCE.Position.Value", function(value) {
                    if (value)
                        $scope.positions[59] = (value > 60 ? 'REFERENCE' : 'P60');
                });
                
            }
        };
    }]);

    return self;
});