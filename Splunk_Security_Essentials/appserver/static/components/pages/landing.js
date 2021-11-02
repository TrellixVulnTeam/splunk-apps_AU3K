'use strict';


require(
    [
        'jquery',
        'underscore',
        'backbone',
        'json!' + $C['SPLUNKD_PATH'] + '/services/SSEShowcaseInfo?locale=' + window.localeString,
        'json!' + $C['SPLUNKD_PATH'] + '/services/pullJSON?config=usecases&locale=' + window.localeString,
        "splunk.util"

    ],
    function(
        $,
        _,
        Backbone,
        ShowcaseInfo,
        UseCases,
        splunkUtil
    ) {

        function sendTelemetryForIntro(uc) {
            require(["components/data/sendTelemetry"], function(Telemetry) {
                Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "selectedIntroUseCase", "useCase": uc })
            })
        }




        function setLocalStorage(UseCase) {
            localStorage["sse-usecase-Multiple"] = "[\"" + UseCase.replace(/ /g, "_") + "\"]";
            localStorage["sse-usecase"] = UseCase.replace(/ /g, "_");
            if (typeof localStorage["sse-enabledFilters"] == "undefined") {
                localStorage["sse-enabledFilters"] = JSON.stringify(["journey", "usecase", "category", "datasource"])
            }
            if (localStorage["sse-enabledFilters"].indexOf("usecase") == -1) {
                let temp = JSON.parse(localStorage["sse-enabledFilters"])
                temp.unshift("usecase")
                localStorage["sse-enabledFilters"] = JSON.stringify(temp)
            }
            if (localStorage["sse-enabledFilters"].indexOf("journey") == -1) {
                let temp = JSON.parse(localStorage["sse-enabledFilters"])
                temp.push("journey")
                localStorage["sse-enabledFilters"] = JSON.stringify(temp)
            }

            window.location.href = "contents"
        }

        // console.log("Hey, I have a showcase...", ShowcaseInfo)
        window.ShowcaseInfo = ShowcaseInfo
        let CountByUseCase = new Object;
        let TotalUseCaseCount = 0
        Object.keys(window.ShowcaseInfo.summaries).forEach(function(ShowcaseName) {
            let ShowcaseSettings = ShowcaseInfo['summaries'][ShowcaseName]
            let UseCases = ShowcaseSettings['usecase'].split("|")
            TotalUseCaseCount++
            UseCases.forEach(function(UseCase) {
                if (typeof CountByUseCase[UseCase] == "undefined")
                    CountByUseCase[UseCase] = 0
                CountByUseCase[UseCase]++

            })

        })

        let keysInOrder = Object.keys(CountByUseCase);

        keysInOrder.sort(function(a, b) {
            if (UseCases[a].order > UseCases[b].order) {
                return 1;
            }
            if (UseCases[a].order < UseCases[b].order) {
                return -1;
            }
            return 0;
        });

        $("#analyticCount").text(TotalUseCaseCount)
        $("#ListOfUseCases").html("")
        keysInOrder.forEach(function(UseCase) {
            $("#ListOfUseCases").append(
                $("<div class=\"UseCase\">").append(
                    $("<div class=\"UseCaseImg\"><img src=\"" + UseCases[UseCase]['icon'] + "\" /></div>"),
                    $("<div class=\"UseCaseDescription\">").append(
                        $("<h2>").append(
                            $("<a href=\"#\"> " + UseCases[UseCase]['name'] + "</a>").click(function() {
                                sendTelemetryForIntro(UseCase);
                                setLocalStorage(UseCase);
                            })
                        ),

                        $("<h4>" + splunkUtil.sprintf(_("Featuring %s Examples!").t(), CountByUseCase[UseCase]) + "</h4>"),
                        $("<p>" + UseCases[UseCase]['description'] + "</p>")
                    )
                )
            )
        })
    })