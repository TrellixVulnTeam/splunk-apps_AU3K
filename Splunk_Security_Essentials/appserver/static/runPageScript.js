'use strict';


// set the runtime environment, which controls cache busting
var runtimeEnvironment = 'production';

// set the build number, which is the same one being set in app.conf
var build = '10140';

// get app and page names
var pathComponents = location.pathname.split('?')[0].split('/');
var appName = 'Splunk_Security_Essentials';
var pageIndex = pathComponents.indexOf(appName);
var pageName = pathComponents[pageIndex + 1];

// path to the root of the current app
var appPath = "../app/" + appName;

// Queue translation early, before other work occurs
window.localeString = location.href.replace(/\/app\/.*/, "").replace(/^.*\//, "")
window.startTime = Date.now()

// console.log("Starting", Date.now() - window.startTime)
require(
    [
        'jquery',

    ],
    function(
        $
    ) {
        window.translationLoaded = $.Deferred();
        let languageLoaded = $.Deferred();
        let splunkJSLoaded = $.Deferred();

        $.when(languageLoaded, splunkJSLoaded).then(function(localizeStrings) {
            function runTranslation() {
                let translatable = $("[data-translate-id]");
                for (let i = 0; i < translatable.length; i++) {
                    let id = $(translatable[i]).attr("data-translate-id");
                    if (localizeStrings[id]) {
                        translatable[i].innerHTML = localizeStrings[id]
                    }

                }
                // console.log("Language Loading Complete", Date.now() - window.startTime)
            }

            function runTranslationOnElement(element) {
                for (let id in localizeStrings) {
                    if (element.find("#" + id).length) {
                        element.find("#" + id).html(localizeStrings[id])
                    }
                }
            }
            runTranslation()
            window.runTranslationOnElement = runTranslationOnElement
            window.translationLoaded.resolve()
        })
        if (typeof localStorage[appName + "-i18n-" + window.localeString] != "undefined" && localStorage[appName + "-i18n-" + window.localeString] != "") {
            let langObject = JSON.parse(localStorage[appName + "-i18n-" + window.localeString])
            if (langObject['build'] == build) {
                languageLoaded.resolve(langObject)

                if (window.location.href.indexOf("127.0.0.1") >= 0 || window.location.href.indexOf("localhost") >= 0) { // only refresh in a dev env (or one without latency), otherwise it's not necessary as long as the build is the same.
                    // console.log("Found cache hit in localStorage", Date.now() - window.startTime)
                    $.ajax({
                        url: $C['SPLUNKD_PATH'] + '/services/pullJSON?config=htmlpanels&locale=' + window.localeString,
                        async: true,
                        success: function(localizeStrings) {
                            localizeStrings['build'] = build;
                            localStorage[appName + "-i18n-" + window.localeString] = JSON.stringify(localizeStrings)
                        }
                    });

                }
            } else {
                // console.log("localStorage out of date, starting to grab file", Date.now() - window.startTime)
                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/services/pullJSON?config=htmlpanels&locale=' + window.localeString,
                    async: true,
                    success: function(localizeStrings) {
                        languageLoaded.resolve(localizeStrings)
                        localizeStrings['build'] = build;
                        localStorage[appName + "-i18n-" + window.localeString] = JSON.stringify(localizeStrings)
                    }
                });
            }
        } else {
            // console.log("Not in localStorage, starting to grab file", Date.now() - window.startTime)
            $.ajax({
                url: $C['SPLUNKD_PATH'] + '/services/pullJSON?config=htmlpanels&locale=' + window.localeString,
                async: true,
                success: function(localizeStrings) {

                    languageLoaded.resolve(localizeStrings)
                    localizeStrings['build'] = build;
                    localStorage[appName + "-i18n-" + window.localeString] = JSON.stringify(localizeStrings)
                }
            });
        }

        require(
            [
                'jquery',
                "splunkjs/ready!",

            ],
            function(
                $
            ) {
                // not resolving anything here...
                // console.log("SplunkJS Ready", Date.now() - window.startTime)
            })

        require(
            [
                'jquery',
                "splunkjs/mvc/simplexml/ready!",

            ],
            function(
                $
            ) {
                // console.log("SimpleXML Ready", Date.now() - window.startTime)
                splunkJSLoaded.resolve()
            })


    })

// This code is originally from setRequireConfig.es6 and is injected into runPageScript.es6 and every visualization.es6 file using @setRequireConfig.es6@

var requireConfigOptions = {
    paths: {
        // app-wide path shortcuts
        "components": appPath + "/components",
        "vendor": appPath + "/vendor",
        "Options": appPath + "/components/data/parameters/Options",

        // requirejs loader modules
        "text": appPath + "/vendor/text/text",
        "json": appPath + "/vendor/json/json",
        "css": appPath + "/vendor/require-css/css",

        // jquery shims
        "jquery-ui-slider": appPath + "/vendor/jquery-ui-slider/jquery-ui.min",

        // highcharts shims
        "highcharts-amd": appPath + "/vendor/highcharts/highcharts.amd",
        "highcharts-more": appPath + "/vendor/highcharts/highcharts-more.amd",
        "highcharts-downsample": appPath + "/vendor/highcharts/modules/highcharts-downsample.amd",
        "no-data-to-display": appPath + "/vendor/highcharts/modules/no-data-to-display.amd",

        // srcviewer shims
        "prettify": appPath + "/vendor/prettify/prettify",
        "showdown": appPath + "/vendor/showdown/showdown",
        "codeview": appPath + "/vendor/srcviewer/codeview"
    },
    shim: {
        "jquery-ui-slider": {
            deps: ["css!" + appPath + "/vendor/jquery-ui-slider/jquery-ui.min.css"]
        }
    },
    config: {
        "Options": {
            // app-wide options
            "options": {
                "appName": 'Splunk_Security_Essentials',
                // the number of points that's considered "large" - how each plot handles this is up to it
                "plotPointThreshold": 1000,
                "maxSeriesThreshold": 1000,
                "smallLoaderScale": 0.4,
                "largeLoaderScale": 1,
                "highchartsValueDecimals": 2,
                "defaultModelName": "default_model_name",
                "defaultRoleName": "default",
                "dashboardHistoryTablePageSize": 5
            }
        }
    }
};

require.config(requireConfigOptions);

// End of setRequireConfig.es6

// path to the script for the current page
var scriptPath = "components/pages/" + pageName;

var requireModules = ["jquery", "splunkjs/ready!", "components/controls/PreviousValueStore", "css!" + appPath + "/style/app", "css!" + appPath + "/style/" + pageName];

var additionalConfigOptions = {
    config: {}
};

// console.log("Page Name", pageName, pageName.indexOf("contents"))
let pagesWithJS = ["contents", "beta_overview"];
if (pagesWithJS.indexOf(pageName) >= 0) {
    // console.log("Before", requireModules)
    requireModules.push('components/pages/' + pageName)
    requireModules.push('components/controls/ValidateAllRequiredNav')
        // console.log("After", requireModules)
}
if (pageName.indexOf("home") == 0) {
    // console.log("Before", requireModules)
    requireModules.push('components/pages/landing')
    requireModules.push('components/controls/ValidateAllRequiredNav')
        // console.log("After", requireModules)
}

if (typeof localStorage[appName + '-PageViews'] == "undefined") {
    localStorage[appName + '-PageViews'] = 1
} else {
    localStorage[appName + '-PageViews'] = parseInt(localStorage[appName + '-PageViews']) + 1
}

// additional config options and require modules for showcases
if (pageName.indexOf("showcase_") >= 0) {
    requireModules.push('components/data/sampleSearches/SampleSearchLoader', scriptPath);

    additionalConfigOptions.config['components/data/sampleSearches/SampleSearchLoader'] = {
        pageName: pageName
    };
}

// additional config options and require modules for showcases
if (pageName == "data_inventory") {
    requireModules.push('/static/app/' + appName + '/components/pages/data_inventory.js');

}
if (pageName == "data_inventory_alpha") {
    requireModules.push('/static/app/' + appName + '/components/pages/data_inventory_alpha.js');

}
if (pageName.indexOf("customize_content") >= 0) {
    requireModules.push('/static/app/' + appName + '/components/pages/' + pageName + '.js');
}
if (pageName.indexOf("mitre_overview") >= 0 || pageName.indexOf("content_overview") >= 0 || pageName.indexOf("kill_chain_overview") >= 0) {
    requireModules.push('/static/app/' + appName + '/components/pages/analytics_advisor.js');
    requireModules.push('css!/static/app/' + appName + '/style/analytics_advisor.css');
    requireModules.splice(requireModules.indexOf("css!../app/Splunk_Security_Essentials/style/" + pageName), 1)
}

additionalConfigOptions.urlArgs = "bust=" + (runtimeEnvironment === 'develop' ? Date.now() : build);

require.config(additionalConfigOptions);
// console.log("ReallyAfter", requireModules)
// run page script
require(requireModules, function() {
    require(['splunkjs/mvc/simplexml/controller', "components/controls/DependencyChecker", "components/data/parameters/RoleStorage"], function(DashboardController, DependencyChecker, RoleStorage) {
        DashboardController.onReady(function() {
            DashboardController.onViewModelLoad(function() {

                RoleStorage.updateMenu();
            });
        });
    });
});
