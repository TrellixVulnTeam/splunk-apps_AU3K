'use strict';

window.appName = "Splunk_Security_Essentials"
require(['jquery',
    "underscore",
    "splunk.util",
    "splunkjs/mvc/utils",
    "splunkjs/mvc/tokenutils",
    "splunkjs/mvc/simpleform/formutils",
    'splunkjs/mvc/simplexml/controller',
    'splunkjs/mvc/dropdownview',
    "splunkjs/mvc/simpleform/input/dropdown",
    'splunk.util',
    'components/data/parameters/RoleStorage',
    'Options',
    'app/Splunk_Security_Essentials/components/controls/Modal',
    "splunkjs/mvc/searchmanager",
    'json!' + $C['SPLUNKD_PATH'] + '/services/SSEShowcaseInfo?locale=' + window.localeString,
    'json!' + $C['SPLUNKD_PATH'] + '/services/pullJSON?config=data_inventory&locale=' + window.localeString,
    'json!' + $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_products',
    'json!' + $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_eventtypes',
    'bootstrap.popover'
], function($,
    _,
    splunkUtil,
    utils,
    tokenutils,
    FormUtils,
    DashboardController,
    DropdownView,
    DropdownInput,
    SplunkUtil,
    RoleStorage,
    Options,
    Modal,
    SearchManager,
    ShowcaseInfo,
    data_inventory,
    data_inventory_products,
    data_inventory_eventtypes) {
    eventtype_to_label = {};
    for (let i = 0; i < data_inventory_eventtypes.length; i++) {
        if (data_inventory_eventtypes[i]['status'] && data_inventory_eventtypes[i]['status'] != "" && isNaN(data_inventory_eventtypes[i]['status'])) {
            let eventtypeId = data_inventory_eventtypes[i]['eventtypeId']
            let datasourceId = eventtypeId.replace(/\-.*/, "")

            switch (data_inventory_eventtypes[i]['status'].toLowerCase()) {
                case "good":
                    data_inventory_eventtypes[i]['status'] = 100;
                    updateEventtypeOnServer(datasourceId, eventtypeId, 100, "")
                    break;
                case "mixed":
                    data_inventory_eventtypes[i]['status'] = 30;
                    updateEventtypeOnServer(datasourceId, eventtypeId, 30, "")
                    break;

                case "bad":
                    data_inventory_eventtypes[i]['status'] = 0;
                    updateEventtypeOnServer(datasourceId, eventtypeId, 0, "")
                    break;

            }
        }
    }
    var haveRunSearches = false
    var CalculateDependencies = function() {
        let datasourceStatus = [];
        for (let i = 0; i < data_inventory_eventtypes.length; i++) {
            if (data_inventory_eventtypes[i]['status'] && data_inventory_eventtypes[i]['status'] != "" && !isNaN(data_inventory_eventtypes[i]['status'])) {
                datasourceStatus.push(data_inventory_eventtypes[i]['status'])
            } else {
                datasourceStatus.push(0)
            }
        }
        $("#" + datasourceId + " .ds_status div").html(buildStatusIcon(summarizeStatus(datasourceStatus, false)))
            // for (var datasourceId in data_inventory) {
            //     var datasource = data_inventory[datasourceId]
            //     var datasourceStatus;
            //     var datasourceStatus = { "good": 0, "bad": 0, "mixed": 0, "inqueue": 0, "unknown": 0 };
            //     for (var eventtypeId in datasource.eventtypes) {
            //         var eventtype = datasource.eventtypes[eventtypeId]
            //         var eventtypeStatus = { "good": 0, "bad": 0, "mixed": 0, "inqueue": 0, "unknown": 0 };

        //         var searchStrings = []
        //         for (var productId in eventtype.products) {
        //             var product = eventtype.products[productId]

        //             if (typeof product.status == "undefined") {
        //                 eventtypeStatus["unknown"]++
        //             } else {
        //                 eventtypeStatus[product.status]++;
        //             }
        //             if (product.status == "good") { // TODO This needs to be updated to account for the select option
        //                 searchStrings.push(product.basesearch)
        //             }
        //         }
        //         var eventtypeResultStatus = summarizeStatus(eventtypeStatus, true)

        //         $("#" + eventtypeId + " .et_status").html(buildStatusIcon(eventtypeResultStatus))
        //         datasourceStatus[eventtypeResultStatus]++
        //             var searchString = ""
        //         if (searchStrings.length > 1) {
        //             searchString = "( (" + searchStrings.join(") OR ( ") + ") )"
        //         } else if (searchStrings.length == 1) {
        //             searchString = searchStrings[0]
        //         }
        //         if (eventtypeResultStatus != "inqueue" && haveRunSearches == true) {
        //             updateEventtypeOnServer(datasourceId, eventtypeId, eventtypeResultStatus, searchString)
        //         }
        //     }

        //     $("#" + datasourceId + " .ds_status div").html(buildStatusIcon(summarizeStatus(datasourceStatus, false)))
        // }
    }

    // console.log("Hey, I have a good showcase...", ShowcaseInfo, data_inventory, data_inventory_products)
    window.data_inventory = data_inventory
    window.data_inventory_eventtypes = data_inventory_eventtypes
        // for(var i = 0; i < data_inventory_products.length; i++){
        //     if(typeof data_inventory_products[i].status != "undefined" && data_inventory_products[i].status != ""){
        //         data_inventory[ data_inventory_products[i].datasourceId ].eventtypes[ data_inventory_products[i].eventtypeId ].products[ data_inventory_products[i].productId ].status = data_inventory_products[i].status
        //         data_inventory[ data_inventory_products[i].datasourceId ].eventtypes[ data_inventory_products[i].eventtypeId ].products[ data_inventory_products[i].productId ].status_overridden = true
        //     }
        //     if(typeof data_inventory_products[i].basesearch != "undefined" && data_inventory_products[i].basesearch != ""){
        //         data_inventory[ data_inventory_products[i].datasourceId ].eventtypes[ data_inventory_products[i].eventtypeId ].products[ data_inventory_products[i].productId ].basesearch = data_inventory_products[i].basesearch
        //         data_inventory[ data_inventory_products[i].datasourceId ].eventtypes[ data_inventory_products[i].eventtypeId ].products[ data_inventory_products[i].productId ].basesearch_overridden = true
        //     }
        //     data_inventory[ data_inventory_products[i].datasourceId ].eventtypes[ data_inventory_products[i].eventtypeId ].products[ data_inventory_products[i].productId ].kvstore_exists = true
        // }
        // for(var i = 0; i < data_inventory_eventtypes.length; i++){
        //     if(typeof data_inventory_eventtypes[i].basesearch != "undefined" && data_inventory_eventtypes[i].basesearch != ""){
        //         data_inventory[ data_inventory_eventtypes[i].datasourceId ].eventtypes[ data_inventory_eventtypes[i].eventtypeId ].basesearch = data_inventory_eventtypes[i].basesearch
        //         data_inventory[ data_inventory_eventtypes[i].datasourceId ].eventtypes[ data_inventory_eventtypes[i].eventtypeId ].basesearch_overridden = true
        //     }
        //     data_inventory[ data_inventory_eventtypes[i].datasourceId ].eventtypes[ data_inventory_eventtypes[i].eventtypeId ].kvstore_exists = true
        // }

    var counterForRecalculatingTimer = 0;
    var output = $("<div class=\"main_output\"></div>")
    var datasource_left = $('<div class="ds_datasource_panel"></div>')
    var datasource_right = $('<div class="ds_datasource_panel"></div>')
    var count = 0;
    let eventTypeCount = 0;


    let showcasesPerEventtype = {}

    for (let ShowcaseName in ShowcaseInfo['summaries']) {
        // console.log("Got a showcase", ShowcaseName, ShowcaseInfo['summaries'][ShowcaseName]['data_source_categories'])
        if (typeof ShowcaseInfo['summaries'][ShowcaseName]['data_source_categories'] != "undefined") {
            let eventtypes = ShowcaseInfo['summaries'][ShowcaseName]['data_source_categories'].split("|")
            for (let i = 0; i < eventtypes.length; i++) {
                let eventtype = eventtypes[i];
                if (typeof showcasesPerEventtype[eventtype] == "undefined") {
                    showcasesPerEventtype[eventtype] = 1;
                } else {
                    showcasesPerEventtype[eventtype]++;
                }

            }
        }
    }
    // console.log("Got my showcases per eventtype", showcasesPerEventtype)
    for (var datasourceId in data_inventory) {
        let isDataSourceInScope = false;
        for (var eventtypeId in data_inventory[datasourceId].eventtypes) {
            eventtype_to_label[eventtypeId] = data_inventory[datasourceId].eventtypes[eventtypeId]['name']
            if (typeof showcasesPerEventtype[eventtypeId] != "undefined") {
                eventTypeCount++
                isDataSourceInScope = true;
            }


            for (let i = 0; i < data_inventory_eventtypes.length; i++) {
                if (data_inventory_eventtypes[i].eventtypeId == eventtypeId) {
                    data_inventory[datasourceId].eventtypes[eventtypeId].status = data_inventory_eventtypes[i].status
                        // console.log("Just set", data_inventory_eventtypes[i].status, eventtypeId, data_inventory[datasourceId].eventtypes[eventtypeId])
                }
            }
        }
        if (isDataSourceInScope) {
            eventTypeCount += 1.5;
        }
    }

    // console.log("Eventtype Count", eventTypeCount)
    // console.log("Data Foundation", data_inventory)
    let keys = Object.keys(data_inventory).sort();
    for (let i = 0; i < keys.length; i++) {
        let datasourceId = keys[i];
        let datasource = data_inventory[datasourceId]
        let datasourceDiv = $("<div class=\"datasource_main\">").click(function(evt) {
            let target = $(evt.target);

            let container = target.closest(".datasource_main");
            if (container.find(".ds_datasource_active").length == 0) {
                $(".ds_datasource").hide()
                $(".ds_datasource_active").removeClass("ds_datasource_active")
                container.find(".ds_datasource").show()
                container.find(".ds_datasource").first().addClass("ds_datasource_active")
                switchMain(container.find(".ds_datasource").attr("id"))

            }

        })
        count += 1.5;
        datasourceDiv.append($("<h2></h2>").text(datasource.name))
        let someEventtypeInScope = false;

        let localKeys = Object.keys(datasource.eventtypes).sort();
        for (let i = 0; i < localKeys.length; i++) {
            let eventtypeId = localKeys[i];
            if (typeof showcasesPerEventtype[eventtypeId] == "undefined") {
                continue;
            }
            someEventtypeInScope = true;
            count += 1;
            let eventtype = datasource.eventtypes[eventtypeId]


            // console.log("Analyzing Eventtype " + eventtypeId, eventtype, Object.keys(datasource.eventtypes[eventtypeId]).join(", "), buildStatusIcon(eventtype.status))


            //let datasource = data_inventory[datasourceId]
            let ds_output = $('<div id="' + eventtypeId + '" class="ds_datasource" status="' + (eventtype.status || "unknown") + '">')
            let statusText = $('<div style="position: relative;">').html(buildStatusIcon(eventtype.status))

            ds_output.append($('<div class="ds_status">').append(statusText))
            let ds_mainBlock = $('<div class="ds_main">')
            let ds_header = $('<div class="ds_header">')
            ds_header.append($("<h3>").text(eventtype.name))

            ds_mainBlock.append(ds_header)


            ds_output.append(ds_mainBlock)

            ds_output.click(function(obj) {
                window.dvtest = obj

                $(".ds_datasource").removeClass("ds_datasource_active")

                $(obj.target).closest(".ds_datasource").addClass("ds_datasource_active")
                let id = $(obj.target).closest(".ds_datasource").attr("id")
                    // console.log("Got a click on", id)
                switchMain(id)

            })
            datasourceDiv.append(ds_output)
        }
        //output.append(ds_output)
        if (someEventtypeInScope) {
            // if (count <= (eventTypeCount + 1) / 2) {
            datasourceDiv.addClass("ds_datasource_left")
            datasource_left.append(datasourceDiv)
                // } else {
                //     datasourceDiv.addClass("ds_datasource_right")
                //     datasource_right.append(datasourceDiv)
                // }
        }
    }
    datasource_left.css("float", "left")
    datasource_right.css("float", "right")
    output.append(datasource_left, datasource_right, $('<div class="ds_main_panel"><h2>' + _("Data Inventory").t() + '</h2><p>' + _('The goal of this dashboard is to understand what data you have and to provide a foundational set of dashboards that guide you to valuable content. Furthermore, we want to provide a prescriptive view to what content will add value to your security operations.</p><p>On this page, we will walk you through a variety of data types used by the content in Splunk and ask you to indicate whether you have the data or not. The entire exercise should take 10-15 minutes, and you can always come back to answer questions later.</p> <p>We hope to automate as much of the data inventory process as possible. (We don\'t like filling out forms either!) Currently, we have approximately half of the introspection automated via the Data Source Check dashboard (excluding data sources used only by Splunk premium solutions), but we have near term plans to enhance this Data Inventory dashboard with extensive introspection capabilities. So, you might save yourself some time (and paperwork) by <a href="data_source_check">running the checks there</a>, or you can stay here and walk through the data inventory manually.').t() + '</p> <button class="btn btn-primary get-started">' + _("Ready to get started?").t() + '</button></div>'));



    $("#foundation_container").append(output)
    $("button.get-started").click(function() { $(".datasource_main").first().click() })
    CalculateDependencies()
    $("#startSearchesButton").click(function() {
        startAllSearches()
    })
    setTimeout(function() {
        let allDS = $(".datasource_main")
        for (let i = 0; i < allDS.length; i++) {
            updateDatasourceMainLabel($(allDS[i]))
        }
    }, 500)


    // Enable drilldown link to set specific filters
    if (window.location.hash && window.location.hash.substr(1)) {

        // courtesy of https://stackoverflow.com/questions/5646851/split-and-parse-window-location-hash
        var hash = window.location.hash.substring(1);
        var params = {}
        hash.split('&').map(hk => {
            let temp = hk.split('=');
            params[temp[0]] = temp[1]
        });
        for (let key in params) {
            if (key == "id") {
                let target = $("#" + params[key]);
                if (target.length > 0) {
                    let container = target.closest(".datasource_main");
                    container.click();
                    target.click();
                }
            }
        }
        window.location.hash = ""
    }


    if (data_inventory_eventtypes.length == 0) {
        ModalSuggestingDataSourceCheck();
    }

    function updateDatasourceMainLabel(target) {
        setTimeout(function() {
            let totalDS = target.find(".ds_datasource").length;
            let completeDS = target.find("i[class=icon-check]").length + target.find("i[class=icon-warning]").length + target.find("i[class=icon-error]").length
            if (totalDS == completeDS) {
                target.find("h2").text(target.find("h2").text().replace(/ \(\d.*/, "") + " (" + totalDS + ")")
            } else {
                target.find("h2").text(target.find("h2").text().replace(/ \(\d.*/, "") + " (" + completeDS + "/" + totalDS + ")")
            }
        }, 100)

    }
    window.updateDatasourceMainLabel = updateDatasourceMainLabel

    function switchMain(id) {

        for (let datasourceId in data_inventory) {

            for (let eventtypeId in data_inventory[datasourceId].eventtypes) {
                if (eventtypeId == id) {
                    let eventtype = data_inventory[datasourceId].eventtypes[eventtypeId]

                    $(".ds_main_panel").html("")
                    $(".ds_main_panel").append($("<h2>").text(data_inventory[datasourceId].name), $("<p>").html(data_inventory[datasourceId].description))

                    $(".ds_main_panel").append($("<h2>").text(eventtype.name))
                    $(".ds_main_panel").append($("<p>").text(eventtype.description))

                    let recommendedSearchNames = []
                    let otherSearchNames = []
                    let nameToID = []
                    let finalSearchNames = []
                    for (let summaryName in ShowcaseInfo['summaries']) {
                        if (ShowcaseInfo['summaries'][summaryName]['data_source_categories'] && ShowcaseInfo['summaries'][summaryName]['data_source_categories'].split("|").indexOf(id) >= 0) {
                            // console.log("Found content for", id, summaryName)
                            nameToID[ShowcaseInfo['summaries'][summaryName]['name']] = summaryName;
                            if (ShowcaseInfo['summaries'][summaryName]['highlight'].toLowerCase() == "yes") {
                                recommendedSearchNames.push(ShowcaseInfo['summaries'][summaryName]['name'])
                            } else {
                                otherSearchNames.push(ShowcaseInfo['summaries'][summaryName]['name'])
                            }
                        }
                    }
                    if (recommendedSearchNames.length + otherSearchNames.length > 0) {
                        recommendedSearchNames = recommendedSearchNames.sort()
                        otherSearchNames = otherSearchNames.sort()
                        if (recommendedSearchNames.length >= 10) {
                            finalSearchNames = recommendedSearchNames.slice(0, 10)
                        } else {
                            finalSearchNames = recommendedSearchNames
                        }
                        if (finalSearchNames.length < 10) {
                            finalSearchNames = finalSearchNames.concat(otherSearchNames.slice(0, 10 - finalSearchNames.length))
                        }
                        finalSearchNames = finalSearchNames.sort()
                        let topContentDiv = $("<div class=\"top-content\">")
                        topContentDiv.append(_("<h3>Content for This Data Source Category</h3>").t())
                        let contentList = $("<ul>")
                        for (let i = 0; i < finalSearchNames.length; i++) {
                            let summaryName = nameToID[finalSearchNames[i]]
                            contentList.append('<li><a target="_blank" href="' + ShowcaseInfo['summaries'][summaryName]['dashboard'] + '" class="ext">' + ShowcaseInfo['summaries'][summaryName]['name'] + '</a></li>')
                        }
                        if (recommendedSearchNames.length + otherSearchNames.length > 10) {
                            contentList.append("<li>And " + (recommendedSearchNames.length + otherSearchNames.length - 10) + " others.</li>")
                        }
                        topContentDiv.append(contentList)
                        topContentDiv.append(splunkUtil.sprintf(_('<p>Open in the <a target="_blank" href="contents#data_source_categories_display=%s" class="external drilldown-link">Security Content Dashboard</a></p>').t(), eventtype.name.replace(/ /g, "_")))
                        $(".ds_main_panel").append(topContentDiv)
                    }

                    // let product_list = []
                    // for (product in eventtype.products) {
                    //     if (typeof eventtype.products[product]['name'] != "undefined" && eventtype.products[product]['name'] != "" && product != "cim") {
                    //         product_list.push(eventtype.products[product]['name'])
                    //     }
                    // }
                    let product_list = eventtype.common_product_names;
                    if (product_list && product_list.length > 0) {
                        $(".ds_main_panel").append($("<p>").html("Common products: " + product_list.join(", ")))
                    }

                    //let SelectStatus = $('<div eventtypeId="' + eventtypeId + '" datasourceId="' + datasourceId + '"><input type="radio" name="status" value="good"> Good<br /> <input type="radio" name="status" value="bad"> Bad <br/> <input type="radio" name="status" value="mixed"> Mixed <br /><input type="radio" name="status" value="unknown"> Unknown<br /><br /><button class="change-status" type="btn">Set</button></div>')
                    let NextItemLabel = "Complete"
                        // console.log("loadNextDSC Call", loadNextDSC(true));
                    if (loadNextDSC(true) != -1) {
                        NextItemLabel = "Next: " + eventtype_to_label[loadNextDSC(true)]
                    }
                    let SelectStatus = $('<div class="input_eventtype_status" id="input_eventtype_status" eventtypeId="' + eventtypeId + '" datasourceId="' + datasourceId + '"><br /><br /><button class="reset btn" type="btn">' + _("Reset").t() + '</button><button class="change-status btn" type="btn">' + NextItemLabel + '</button></div>')

                    SelectStatus.prepend($('<div class="slidecontainer"></div>').append($('<div class="sliderDescription"><span style="float: left;">0%</span><span style="float: right;">100%</span><span class="statusPercent">' + _("How Is Your Coverage?").t() + '</span></div>'), $('<input type="range" min="1" data-placement="top" data-toggle="tooltip" max="100" value="50" class="slider" id="myRange">').click(function(evt) {
                        let target = $(evt.target);
                        let newValue = target.val();
                        let datasourceId = target.closest("div.input_eventtype_status").attr("datasourceId")
                        let eventtypeId = target.closest("div.input_eventtype_status").attr("eventtypeId")

                        // console.log("Setting details", datasourceId, eventtypeId, newValue)
                        // Update eventtype status
                        updateEventtypeOnServer(datasourceId, eventtypeId, newValue, "")
                            // Update icon
                        data_inventory[datasourceId].eventtypes[eventtypeId].status = newValue
                        $(".ds_datasource_active").find(".ds_status").html($('<div style="position: relative;">').html(buildStatusIcon(newValue)))
                        $(".ds_datasource_active").attr("status", newValue)
                        setSliderStatus(target)

                    }), $('<div class="sliderStatus">Not Set</div> ')))

                    $(".ds_main_panel").append(SelectStatus)
                    $(".input_eventtype_status").find("button.reset").click(function() {
                            // console.log("Resetting...")
                            let newValue = "unknown";
                            let datasourceId = $(".slidecontainer").closest("div.input_eventtype_status").attr("datasourceId")
                            let eventtypeId = $(".slidecontainer").closest("div.input_eventtype_status").attr("eventtypeId")
                            $(".slidecontainer").find("input").val(50);
                            $(".slidecontainer").find("input").removeClass("selectedSlider");
                            $(".slidecontainer").find("input").css("background-color", "#d3d3d3");
                            $(".slidecontainer").find(".sliderStatus").text("Not Set");
                            $(".ds_datasource_active").attr("status", "unknown");
                            updateEventtypeOnServer(datasourceId, eventtypeId, newValue, "")
                            $(".ds_datasource_active").find(".ds_status").html($('<div style="position: relative;">').html(buildStatusIcon(newValue)))


                        })
                        // console.log("Existing status for ", eventtypeId, eventtype.status)
                    if (typeof eventtype.status != "undefined" && !isNaN(eventtype.status)) {
                        $(".slider").val(eventtype.status)
                        setSliderStatus($(".slider"))
                    }


                    function setSliderStatus(target) {

                        let value = target.val()
                        if (value < 30) {
                            value--;
                        }
                        let label = value + "% Complete"
                        let starting_red = 183;
                        let starting_green = 231;
                        let starting_blue = 253;
                        let final_red = 0;
                        let final_green = 101;
                        let final_blue = 173;
                        let desired_red = (value / 100) * (final_red - starting_red) + starting_red;
                        let desired_green = (value / 100) * (final_green - starting_green) + starting_green;
                        let desired_blue = (value / 100) * (final_blue - starting_blue) + starting_blue;
                        // let red = 0;
                        // let green = 0;
                        // let blue = 0;
                        // if (value < 25) { // Move to orange
                        //     red = 255 - Math.round((25 - value) / 25 * 77)
                        //     green = Math.round(value / 25 * 174)
                        // } else if (value < 50) { // Move to yellow
                        //     value = value - 25;
                        //     green = 174 + Math.round(value / 25 * 77)
                        //     red = 178 + Math.round(value / 25 * 77)
                        // } else { // Move to green
                        //     value = value - 50

                        //     green = 255 + Math.round(value ** 0.8 / 50 ** 0.8 * 81)
                        //     red = 255 - Math.round(value ** 0.8 / 50 ** 0.8 * 174)
                        // }
                        target.css("background-color", "rgb(" + desired_red + "," + desired_green + "," + desired_blue + ")")
                        target.addClass("selectedSlider")
                        target.closest(".slidecontainer").find(".sliderStatus").text(label)
                    }
                    $(".change-status").click(function() { loadNextDSC(); })


                }
            }
        }
    }

    function buildStatusIcon(status, style) {
        style = style || "top: 6px; font-size: 18px;"
        if (typeof status != "undefined") {
            if (status == "inqueue") {
                return '<i class="icon-clock" style="position: absolute; color: gray; left: 6px; ' + style + '" />'
            } else if (status > 95) {
                return '<i class="icon-check" style="position: absolute; color: #65a637; left: 6px; ' + style + '" />'
            } else if (status >= 20) {
                return '<i class="icon-warning" style="position: absolute; color: #f2b827; left: 6px; ' + style + '" />'
            } else if (status >= 0) {
                return '<i class="icon-error" style="position: absolute; color: #d6563c; left: 6px; ' + style + '" />'
            } else {
                return '<i class="icon-question" style="position: absolute; left: 6px; ' + style + '" />'
            }
        } else {
            return '<i class="icon-question" style="position: absolute; left: 6px; ' + style + '" />'
        }

    }

    function summarizeStatus(statusObj, justOneAllowed) {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < statusObj.length; i++) {
            sum += statusObj[i];
            count++;
        }
        return Math.round(sum / count);

        // if (statusObj["inqueue"] > 0) {
        //     return "inqueue"
        // } else if (statusObj["unknown"] > 0) {
        //     return "unknown"
        // } else if (statusObj["mixed"] > 0 && statusObj["inqueue"] == 0) {
        //     return "mixed"
        // } else if (statusObj["good"] > 0 && statusObj["bad"] > 0 && statusObj["inqueue"] == 0) {
        //     if (statusObj["good"] == 1 && justOneAllowed == true) {
        //         return "good"
        //     } else {
        //         return "mixed"
        //     }
        // } else if (statusObj["bad"] > 0) {
        //     return "bad"
        // } else if (statusObj["good"] > 0) {
        //     return "good"
        // } else {
        //     return "mixed"
        //         // console.log("ERROR! Unclear how this pops up..", statusObj)
        // }
    }

    function updateEventtypeOnServer(datasourceId, eventtypeId, status, basesearch) {
        updateDatasourceMainLabel($("div#" + eventtypeId).closest(".datasource_main"))
        basesearch = basesearch || "";
        if (status == "inqueue")
            return 0;
        var record = {
            _time: (new Date).getTime() / 1000,
            _key: eventtypeId,
            datasourceId: datasourceId,
            eventtypeId: eventtypeId,
            status: status,
            basesearch: basesearch
        }


        if (typeof data_inventory[datasourceId].eventtypes[eventtypeId].kvstore_exists != "undefined" && data_inventory[datasourceId].eventtypes[eventtypeId].kvstore_exists == true) {
            delete record["_key"]
            $.ajax({
                url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_eventtypes/' + eventtypeId,
                type: 'POST',
                contentType: "application/json",
                async: false,
                data: JSON.stringify(record)
            })
        } else {

            $.ajax({
                url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_eventtypes',
                type: 'POST',
                contentType: "application/json",
                async: false,
                data: JSON.stringify(record),
                error: function(jqXHR, textStatus, errorThrown) {
                    if (jqXHR.status === 409) {
                        delete record["_key"]
                        $.ajax({
                            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/data_inventory_eventtypes/' + eventtypeId,
                            type: 'POST',
                            contentType: "application/json",
                            async: false,
                            data: JSON.stringify(record)
                        })
                    }
                }
            })

        }

        require(["components/data/sendTelemetry"], function(Telemetry) {
            Telemetry.SendTelemetryToSplunk("DataStatusChange", { "status": status, "selectionType": "manual", "category": eventtypeId })
        })
    }

    function ModalSuggestingDataSourceCheck() {

        // Now we initialize the Modal itself
        var myModal = new Modal("addExisting", {
            title: "Data Source Check",
            backdrop: 'static',
            keyboard: false,
            destroyOnHide: true,
            type: 'normal'
        });

        $(myModal.$el).on("show", function() {

        })
        myModal.body
            .append($("<p>").text(_("Welcome to the Data Inventory dashboard! The goal of this dashboard is to understand what data you have and to provide a foundational set of dashboards that guide you to valuable content. Furthermore, we want to provide a prescriptive view to what content will add value to your security operations.").t()), $("<p>").html(_("As an aside, we hope to automate as much of the data inventory process as possible. (We don't like filling out forms either!) Currently, we have approximately half of the introspection automated via the Data Source Check dashboard (excluding data sources used only by Splunk premium solutions), but we have near term plans to enhance this Data Inventory dashboard with extensive introspection capabilities. For now, you might save yourself some time (and paperwork) by starting with the Data Source Check, or stay here and walk through the data inventory manually.").t()));

        myModal.footer.append($('<button>').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn ').text('Stay Here').on('click', function() {
            // Not taking any action here
        }), $('<button>').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary').text(_('Go to the Data Source Check').t()).on('click', function() {
            window.location.href = "data_source_check"
        }))
        myModal.show(); // Launch it!
    }
    window.ModalSuggestingDataSourceCheck = ModalSuggestingDataSourceCheck
})

require(['jquery',
        "underscore"
    ], function($, _) {


        function loadNextDSC(valueOnly) {
            // console.log("loadNextDSC called..", valueOnly)


            if ($(".ds_datasource_active").length == 0) {
                $(".ds_datasource").first().click()
            } else {
                let datasourceDivs = $(".ds_datasource")
                let datasourceIds = []
                let currentDatasourceId = $(".ds_datasource_active").first().attr("id")
                for (let i = 0; i < datasourceDivs.length; i++) {
                    datasourceIds.push(datasourceDivs[i].id)
                }
                let existingDSIndex = datasourceIds.indexOf(currentDatasourceId)
                if (existingDSIndex == datasourceIds.length - 1) {
                    if (valueOnly) {
                        return -1;
                    } else {
                        $('.ds_main_panel').html('<h2>' + _("Data Inventory Complete").t() + '</h2><p>' + _('You\'ve now gone through all of the configuration necessary to tell Splunk what data types you have in your environment. Time to explore content!').t() + '</p><button class="btn btn-primary get-started">' + _("Ready to get started?").t() + '</button></div>')
                        $("button.get-started").click(function() { window.location = "contents" })
                        $(".ds_datasource_active").removeClass("ds_datasource_active")
                    }
                } else {
                    if (valueOnly) {
                        // console.log("Value only return..", datasourceIds[existingDSIndex + 1])
                        return datasourceIds[existingDSIndex + 1]
                    } else {

                        // console.log("Going next...", datasourceIds[existingDSIndex + 1])
                        $(".ds_datasource").hide()
                        $(".ds_datasource_active").removeClass("ds_datasource_active")
                        $("#" + datasourceIds[existingDSIndex + 1]).closest(".datasource_main").find(".ds_datasource").show()
                        $("#" + datasourceIds[existingDSIndex + 1]).click()

                    }
                }
            }
        }
        window.loadNextDSC = loadNextDSC;
    })
    //# sourceURL=data_inventory.js