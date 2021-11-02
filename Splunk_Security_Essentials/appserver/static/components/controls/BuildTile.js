'use strict';

define(['jquery', 'module', 'underscore'], function($, module, _) {
    var config = module.config();
    return {
        build_tile: function build_tile(showcaseSettings, forSearchBuilder, showcaseName) {
            if (typeof showcaseName == "undefined") {
                showcaseName = showcaseSettings.name.replace(/[\. ]/g, "_").replace(/[^\. \w]*/g, "")
            }

            // General normalizing of showcasesetting settings
            if (typeof showcaseSettings['journey'] == "undefined") {
                //console.log("Missing Journey for ", showcaseSettings)
                showcaseSettings['journey'] = "Stage_1" //JourneyAdjustment
            }
            if (typeof showcaseSettings['advancedtags'] == "undefined") {
                showcaseSettings['advancedtags'] = ""
            }
            if (typeof showcaseSettings['dashboard'] != "undefined" && showcaseSettings['dashboard'].indexOf("showcase_first_seen_demo") != -1 && showcaseSettings['advancedtags'].indexOf("Behavioral") == -1) {
                if (showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Behavioral|First Time Seen"
            }
            if (typeof showcaseSettings['dashboard'] != "undefined" && showcaseSettings['dashboard'].indexOf("showcase_standard_deviation") != -1 && showcaseSettings['advancedtags'].indexOf("Behavioral") == -1) {
                if (showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Behavioral|Time Series"
            }
            if (typeof showcaseSettings['app'] != "undefined" && (showcaseSettings['app'] == "Splunk_User_Behavior_Analytics" || showcaseSettings['app'] == "Splunk_App_for_Enterprise_Security" || showcaseSettings['app'] == "Enterprise_Security_Content_Update")) {
                if (showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Premium App"
            }
            if (typeof showcaseSettings['app'] != "undefined" && showcaseSettings['app'] == "Splunk_Professional_Services_Catalog") {
                if (showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Implemented by Services"
            }
            if (typeof showcaseSettings['SPLEase'] != "undefined" && showcaseSettings['SPLEase'].indexOf("dvanced") != -1) {
                if (showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Advanced SPL"
            }
            if (showcaseSettings['advancedtags'] == "") {
                showcaseSettings['advancedtags'] = "N/A"
            }
            /*Add Machine Learning, once the MLTK use cases are in. if(typeof showcaseSettings['app'] != "undefined" && (showcaseSettings['app'] == "Splunk_User_Behavior_Analytics" || showcaseSettings['app'] == "Splunk_App_for_Enterprise_Security" || showcaseSettings['app'] == "Enterprise_Security_Content_Update") ){
                if(showcaseSettings['advancedtags'] != "")
                    showcaseSettings['advancedtags'] += "|"
                showcaseSettings['advancedtags'] += "Behavioral"
            }*/

            if (typeof showcaseSettings.highlight == "undefined" || showcaseSettings.highlight == null)
                showcaseSettings.highlight = "No"
            exampleList = '';
            exampleText = '';
            var datasourceText = ""
            if (typeof showcaseSettings.datasources == "undefined" && showcaseSettings.datasource != "undefined") {
                showcaseSettings.datasources = showcaseSettings.datasource
            }
            if (typeof showcaseSettings.datasources != "undefined" && showcaseSettings.datasource != "Other") {

                if (typeof showcaseSettings.datasources == "undefined" || showcaseSettings.datasources == null) {
                    //console.log("WARNING WARNING! This showcase has no datasources defined.", showcaseSettings)
                } else {
                    datasources = showcaseSettings.datasources.split("|")
                    datasourceText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                    for (var i = 0; i < datasources.length; i++) {
                        var link = datasources[i].replace(/[^\w\- ]/g, "").replace(/ /g, "%20")
                        var description = datasources[i]

                        datasourceText += "<div title=\"\"  class=\"contentstooltipcontainer datasourceElements\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + description + "</a><span class=\"contentstooltiptext\">Blue Bubbles indicate the data source used by this example.</span></div>" //StyleChange
                    }
                    datasourceText += "</div>"
                }
            }
            var forSearchBuilderText = ""

            if (typeof forSearchBuilder != "undefined" && forSearchBuilder == true) {
                forSearchBuilderText += "<h3><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + showcaseSettings.journey.replace(/Stage_/g, "") + "\">" + showcaseSettings.journey.replace(/_/g, " ") + "</a></h3> "
                if (typeof showcaseSettings.usecase != "undefined") {
                    var usecase = showcaseSettings.usecase.split("|")
                    forSearchBuilderText += "<h3>" + usecase.join(", ") + "</h3> "
                }
                if (typeof showcaseSettings.category != "undefined") {
                    var categories = showcaseSettings.category.split("|")
                    var finalCategories = []
                    for (var i = 0; i < categories.length; i++) {
                        if (forSearchBuilderText.indexOf(categories[i]) == -1)
                            finalCategories.push(categories[i])
                    }
                    if (finalCategories.length > 0)
                        forSearchBuilderText += "<h3>" + finalCategories.join(", ") + "</h3> "
                }

            }




            var highlightText = ""
            if (showcaseSettings.highlight == "Yes" && showcaseSettings.highlight != "") {
                highlightText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                highlightText += "<div class=\"contentstooltipcontainer highlightElements\">" + _("Featured").t() + "<span class=\"contentstooltiptext\">" + _("This search is highly recommended by Splunk's Security SMEs.").t() + "</span></div>" //StyleChange
                highlightText += "</div>"
            }



            var mitreText = ""
            if (typeof showcaseSettings.mitre_tactic_display != "undefined" && showcaseSettings.mitre_tactic_display != "" && showcaseSettings.mitre_tactic_display != "None") {
                mitreText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                mitre = showcaseSettings.mitre_tactic_display.split("|")
                for (var i = 0; i < mitre.length; i++) {
                    if (mitre[i] != "Other") {
                        mitreText += "<div class=\"contentstooltipcontainer mitre_tactic_displayElements\">" + mitre[i] + "<span class=\"contentstooltiptext\">" + _("Red Bubbles indicate the MITRE ATT&CK Tactics detected by this example.").t() + "< /span></div > " //StyleChange
                    }
                }
                mitreText += "</div>"
            }

            var mitreTechniqueText = ""
            if (typeof showcaseSettings.mitre_technique_display != "undefined" && showcaseSettings.mitre_technique_display != "" && showcaseSettings.mitre_technique_display != "None") {
                mitreTechniqueText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                mitre = showcaseSettings.mitre_technique_display.split("|")
                for (var i = 0; i < mitre.length; i++) {
                    if (mitre[i] != "Other") {
                        mitreTechniqueText += "<div class=\"contentstooltipcontainer mitre_technique_displayElements\">" + mitre[i] + "<span class=\"contentstooltiptext\">" + _("Purple Bubbles indicate the MITRE ATT&CK Techniques detected by this example.").t() + "< /span></div > " //StyleChange
                    }
                }
                mitreTechniqueText += "</div>"
            }

            var killchainText = ""
            if (typeof showcaseSettings.killchain != "undefined" && showcaseSettings.killchain != "" && showcaseSettings.killchain != "None") {
                killchainText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                killchain = showcaseSettings.killchain.split("|")
                for (var i = 0; i < killchain.length; i++) {
                    if (killchain[i] != "Other") {
                        killchainText += "<div  class=\"contentstooltipcontainer killchainElements\">" + killchain[i] + "<span class=\"contentstooltiptext\">" + _("Green Bubbles indicate the Lockheed Martin Kill Chain Phases detected by this example.").t() + "</span></div>" //StyleChange
                    }
                }
                killchainText += "</div>"
            }

            var cisText = ""
            if (typeof showcaseSettings.cis != "undefined") {
                cis = showcaseSettings.cis.split("|")
                for (var i = 0; i < cis.length; i++) {
                    if (cis[i] != "Other") {
                        cisText += "<div class=\"cis\">" + cis[i] + "</div>" //StyleChange
                    }
                }
            }

            var technologyText = ""
            if (typeof showcaseSettings.technology != "undefined") {
                technologyText = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' //StyleChange
                technology = showcaseSettings.technology.split("|")
                for (var i = 0; i < technology.length; i++) {
                    if (technology[i] != "Other") {
                        technologyText += "<div class=\"technology\">" + technology[i] + "</div>"
                    }
                }
                technologyText += "</div>"
            }


            //var bookmarkIcon = '<i class="icon-bookmark" '
            //console.log("Incoming..", showcaseSettings.name, showcaseSettings.bookmark_status)

            var bookmarkWidget = ""
            let enabledWidget = ""


            if (typeof forSearchBuilder == "undefined" || forSearchBuilder != true) {

                if (typeof showcaseSettings.bookmark_status != "undefined") {
                    switch (showcaseSettings.bookmark_status) {
                        case "none":
                            bookmarkWidget = '<img class="bookmarkIcon" title="' + _("Bookmark this content to look up later").t() + '" data-showcase="' + showcaseSettings.name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' />'
                            enabledWidget = $('<img class="enabledIcon" title="' + _('Mark that the content is already enabled').t() + '" onclick="markContentEnabled(this);" data-showcase="' + showcaseSettings.name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/notenabled.png') + '"  />')
                            break;
                        case "bookmarked":
                            bookmarkWidget = '<i class="icon-bookmark" data-showcase="' + showcaseSettings.name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;
                        case "needData":
                            bookmarkWidget = '<i class="icon-bookmark" data-showcase="' + showcaseSettings.name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;
                        case "inQueue":
                            bookmarkWidget = '<i class="icon-bookmark" data-showcase="' + showcaseSettings.name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;
                        case "needTuning":
                            bookmarkWidget = '<i class="icon-bookmark" data-showcase="' + showcaseSettings.name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;
                        case "issuesDeploying":
                            bookmarkWidget = '<i class="icon-bookmark" data-showcase="' + showcaseSettings.name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;
                        case "successfullyImplemented":
                            bookmarkWidget = '<i class="icon-check" data-showcase="' + showcaseSettings.name + '" title="Implemented" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                            break;

                    }
                } else {
                    bookmarkWidget = '<img class="bookmarkIcon" title="' + _("Bookmark this content to look up later").t() + '" data-showcase="' + showcaseSettings.name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' />'
                    enabledWidget = $('<img class="enabledIcon" title="' + _('Mark that the content is already enabled').t() + '" onclick="markContentEnabled(this);" data-showcase="' + showcaseSettings.name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/notenabled.png') + '" />')

                }

                //bookmarkWidget = bookmarkIcon + ' title="' + bookmarkTitle + '" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; ' + bookmarkIconSize + ';" />'
                window.markContentEnabled = function(obj) {

                    let target = $(obj)
                    let name = target.attr("data-showcase")
                        // console.log("Marking conte")
                    if (target.attr("title") == _('Mark that the content is already enabled').t()) {
                        setbookmark_status(name, "successfullyImplemented")
                        target.closest(".bookmarkIcons").html('<i class="icon-check" data-showcase="' + name + '" title="Implemented" onclick=\'createWishlistBox(this, "' + name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />')

                    }
                }
                window.createWishlistBox = function(obj, name) {
                    // console.log("Running with", obj, name, obj.outerHTML)

                    if ($(obj).is("img")) {
                        //obj.outerHTML = '<i class="icon-bookmark" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 24pt")
                        //obj.outerHTML = '<i class="icon-bookmark" data-showcase="' + name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />'
                        let container = $(obj).closest(".bookmarkIcons")
                        container.html('<i class="icon-bookmark" data-showcase="' + name + '" title="Bookmarked" onclick=\'createWishlistBox(this, "' + name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt; font-size: 24pt;" />')
                            //container.append(bookmarkWidget, enabledWidget)
                        setbookmark_status(name, "bookmarked")
                    } else {
                        //obj.outerHTML = '<img class="bookmarkIcon" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" ' + obj.outerHTML.replace(/^<.*?title/, "title").replace(/font-size: \d*pt/, "font-size: 20pt")
                        //obj.outerHTML = '<img class="bookmarkIcon" data-showcase="' + name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" onclick=\'createWishlistBox(this, "' + name + '"); return false;\' style="position: absolute; top: 5px; right: 0px; height: 16pt;" />'
                        let name = $(obj).attr("data-showcase")
                        let bookmarkWidget = $('<img class="bookmarkIcon" title="' + _("Bookmark this content to look up later").t() + '" data-showcase="' + name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/nobookmark.png') + '" onclick=\'createWishlistBox(this, "' + showcaseSettings.name + '"); return false;\' />')
                        let enabledWidget = $('<img class="enabledIcon" title="' + _('Mark that the content is already enabled').t() + '" onclick="markContentEnabled(this);" data-showcase="' + name + '" src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/notenabled.png') + '" />')
                        let container = $(obj).closest(".bookmarkIcons")
                        container.html("")
                        container.append(bookmarkWidget, enabledWidget)
                        setbookmark_status(name, "none")

                    }

                }
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
                    for (var i = 0; i < window.ShowcaseInfo.roles.default.summaries; i++) {
                        if (name == window.ShowcaseInfo.summaries[window.ShowcaseInfo.roles.default.summaries[i]]) {
                            window.ShowcaseInfo.summaries[window.ShowcaseInfo.roles.default.summaries[i]].bookmark_status = status
                        }
                    }

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
            }
            var includeSearchAvailable = ""
            if (showcaseSettings.hasSearch.toLowerCase() == "yes") {
                includeSearchAvailable = "<div class=\"splAvailableText\">" + _("Searches Included ").t() + "</div>"
            } else if (showcaseSettings.app == "Splunk_App_for_Enterprise_Security") {
                includeSearchAvailable = "<div class=\"grayAppButton\">" + _("Try Splunk ES ").t() + "</div>"
            } else if (showcaseSettings.app == "Enterprise_Security_Content_Update") {
                includeSearchAvailable = "<div class=\"grayAppButton\">" + _("Try ES Content Update ").t() + "</div>"
            } else if (showcaseSettings.app == "Splunk_User_Behavior_Analytics") {
                includeSearchAvailable = "<div class=\"grayAppButton\">" + _("Try Splunk UBA ").t() + "</div>"
            } else if (showcaseSettings.app == "Splunk_Professional_Services") {
                includeSearchAvailable = "<div class=\"grayAppButton\">" + _("Use Splunk PS ").t() + "</div>"
            }
            if (includeSearchAvailable != "") {
                includeSearchAvailable = '<div style="width: 230px; display: block; clear: both;"  style="padding-top: 10px;">' + includeSearchAvailable + "</div>"
            }


            tagText = highlightText + includeSearchAvailable + datasourceText + mitreText + mitreTechniqueText + killchainText + cisText + technologyText
            if (tagText != "") {
                tagText = "<div style=\"padding-top: 5px;\">" + tagText + "</div>"
            }


            var wrapperLink = $('<a></a>').attr('href', showcaseSettings.dashboard);
            if (showcaseSettings.dashboard == "ES_Use_Case" || showcaseSettings.dashboard == "UBA_Use_Case" || showcaseSettings.dashboard == "ESCU_Use_Case" || showcaseSettings.dashboard == "PS_Use_Case")
                wrapperLink = $('<a></a>').attr('href', showcaseSettings.dashboard + "?form.needed=stage" + showcaseSettings.journey.split("|")[0].replace("Stage_", "") + "&showcase=" + showcaseSettings.name);
            else if (showcaseSettings.hasSearch.toLowerCase() != "yes" && showcaseSettings.dashboard.indexOf("?") == -1 && showcaseSettings.dashboardOverride != "true")
                wrapperLink = $('<span></span>')
            var showcaseImageDefault = showcaseSettings.dashboard
            if (showcaseSettings.dashboard.indexOf("?") > 0) {
                showcaseImageDefault = showcaseSettings.dashboard.substr(0, showcaseSettings.dashboard.indexOf("?"))
            }

            var showcaseImage = showcaseSettings.image != null ? showcaseSettings.image : showcaseImageDefault + '.png';
            var myElement = ""

            var DescriptionText = showcaseSettings.description.replace(/<p><b>Alert.*/, "")
            if (DescriptionText.indexOf("<p>") == -1)
                DescriptionText = "<p style=\"width: 210px;\">" + DescriptionText + "</p>" //StyleChange
            else
                DescriptionText = DescriptionText.replace("<p>", "<p style=\"width: 220px;\">") //StyleChange
            DescriptionText = forSearchBuilderText + DescriptionText
            var highlightclass = ""
            if (typeof showcaseSettings.icon == "undefined")
                showcaseSettings.icon = SplunkUtil.make_url('/static/app/' + showcaseSettings.app + '/images/content_thumbnails/' + showcaseImage)
            else if (showcaseSettings.icon.indexOf("/static/") == -1)
                showcaseSettings.icon = Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/images/content_thumbnails/" + showcaseSettings.icon)
            if (typeof showcaseSettings.highlight != "undefined" && showcaseSettings.highlight == "Yes")
                highlightclass = " class=\"highlight\""

            var listyle = "width: 230px; height: 260px;"
            let h3Name = showcaseSettings.name;
            if (h3Name.length > 56) {
                h3Name = h3Name.substr(0, 50) + "..."
            }
            if (forSearchBuilder == true)
                listyle = "width: 230px; height: 320px;"
            myElement = $('<li class="showcaseItemTile" id="' + showcaseName + '" style="' + listyle + '"></li>').append($("<div class=\"contentstile\"></div>").append(
                $("<div style=\"display: block; width: 230px; position: relative; \"></div>").append($('<div class="bookmarkIcons">').append($(bookmarkWidget), enabledWidget), wrapperLink.clone().append(
                        $('<img style="position: absolute; top:3px; left: 3px; height: 30px; width: 30px;" class="showcase-list-item-image" />').attr('src', showcaseSettings.icon)),
                    $('<div  style="position: absolute; top:3px; left: 40px; display: inline-block; height: 40px;  width: 155px;"  class="showcase-list-item-title"></div>').append(
                        wrapperLink.clone().append(
                            '  <h3>' + h3Name + '</h3>'
                        )
                    )
                ),
                $('<div style="width: 230px; margin-top: 53px; " class="showcase-list-item-content"></div>').append(DescriptionText, exampleText, exampleList)
            ))

            myElement.append(tagText)
                //     console.log("Got an HTML for ", showcaseSettings, myElement.html())
            if (forSearchBuilder == true)
                return myElement.html()
            else
                return myElement

            //window.ShowcaseInfo.summaries[ListOfShowcases[i]]['HTML'] = myElement

            //return "<div class=\"relatedUseCase\"><a href=\"" + summary.dashboard +"\">" + summary.name + "</a></div>"
        }
    };
});