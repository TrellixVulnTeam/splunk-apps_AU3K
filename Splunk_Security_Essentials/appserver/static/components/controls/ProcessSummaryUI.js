'use strict';





define(['jquery', 'underscore', 'module', "components/data/sendTelemetry", "components/controls/BuildTile",
    "splunkjs/mvc/searchmanager",
    "splunkjs/mvc/simplexml/element/chart",
    "splunkjs/mvc/simplexml/element/map",
    "splunkjs/mvc/simplexml/element/table",
    "splunkjs/mvc/simplexml/element/single",
    "splunkjs/mvc/resultslinkview"
], function($, _, module, Telemetry, BuildTile, SearchManager, ChartElement, MapElement, TableElement, SingleElement, ResultsLinkView) {
    var config = module.config();
    return {
        process_chosen_summary: function process_chosen_summary(summary, sampleSearch, ShowcaseInfo, showcaseName) {


            //console.log("ShowcaseInfo: Got it!", summary, sampleSearch, showcaseName)
            if (typeof sampleSearch.label != "undefined" && sampleSearch.label.indexOf(" - Demo") > 0) {
                var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');
                unsubmittedTokens.set("demodata", "blank");
                submittedTokens.set(unsubmittedTokens.toJSON());
            }

            var DoImageSubtitles = function(numLoops) {
                if (typeof numLoops == "undefined")
                    numLoops = 1
                var doAnotherLoop = false
                    //console.log("Starting the Subtitle..")
                $(".screenshot").each(function(count, img) {
                    //console.log("got a subtitle", img)

                    if (typeof $(img).css("width") != "undefined" && parseInt($(img).css("width").replace("px")) > 10 && typeof $(img).attr("processed") == "undefined") {
                        var width = "width: " + $(img).css("width")

                        var myTitle = ""
                        if (typeof $(img).attr("title") != "undefined" && $(img).attr("title") != "") {
                            myTitle = "<p style=\"color: gray; display: inline-block; clear:both;" + width + "\"><center><i>" + $(img).attr("title") + "</i></center>"

                        }
                        $(img).attr("processed", "true")
                        if (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != "") {
                            // console.log("Handling subtitle zoom...", width, $(img).attr("zoomin"), $(img).attr("setWidth"), (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != ""))
                            if (typeof $(img).attr("setwidth") != "undefined" && parseInt($(img).css("width").replace("px")) > parseInt($(img).attr("setwidth"))) {
                                width = "width: " + $(img).attr("setwidth") + "px"
                            }
                            $(img).replaceWith("<div style=\"display: inline-block; margin:10px; border: 1px solid lightgray;" + width + "\"><a href=\"" + $(img).attr("src") + "\" target=\"_blank\">" + img.outerHTML + "</a>" + myTitle + "</div>")
                        } else {
                            ($(img)).replaceWith("<div style=\"display: block; margin:10px; border: 1px solid lightgray;" + width + "\">" + img.outerHTML + myTitle + "</div>")
                        }

                    } else {
                        doAnotherLoop = true
                            //console.log("Analyzing image: ", $(img).css("width"), $(img).attr("processed"), $(img))
                    }
                })
                if (doAnotherLoop && numLoops < 30) {
                    numLoops++;
                    setTimeout(function() { DoImageSubtitles(numLoops) }, 500)
                }
            }
            window.DoImageSubtitles = DoImageSubtitles

            Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "exampleLoaded", "exampleName": summary.name, "searchName": sampleSearch.label })



            if (typeof $(".dashboard-header-title")[0] != "undefined") {
                $(".dashboard-header-description").html("Assistant: " + $(".dashboard-header-title").first().html())
                $(".dashboard-header-title").html("<a href=\"contents\">" + _("Security Content").t() + "</a> / " + summary.name)

            } else {
                //$(".dashboard-header-description").html("Assistant: " + $(".dashboard-header-title").first().html() )  
                $(".dashboard-header h2").first().html(summary.name + " (Assistant: " + $(".dashboard-header h2").first().html() + ")")
            }
            //console.log("ShowcaseInfo: Original Title", document.title)
            document.title = summary.name + document.title.substr(document.title.indexOf("|") - 1)
            var exampleText = ""
            var exampleList = $('<span></span>')
                //console.log("ShowcaseInfo: New Title", document.title)
            if (typeof summary.examples != "undefined") {
                exampleText = $('<div id="exampleList" style="float: right"> View&nbsp;&nbsp;</div>')
                    //exampleText = '<div id="searchList" style="float: right; border: solid lightgray 1px; padding: 5px;"><a name="searchListAnchor" />' 
                    //exampleText += summary.examples.length > 1 ? '<h2 style="padding-top: 0;">Searches:</h2>' : '<h2 style="padding-top: 0;">Search:</h2>';
                    //exampleList = $('<ul class="example-list"></ul>');

                summary.examples.forEach(function(example) {
                    var showcaseURLDefault = summary.dashboard;
                    if (summary.dashboard.indexOf("?") > 0) {
                        showcaseURLDefault = summary.dashboard.substr(0, summary.dashboard.indexOf("?"))
                    }

                    var url = showcaseURLDefault + '?ml_toolkit.dataset=' + example.name;
                    if (example.name == sampleSearch.label) {
                        //exampleList.append($('<li></li>').append(example.label+ " (You are here)"));

                        exampleText.append($("<button></button>").addClass("selectedButton").text(example.label))
                    } else {
                        //exampleList.append($('<li></li>').append($('<a></a>').attr('href', url).append(example.label )));

                        exampleText.append($("<button></button>").text(example.label).click(function() { window.location.href = url }))
                    }
                });
                //exampleText += "<ul>" + exampleList.html() + "</ul></div>"
                exampleText.find("button").first().addClass("first")
                exampleText.find("button").last().addClass("last")
                    //("Got my Example Text...", exampleText)
                if (summary.examples.length > 1) {
                    var content = "<span>Demo Data</span> You're looking at the <i>" + sampleSearch.label.replace(/^.*\- /, "") + "</i> search right now. Did you know that we have " + summary.examples.length + " searches for this example? <a style=\"color: white; font-weight: bold; text-decoration: underline\" href=\"#\" onclick=\"var jElement = $('#searchList'); $('html, body').animate({ scrollTop: jElement.offset().top});  jElement.addClass('searchListHighlight');setTimeout(function(){ jElement.removeClass('searchListHighlight'); },2000);return false;\">Scroll Up</a> to the top to see the other searches."

                    setTimeout(function() {
                        $("#searchLabelMessage").html(content)
                            //console.log("Setting the reference content to ", content)

                    }, 1000)
                }


            }
            //var Template = "<div class=\"detailSectionContainer expands\" style=\"display: block; border: black solid 1px; padding-top: 0; \"><h2 style=\"background-color: #F0F0F0; line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\")}else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\")} return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2><div style=\"display: none; padding: 8px;\" id=\"SHORTNAMESection\">"
            var Template = "<table id=\"SHORTNAME_table\" class=\"dvexpand table table-chrome\"><thead><tr><th class=\"expands\"><h2 style=\"line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\"); $(\"#SHORTNAME_table\").addClass(\"expanded\"); $(\"#SHORTNAME_table\").removeClass(\"table-chrome\");  $(\"#SHORTNAME_table\").find(\"th\").css(\"border-top\",\"1px solid darkgray\");  }else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\");  $(\"#SHORTNAME_table\").removeClass(\"expanded\");  $(\"#SHORTNAME_table\").addClass(\"table-chrome\"); } return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2></th></tr></thead><tbody><tr><td style=\"display: none; border-top-width: 0;\" id=\"SHORTNAMESection\">"

            var areaText = ""
            if (typeof summary.category != "undefined") {
                areaText = "<p><h2>" + _("Category").t() + "</h2>" + summary.category.split("|").join(", ") + "</p>"
            }
            var usecaseText = ""
            if (typeof summary.category != "undefined") {
                usecaseText = "<p><h2>" + _("Use Case").t() + "</h2>" + summary.usecase.split("|").join(", ") + "</p>"
            }

            var showSPLButton = '<div id="showSPLMenu" />' // Show SPL Button
                // What follows is Advanced SPL Option
            var checkedtext = ""
            if (typeof localStorage['sse-splMode'] != "undefined" && localStorage['sse-splMode'] == "true")
                checkedtext = " checked"
            var showAdvancedMode = '<div style="width: 300px; margin-top: 15px;" class="filterItem"><label class="filterswitch"><input type="checkbox" id="enableAdvancedSPL" ' + checkedtext + '><span class="filterslider "></span></label><div style="display: inline;" class="filterLine">Enable Advanced SPL Mode</div></div> '

            if (typeof summary.hideSPLMode != "undefined" && summary.hideSPLMode == true) {
                showAdvancedMode = ""
                $("#fieldset1").hide() // Search Bar
                $("#row11").hide() // Prereq 
            }

            var showSPLText = Template.replace(/SHORTNAME/g, "showSPL").replace("TITLE", "Show Search")
            showSPLText += showSPLButton + showAdvancedMode + "</td></tr></table>"

            if (typeof summary.hideSearches != "undefined" && summary.hideSearches == true) {
                showSPLText = "" // Hide the search accordian
                $("#fieldset1").hide() // hide  the search bar
                $("#row11").hide() // Prereq 
                for (var i = 2; i <= 10; i++) { //all of the dashboard panel 
                    $("#row" + i).hide()
                }
            }

            var knownFPText = ""
            if (typeof summary.knownFP != "undefined" && summary.knownFP != "") {
                knownFPText = Template.replace(/SHORTNAME/g, "knownFP").replace("TITLE", _("Known False Positives").t()) + summary.knownFP + "</td></tr></table>" // "<h2>Known False Positives</h2><p>" + summary.knownFP + "</p>"
            }

            var howToImplementText = ""
            if (typeof summary.howToImplement != "undefined" && summary.howToImplement != "") {
                howToImplementText = Template.replace(/SHORTNAME/g, "howToImplement").replace("TITLE", _("How to Implement").t()) + summary.howToImplement + "</td></tr></table>" // "<h2>How to Implement</h2><p>" + summary.howToImplemement + "</p>"
            }

            var eli5Text = ""
            if (typeof summary.eli5 != "undefined" && summary.eli5 != "") {
                eli5Text = Template.replace(/SHORTNAME/g, "eli5").replace("TITLE", _("Detailed Search Explanation").t()) + summary.eli5 + "</td></tr></table>" // "<h2>Detailed Search Explanation</h2><p>" + summary.eli5 + "</p>"
            }


            var SPLEaseText = ""
            if (typeof summary.SPLEase != "undefined" && summary.SPLEase != "") {
                SPLEaseText = "<h2>" + _("SPL Difficulty").t() + "</h2><p>" + summary.SPLEase + "</p>"
            }


            var operationalizeText = ""
            if (typeof summary.operationalize != "undefined" && summary.operationalize != "") {
                operationalizeText = Template.replace(/SHORTNAME/g, "operationalize").replace("TITLE", _("How To Respond").t()) + summary.operationalize + "</td></tr></table>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            }

            var gdprText = ""
            if (typeof summary.gdprtext != "undefined" && summary.gdprtext != "") {
                gdprText = Template.replace(/SHORTNAME/g, "gdprtext").replace("TITLE", _("GDPR Relevance").t()) + summary.gdprtext + "</td></tr></table>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            }

            var relevance = ""
            if (typeof summary.relevance != "undefined" && summary.relevance != "") {
                relevance = "<h2>" + _("Security Impact").t() + "</h2><p>" + summary.relevance + "</p>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            }


            var descriptionText = "<h2>" + _("Description").t() + "</h2>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            var alertVolumeText = "<h2>" + _("Alert Volume").t() + "</h2>"




            if (summary.alertvolume == "Very Low" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/)) {
                alertVolumeText += _("Very Low").t() + ' <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _('An alert volume of Very Low indicates that a typical environment will rarely see alerts from this search, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)').t() + '">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/, '')
            } else if (summary.alertvolume == "Low" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/)) {
                alertVolumeText += _("Low").t() + ' <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _("An alert volume of Low indicates that a typical environment will occasionally see alerts from this search -- probably 0-1 alerts per week, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert if you decide it is relevant to your risk profile, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)").t() + '">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/, '')
            } else if (summary.alertvolume == "Medium" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/)) {
                alertVolumeText += _("Medium").t() + ' <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Medium" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _("An alert volume of Medium indicates that you\'re likely to see one to two alerts per day in a typical organization, though this can vary substantially from one organization to another. It is recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)").t() + '">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/, '')
            } else if (summary.alertvolume == "High" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/)) {
                alertVolumeText += _("High").t() + ' <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _("An alert volume of High indicates that you\'re likely to see several alerts per day in a typical organization, though this can vary substantially from one organization to another. It is highly recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)").t() + '">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/, '')
            } else if (summary.alertvolume == "Very High" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/)) {
                alertVolumeText += _("Very High").t() + ' <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _("An alert volume of Very High indicates that you\'re likely to see many alerts per day in a typical organization. You need a well thought out high volume indicator search to get value from this alert volume. Splunk ES\'s Risk Framework is a starting point, but is probably insufficient given how common these events are. It is highly recommended that you either build correlation searches based on the output of this search, or leverage Splunk UBA with it\'s threat models to surface the high risk indicators.").t() + '">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/, '')
            } else {
                alertVolumeText += summary.description.replace(/(<b>\s*Alert Volume:.*?)<\/p>.*/, '$1 <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="' + _("The alert volume indicates how often a typical organization can expect this search to fire. On the Very Low / Low side, alerts should be rare enough to even send these events directly to the SIEM for review. Oh the High / Very High side, your SOC would be buried under the volume, and you must send the events only to an anomaly aggregation and threat detection solution, such as Splunk UBA (or for a partial solution, Splunk ES\'s risk framework). To that end, *all* alerts, regardless of alert volume, should be sent to that anomaly aggregation and threat detection solution. More data, more indicators, should make these capabilites stronger, and make your organization more secure.").t() + '">(?)</a>')
                descriptionText += summary.description.replace(/(<b>\s*Alert Volume:.*?)(?:<\/p>)/, '')
            }

            //alertVolumeText += "</div></div>"

            //relevance = summary.relevance ? "<p><h2>Security Impact</h2>" +  + "</p>" : ""

            per_instance_help = Template.replace(/SHORTNAME/g, "help").replace("TITLE", "Help")
            per_instance_help += $("h3:contains(How Does This Detection Work)").parent().html()
            per_instance_help += summary.help ? "<p><h3>" + summary.name + " Help</h3></p>" + summary.help : ""
            per_instance_help += "</td></tr></table>"
            $("#row1").hide() // Hide the basic search link
            $(".hide-global-filters").hide() // Hide the "Hide Filters" link
            panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
            panelEnd = "</div></div>                    </div>                </div>            </div>        </div>    </div>"

            //console.log("Here's my summary!", summary)

            var relatedUseCasesText = ""
            if (typeof summary.relatedUseCases != "undefined" && summary.relatedUseCases.length > 0) {
                relatedUseCasesText = "<h2>" + _("Related Use Cases").t() + "</h2>"
                var tiles = $('<ul class="showcase-list"></ul>')
                for (var i = 0; i < summary.relatedUseCases.length; i++) {
                    if (typeof ShowcaseInfo['summaries'][summary.relatedUseCases[i]] != "undefined")
                        tiles.append($("<li style=\"width: 230px; height: 320px\"></li>").append(BuildTile.build_tile(ShowcaseInfo['summaries'][summary.relatedUseCases[i]], true)))

                }
                relatedUseCasesText += '<ul class="showcase-list">' + tiles.html() + '</ul>'

            }

            var similarUseCasesText = ""
            if (typeof summary.similarUseCases != "undefined" && summary.similarUseCases.length > 0) {
                similarUseCasesText = "<h2>" + _("Similar Use Cases").t() + "</h2><p>Sometimes Splunk will solve the same problem in multiple ways, based on greater requirements. What we can do with a simple example for one data source at Stage 1 of the Journey, we can do across all datasets at Stage 2, and with more impact at Stage 4. Here are other versions of the same underlying technique.</p>";
                var tiles = $('<ul class="showcase-list"></ul>')
                for (var i = 0; i < summary.similarUseCases.length; i++) {
                    if (typeof ShowcaseInfo['summaries'][summary.similarUseCases[i]] != "undefined")
                        tiles.append($("<li style=\"width: 230px; height: 320px\"></li>").append(BuildTile.build_tile(ShowcaseInfo['summaries'][summary.similarUseCases[i]], true)))

                }
                similarUseCasesText += '<ul class="showcase-list">' + tiles.html() + '</ul>'
                    //  console.log("Here's my similar use cases..", similarUseCasesText)

            }


            var fullSolutionText = ""
            if (typeof summary.fullSolution != "undefined") {
                fullSolutionText += "<br/><h2>" + _("Relevant Splunk Premium Solution Capabilities").t() + "</h2><button class=\"btn\" onclick=\"triggerModal(window.fullSolutionText); return false;\">Find more Splunk content for this Use Case</button>"

            }

            var otherSplunkCapabilitiesText = ""
            if (relatedUseCasesText != "" || similarUseCasesText != "" || fullSolutionText != "") {
                otherSplunkCapabilitiesText = Template.replace(/SHORTNAME/g, "fullSolution").replace("TITLE", "Related Splunk Capabilities") //<p><h2>Full Splunk Capabilities</h2></p>"
                otherSplunkCapabilitiesText += similarUseCasesText
                otherSplunkCapabilitiesText += relatedUseCasesText
                otherSplunkCapabilitiesText += fullSolutionText
                otherSplunkCapabilitiesText += "</td></tr></table>"
            }

            var supportingImagesText = ""
            if (typeof summary.images == "object" && typeof summary.images.length == "number" && summary.images.length > 0) {
                supportingImagesText = "<table id=\"SHORTNAME_table\" class=\"dvexpand table table-chrome\"><thead><tr><th class=\"expands\"><h2 style=\"line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\"); $(\"#SHORTNAME_table\").addClass(\"expanded\"); $(\"#SHORTNAME_table\").removeClass(\"table-chrome\");  $(\"#SHORTNAME_table\").find(\"th\").css(\"border-top\",\"1px solid darkgray\");  }else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\");  $(\"#SHORTNAME_table\").removeClass(\"expanded\");  $(\"#SHORTNAME_table\").addClass(\"table-chrome\"); } ; window.DoImageSubtitles(); return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2></th></tr></thead><tbody><tr><td style=\"display: none; border-top-width: 0;\" id=\"SHORTNAMESection\">"
                supportingImagesText = supportingImagesText.replace(/SHORTNAME/g, "supportingImages").replace("TITLE", "Screenshots")
                var images = ""
                for (var i = 0; i < summary.images.length; i++) {

                    images += "<img class=\"screenshot\" setwidth=\"650\" zoomin=\"true\" src=\"" + summary.images[i].path + "\" title=\"" + summary.images[i].label + "\" />"
                }
                supportingImagesText += images
                supportingImagesText += "</td></tr></table>"
            }

            var BookmarkStatus = "<h2 style=\"margin-bottom: 5px;\">Bookmark Status</h2><h3 style=\"margin-top: 0; margin-bottom: 15px;\"><a class=\"showcase_bookmark_status\" href=\"#\" onclick=\"popBookmarkOptions(this); return false;\">" + summary.bookmark_status_display + "</a></h3> "

            let name = summary.name;
            window.setbookmark_status = function(name, status, action) {

                if (!action) {
                    action = splunkjs.mvc.Components.getInstance("env").toJSON()['page']
                }
                require(["components/data/sendTelemetry"], function(Telemetry) {
                    Telemetry.SendTelemetryToSplunk("BookmarkChange", { "status": status, "name": name, "selectionType": action })
                })

                require(["splunkjs/mvc/utils", "splunkjs/mvc/searchmanager"], function(utils, SearchManager) {
                        new SearchManager({
                            "id": "logBookmarkChange-" + name.replace(/[^a-zA-Z0-9]/g, "_"),
                            "latest_time": "0",
                            "autostart": true,
                            "earliest_time": "now",
                            "search": '| makeresults | eval app="' + utils.getCurrentApp() + '", page="' + splunkjs.mvc.Components.getInstance("env").toJSON()['page'] + '", user="' + $C['USERNAME'] + '", name="' + name + '", status="' + status + '" | collect index=_internal sourcetype=essentials:bookmark',
                            "app": utils.getCurrentApp(),
                            "auto_cancel": 90
                        }, { tokens: false });
                    })
                    // THIS IS CUSTOMIZED FOR PROCESSSUMMARYUI.JS -- DO NOT USE ELSEWHERE! (It is missing the window.ShowcaseInfo update)

                var record = { _time: (new Date).getTime() / 1000, _key: name.replace(/[^a-zA-Z0-9]/g, ""), showcase_name: name, status: status, user: Splunk.util.getConfigValue("USERNAME") }
                    // console.log("Updating kvstore for", record)
                    // $.ajax({
                    //     url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                    //     type: 'POST',
                    //     contentType: "application/json",
                    //     async: true,
                    //     data: JSON.stringify(record),
                    //     success: function() {
                    //         console.log("Successfully updated", arguments)
                    //     },
                    //     error: function() {
                    //         console.log("failed to update updated", arguments)
                    //     }
                    // })


                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark/?query={"_key": "' + record['_key'] + '"}',
                    type: 'GET',
                    contentType: "application/json",
                    async: false,
                    success: function(returneddata) {
                        if (returneddata.length == 0) {
                            // New

                            $.ajax({
                                url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark/',
                                type: 'POST',
                                contentType: "application/json",
                                async: false,
                                data: JSON.stringify(record),
                                success: function(returneddata) { newkey = returneddata },
                                error: function(xhr, textStatus, error) {

                                }
                            })


                        } else {
                            // Old
                            $.ajax({
                                url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark/' + record['_key'],
                                type: 'POST',
                                contentType: "application/json",
                                async: false,
                                data: JSON.stringify(record),
                                success: function(returneddata) { newkey = returneddata },
                                error: function(xhr, textStatus, error) {
                                    //              console.log("Error Updating!", xhr, textStatus, error)
                                }
                            })
                        }
                    },
                    error: function(error, data, other) {
                        //     console.log("Error Code!", error, data, other)
                    }
                })
            }

            window.popBookmarkOptions = function(obj) {

                var boxHTML = $('<div id="box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "") + '" style="background-color: white; border: 1px gray solid; position: absolute; padding: 7px; left: 190px; top: 0px; width: 210px; height: 260px;"></div>').append('<i class="icon-close" onclick="$(this).parent().remove()" style="float: right;"></i>', "<h5 style=\"padding-top: 0px;padding-bottom: 5px; margin-top: 0px;\">Change Status</h5>")
                var unmarkBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><img src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" style="height: 18px" /></span> <a href="#" onclick="return false;">' + _("Clear Bookmark").t() + '</a></p>')
                unmarkBox.click(function() {
                    setbookmark_status(name, "none")
                        //$(obj).attr("class", "icon-bookmark")

                    $(obj).text("Not On List")
                        // obj.outerHTML = '<img src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var bookmarkedBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 24px;" class="icon-bookmark"></i></span> <a href="#" onclick="return false;">' + _("Bookmarked (no status)").t() + '</a></p>')
                bookmarkedBox.click(function() {
                    setbookmark_status(name, "bookmarked")
                        //$(obj).attr("class", "icon-circle")
                    $(obj).text("Bookmarked")
                        // obj.outerHTML = '<i class="icon-bookmark" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 24pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var needDataBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 20px;" class="icon-circle"></i></span> <a href="#" onclick="return false;">' + _("Waiting On Data").t() + '</a></p>')
                needDataBox.click(function() {
                    setbookmark_status(name, "needData")
                        //$(obj).attr("class", "icon-circle")

                    $(obj).text("Waiting On Data")
                        // obj.outerHTML = '<i class="icon-circle" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var inQueueBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 20px;" class="icon-calendar"></i></span> <a href="#" onclick="return false;">' + _("Ready for Deployment").t() + '</a></p>')
                inQueueBox.click(function() {
                    setbookmark_status(name, "inQueue")
                        //$(obj).attr("class", "icon-calendar")

                    $(obj).text("Ready for Deployment")
                        // obj.outerHTML = '<i class="icon-calendar" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var issuesDeployingBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 20px;" class="icon-alert-circle"></i></span> <a href="#" onclick="return false;">' + _("Deployment Issues").t() + '</a></p>')
                issuesDeployingBox.click(function() {
                    setbookmark_status(name, "issuesDeploying")
                        //$(obj).attr("class", "icon-alert-circle")

                    $(obj).text("Deployment Issues")
                        // obj.outerHTML = '<i class="icon-alert-circle" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var needTuningBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 20px;" class="icon-gear"></i></span> <a href="#" onclick="return false;">' + _("Needs Tuning").t() + '</a></p>')
                needTuningBox.click(function() {
                    setbookmark_status(name, "needsTuning")
                        //$(obj).attr("class", "icon-gear")
                    $(obj).text("Needs Tuning")
                        // obj.outerHTML = '<i class="icon-gear" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var successfullyImplementedBox = $('<p style="cursor: pointer"><span style="display: inline-block; text-align: center; width: 18px;"><i style="font-size: 20px;" class="icon-check"></i></span> <a href="#" onclick="return false;">' + _("Successfully Implemented").t() + '</a></div>')
                successfullyImplementedBox.click(function() {
                    setbookmark_status(name, "successfullyImplemented")
                        //$(obj).attr("class", "icon-check")
                    $(obj).text("Successfully Implemented")
                        // obj.outerHTML = '<i class="icon-check" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 16pt")
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 100px; color: darkgreen"></i>')
                        // $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                boxHTML.append(unmarkBox, bookmarkedBox, needDataBox, inQueueBox, issuesDeployingBox, needTuningBox, successfullyImplementedBox)
                var pos = $(obj).offset()
                var leftPos = pos.left + 10
                var topPos = pos.top + 20
                if (leftPos + 200 > $(window).width()) {
                    leftPos = leftPos - 195;
                    topPos = topPos + 20;
                }

                $(document).keyup(function(e) {

                    if (e.keyCode === 27)
                        if (document.getElementById('box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")) != null) {
                            $('#box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                        }

                });
                $(document).mouseup(function(e) {
                    var container = $('#box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, ""))

                    // if the target of the click isn't the container nor a descendant of the container
                    if (!container.is(e.target) && container.has(e.target).length === 0) {
                        container.remove();
                    }
                });
                $("body").append(boxHTML)
                $("#" + 'box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css({ top: topPos, left: leftPos })

            }

            var DataAvailabilityStatus = "<h2 style=\"margin-bottom: 5px;\"><span data-toggle=\"tooltip\" title=\"" + _("Data Availability is driven by the Data Inventory dashboard, and allows Splunk Security Essentials to provide recommendations for available content that fits your needs and uses your existing data.").t() + "\">" + _("Data Availability").t() + "</span> <a href=\"data_inventory\" target=\"_blank\" class=\"external drilldown-link\"></a></h2><h3 style=\"margin-top: 0; margin-bottom: 15px;\"><a href=\"#\" onclick=\"data_available_modal(); return false;\">" + summary.data_available + "</a></h3> "

            function data_available_modal() {

                require(['jquery', 'app/Splunk_Security_Essentials/components/controls/UnattachedModal',
                    'json!' + $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_eventtypes',
                    'json!' + $C['SPLUNKD_PATH'] + '/services/pullJSON?config=data_inventory&locale=' + window.localeString
                ], function($, Modal, data_inventory_eventtypes, data_inventory) {
                    let myModal = new Modal('data_sources', {
                        title: 'Dependent Data Sources',
                        destroyOnHide: true
                    });
                    let body = $("<div>");
                    let dscs = summary.data_source_categories.split("|");


                    body.append($("<p>").html(_('The data availability metric is driven by the configuration on the <a href="data_inventory" target="_blank" class="drilldown-link">Data Inventory</a> dashboard.').t()))

                    if (dscs.length > 1) {

                        body.append($("<p>").html(_('There are multiple potential data source categories for this example. The aggregate score is taken by averaging all of the following.').t()))

                    }

                    let table = $('<table class="table"><thead><tr><th>' + _("Data Source Category").t() + '</th><th>' + _("Completeness Percent").t() + ' (0-100)</th><th>Open</th></tr></thead><tbody></tbody></table>')

                    for (let i = 0; i < dscs.length; i++) {
                        let status = "?"
                        for (let g = 0; g < data_inventory_eventtypes.length; g++) {

                            if (data_inventory_eventtypes[g]['eventtypeId'] == dscs[i]) {
                                status = data_inventory_eventtypes[g]['status'] + "%"
                            }
                        }
                        let name = ""
                        for (let ds in data_inventory) {
                            for (let dsc in data_inventory[ds]['eventtypes']) {
                                if (dsc == dscs[i]) {
                                    name = data_inventory[ds]['eventtypes'][dsc]['name'];
                                }
                            }
                        }
                        table.find("tbody").append($("<tr><td>" + name + "</td><td>" + status + '</td><td><a href="data_inventory#id=' + dscs[i] + '" target="_blank" class="external drilldown-link"></a></td></tr>'))
                    }
                    body.append(table)

                    myModal.body.html(body)

                    myModal.footer.append($('<button>').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary').text('Close').on('click', function() {
                        // Not taking any action on Close
                    }))
                    myModal.show()
                })

            }
            window.data_available_modal = data_available_modal
            var Stage = "<h2 style=\"margin-bottom: 5px;\">Journey</h2><h3 style=\"margin-top: 0; margin-bottom: 15px;\"><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + summary.journey.replace(/Stage_/g, "") + "\">" + summary.journey.replace(/_/g, " ") + "</a></h3> "

            var datasourceText = ""
            if (typeof summary.datasources == "undefined" && summary.datasource != "undefined") {
                summary.datasources = summary.datasource
            }
            if (typeof summary.datasources != "undefined") {
                datasources = summary.datasources.split("|")
                if (datasources.length > 0 && datasourceText == "") {
                    datasourceText = "<h2>Data Sources</h2>"
                }
                for (var i = 0; i < datasources.length; i++) {
                    var link = datasources[i].replace(/[^\w\- ]/g, "")
                    var description = datasources[i]
                    datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + description + "</a></div>"
                }
                datasourceText += "<br/><br/>"
            }



            var mitreText = ""
            if (typeof summary.mitre != "undefined" && summary.mitre != "") {
                mitre = summary.mitre.split("|")
                if (mitre.length > 0 && mitreText == "") {
                    mitreText = "<h2 style=\"margin-bottom: 5px;\">" + _("MITRE ATT&CK Tactics").t() + " <a href=\"https://attack.mitre.org/wiki/Main_Page\" class=\"external drilldown-icon\" target=\"_blank\"></a></h2>"
                }
                for (var i = 0; i < mitre.length; i++) {
                    mitreText += "<div class=\"mitre\">" + mitre[i] + "</div>"
                }
                mitreText += "<br/><br/>"
            }

            var killchainText = ""
            if (typeof summary.killchain != "undefined" && summary.killchain != "") {
                killchain = summary.killchain.split("|")
                if (killchain.length > 0 && killchainText == "") {
                    killchainText = "<h2 style=\"margin-bottom: 5px;\">" + _("Kill Chain Phases").t() + " <a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\" class=\"external drilldown-icon\" target=\"_blank\"></a></h2>"
                }
                for (var i = 0; i < killchain.length; i++) {
                    killchainText += "<div class=\"killchain\">" + killchain[i] + "</div>"
                }
                killchainText += "<br/><br/>"
            }

            var cisText = ""
            if (typeof summary.cis != "undefined") {
                cis = summary.cis.split("|")
                for (var i = 0; i < cis.length; i++) {
                    cisText += "<div class=\"cis\">" + cis[i] + "</div>"
                }
                cisText += "<br/><br/>"
            }

            var technologyText = ""
            if (typeof summary.technology != "undefined") {
                technology = summary.technology.split("|")
                for (var i = 0; i < technology.length; i++) {
                    technologyText += "<div class=\"technology\">" + technology[i] + "</div>"
                }
                technologyText += "<br/><br/>"
            }
            var YouTubeText = ""
            if (typeof summary.youtube != "undefined") {
                YouTubeText = Template.replace(/SHORTNAME/g, "youtube").replace("TITLE", "Search Explanation - Video")
                YouTubeText += '<div class="auto-resizable-iframe"><div><iframe src="' + summary.youtube + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>'
                YouTubeText += "</div></div><br/><br/></td></tr></table>"
            }

            var box1 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 63%; min-width:585px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">' + usecaseText + areaText + relevance + alertVolumeText + SPLEaseText + '</div>'
            var box2 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 33%; min-width:305px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0">' + BookmarkStatus + DataAvailabilityStatus + Stage + mitreText + killchainText + cisText + technologyText + datasourceText + '</div>'

            description = panelStart + descriptionText + '<br/><div style=" display: table;">' + box1 + box2 + '</div><br/>' + gdprText + otherSplunkCapabilitiesText + howToImplementText + eli5Text + YouTubeText + knownFPText + operationalizeText + supportingImagesText + showSPLText + per_instance_help + panelEnd

            if (typeof $(".dashboard-header-description")[0] != "undefined") {
                $(".dashboard-header-description").parent().append($("<br/>" + description))
            } else {
                $(".dashboard-header .description").first().html(description)
            }
            $("#alertVolumetooltip").popover()
            $("[data-toggle=tooltip]").tooltip()
            $("#contentDescription").prepend('<div id="Tour" style="float: right" class="tour"><a class="external drilldown-link" style="color: white;" href="' + window.location.href + "&tour=" + showcaseName + "-tour" + '">' + _("Learn how to use this page").t() + '</a></div>')
            $("#contentDescription").prepend(exampleText)

            $("#fullSolution_table th.expands").find("a").click(function() { $(".contentstile").find("h3").each(function(a, b) { if ($(b).height() > 60) { $(b).text($(b).text().replace(/^(.{55}).*/, "$1...")) } }) })
            if (typeof summary.autoOpen != "undefined") {
                $("#" + summary.autoOpen + " th.expands").find("a").trigger("click")
            }
            if (gdprText != "") {
                $("#gdprtext_table th.expands").find("a").trigger("click")
            }
            var visualizations = [];

            if (typeof summary.visualizations != "undefined") {
                visualizations = summary.visualizations

            }

            if (typeof sampleSearch.visualizations != "undefined" && sampleSearch.visualizations.length > 0) {
                for (var i = 0; i < sampleSearch.visualizations.length; i++) {
                    if (typeof sampleSearch.visualizations[i].panel != "undefined") {
                        var shouldAppend = true;
                        for (var g = 0; g < visualizations.length; g++) {
                            if (sampleSearch.visualizations[i].panel == visualizations[g].panel) {
                                shouldAppend = false;
                                visualizations[g] = sampleSearch.visualizations[i];
                            }
                        }
                        if (shouldAppend) {
                            visualizations.push(sampleSearch.visualizations[i])
                        }
                    }
                }

            }
            //      console.log("Visualization Status", visualizations, sampleSearch, summary)
            if (visualizations.length > 0) {
                var triggerSubtitles = false
                for (var i = 0; i < visualizations.length; i++) {
                    // console.log("Analyzing panle", visualizations[i])
                    if (typeof visualizations[i].panel != "undefined" && typeof visualizations[i].type != "undefined" && (typeof visualizations[i].hideInSearchBuilder == "undefined" || visualizations[i].hideInSearchBuilder == false)) {
                        if (visualizations[i].type == "HTML" && typeof visualizations[i].html != "undefined") {
                            // console.log("Enabling panle", visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');
                            unsubmittedTokens.set(visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());

                            $("#" + visualizations[i].panel).html(visualizations[i].html)
                        } else if (visualizations[i].type == "image" && typeof visualizations[i].path != "undefined") {
                            // console.log("Enabling panle", visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');
                            unsubmittedTokens.set(visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());
                            var style = ""
                            if (typeof visualizations[i].style != "undefined")
                                style = "style=\"" + visualizations[i].style + "\""
                            var title = ""
                            if (typeof visualizations[i].title != "undefined")
                                title = "title=\"" + visualizations[i].title + "\""
                                // console.log("Her'es my panle title", title)
                            $("#" + visualizations[i].panel).html("<img class=\"screenshot\" " + style + " src=\"" + visualizations[i].path + "\" " + title + " />")
                            triggerSubtitles = true
                        } else if (visualizations[i].type == "viz") {
                            // console.log("Enabling panle", visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');
                            unsubmittedTokens.set(visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());
                            $("#" + visualizations[i].panel).html("<div id=\"element" + visualizations[i].panel + "\" />")
                            var SMConfig = {
                                "status_buckets": 0,
                                "cancelOnUnload": true,
                                "sample_ratio": null,
                                "app": "Splunk_Security_Essentials",
                                "auto_cancel": 90,
                                "preview": true,
                                "tokenDependencies": {},
                                "runWhenTimeIsUndefined": false
                            }
                            SMConfig.id = "search" + visualizations[i].panel
                            if (typeof visualizations[i].basesearch == "undefined") {
                                //              console.log("No Base Search Detected", visualizations[i])
                                SMConfig.search = visualizations[i].search
                            } else {
                                //              console.log("Woo! Base Search Detected", visualizations[i])
                                if (visualizations[i].search.match(/^\s*\|/)) {
                                    SMConfig.search = visualizations[i].basesearch + " " + visualizations[i].search
                                } else {
                                    SMConfig.search = visualizations[i].basesearch + "| " + visualizations[i].search
                                }
                            }

                            /*new SearchManager({
                                "id": "search8",
                                "latest_time": "now",
                                "status_buckets": 0,
                                "cancelOnUnload": true,
                                "earliest_time": "-24h@h",
                                "sample_ratio": null,
                                "search": "| makeresults count=15 | streamstats count",
                                "app": utils.getCurrentApp(),
                                "auto_cancel": 90,
                                "preview": true,
                                "tokenDependencies": {
                                },
                                "runWhenTimeIsUndefined": false
                            }, {tokens: true, tokenNamespace: "submitted"});*/
                            var VizConfig = visualizations[i].vizParameters
                            VizConfig.id = "element" + visualizations[i].panel
                            VizConfig.managerid = "search" + visualizations[i].panel
                            VizConfig.el = $("#element" + visualizations[i].panel)

                            // console.log("Got our panle SM Config", SMConfig)
                            // console.log("Got our panle Viz Config", VizConfig)
                            /*{
                                "id": "element2",
                                "charting.drilldown": "none",
                                "resizable": true,
                                "charting.chart": "area",
                                "managerid": "search2",
                                "el": $('#element2')
                            }*/
                            var SM = new SearchManager(SMConfig, { tokens: true, tokenNamespace: "submitted" });
                            // console.log("Got our panle SM", SM)
                            var Viz;
                            if (visualizations[i].vizType == "ChartElement") {
                                Viz = new ChartElement(VizConfig, { tokens: true, tokenNamespace: "submitted" }).render();
                            } else if (visualizations[i].vizType == "SingleElement") {
                                Viz = new SingleElement(VizConfig, { tokens: true, tokenNamespace: "submitted" }).render();
                            } else if (visualizations[i].vizType == "MapElement") {
                                Viz = new MapElement(VizConfig, { tokens: true, tokenNamespace: "submitted" }).render();
                            } else if (visualizations[i].vizType == "TableElement") {
                                Viz = new TableElement(VizConfig, { tokens: true, tokenNamespace: "submitted" }).render();
                            }
                            // console.log("Got our panle Viz", Viz)

                            SM.on("search:done", function(properties) {
                                //             console.log("search complete", properties.content.label)
                                var panelName = properties.content.label.replace(/search/, "")

                                // Instantiate the results link view
                                var resultsLink = new ResultsLinkView({
                                    id: "search" + panelName + "-resultsLink",
                                    managerid: "search" + panelName //,
                                        //el: $("#row1cell1").find(".panel-body")
                                });

                                // Display the results link view
                                resultsLink.render().$el.appendTo($("#" + panelName).find(".panel-body"));
                                $("#search" + panelName + "-resultsLink").addClass("resultLink")

                            })

                        }
                        if (typeof visualizations[i].title != "undefined" && visualizations[i].title != "") {
                            $("#element" + visualizations[i].panel).parent().prepend('<h2 class="panel-title">' + visualizations[i].title + '</h2>')
                        }




                    }
                }
                if (triggerSubtitles) {
                    DoImageSubtitles()
                }
            }
            $("#enableAdvancedSPL").click(function(event) {
                if (event.target.checked == true) {
                    localStorage['sse-splMode'] = "true"
                    $(".mlts-panel-footer").show()
                    $("#fieldset1").show()
                    $("#row11").show()
                } else {
                    localStorage['sse-splMode'] = "false"
                    $(".mlts-panel-footer").hide()
                    $("#fieldset1").hide()
                    $("#row11").hide()
                }
            })
            if (typeof localStorage["sse-splMode"] == "undefined" || localStorage["sse-splMode"] == "false") {
                // console.log("SPL Mode is off, hiding everything")
                $(".mlts-panel-footer").hide()
                $("#fieldset1").hide()
                $("#row11").hide()
            }
            $(".dashboard-header").css("margin-bottom", "0")

            //$("<a href=\"" + window.location.href + "&tour=" + showcaseName + "-tour\"><div id=\"Tour\" class=\"tourbtn\" style=\"float: right; margin-right: 15px; margin-top: 5px; \">Launch Tour</div></a>").insertAfter("#searchList")

        }
    };
});