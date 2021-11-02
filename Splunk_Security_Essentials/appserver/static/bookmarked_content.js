"use strict";


// Queue translation early, before other work occurs
window.localeString = location.href.replace(/\/app\/.*/, "").replace(/^.*\//, "")
window.startTime = Date.now()
let appName = "Splunk_Security_Essentials";
let build = "10118";
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




function toHex(str) {
    //http://forums.devshed.com/javascript-development-115/convert-string-hex-674138.html
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

window.NumSearchesSelected = 0

var addingIndividualContent = $.Deferred()
var examples = {}
loadSPL()

function trigger_clicked(str) {
    if (document.getElementById("checkbox_" + str).checked) {
        window.NumSearchesSelected += 1;
    } else {
        window.NumSearchesSelected -= 1;
    }
    $("#NumSearches").text(window.NumSearchesSelected)
}



window.SearchesInProgress = []
window.SearchesInQueue = []
window.SearchesComplete = []
window.allDataSources = new Object();
var BookmarkStatus = { "none": "Not On List", "bookmarked": "Bookmarked", "inQueue": "Ready for Deployment", "needData": "Waiting on Data", "issuesDeploying": "Deployment Issues", "needsTuning": "Needs Tuning", "successfullyImplemented": "Successfully Implemented" }

function popAndAddFirstBookmark() {
    if (window.currentQueuedJSONReplacement['bookmarks'].length > 0) {
        record = window.currentQueuedJSONReplacement['bookmarks'].shift()
        $.ajax({
            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark/',
            type: 'POST',
            contentType: "application/json",
            async: false,
            data: JSON.stringify(record),
            success: function(returneddata) { popAndAddFirstBookmark() },
            error: function(xhr, textStatus, error) {}
        })
    } else {
        $("#bookmarkStatus").attr("status", "complete").append($("<p>Success! Added all bookmarks</p>"))
        markAllBookmarkRestorationComplete()
    }
}

function popAndAddFirstCustomBookmark() {
    if (window.currentQueuedJSONReplacement['customBookmarks'].length > 0) {
        record = window.currentQueuedJSONReplacement['customBookmarks'].shift()
        $.ajax({
            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom/',
            type: 'POST',
            contentType: "application/json",
            async: false,
            data: JSON.stringify(record),
            success: function(returneddata) { popAndAddFirstCustomBookmark() },
            error: function(xhr, textStatus, error) {}
        })
    } else {
        $("#customBookmarkStatus").attr("status", "complete").append($("<p>Success! Added all custom content.</p>"))
        markAllBookmarkRestorationComplete()
    }
}

function markAllBookmarkRestorationComplete() {
    if ($("#bookmarkStatus").attr("status") == "complete" && $("#customBookmarkStatus").attr("status") == "complete") {
        $(".modal:visible").find(".modal-footer").find("button").text("Reload Page").addClass("btn-primary")

        $(".modal:visible").on("hide", function() {
            location.reload()
        })
    }
}

function Modal() {
    require(["underscore"], function(_) {
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; };
        }();

        function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

        function Modal(id, options) {
            var _this = this;

            _classCallCheck(this, Modal);

            var modalOptions = _.extend({ show: false }, options);

            // if "id" is the element that triggers the modal display, extract the actual id from it; otherwise use it as-is
            var modalId = id //!= null && (typeof id === 'undefined' ? 'undefined' : _typeof(id)) === 'object' && id.jquery != null ? id.attr('data-target').slice(1) : id;

            var header = $('<div>').addClass('modal-header');

            var headerCloseButton = $('<button>').addClass('close').attr({
                'type': 'button',
                'data-dismiss': 'modal',
                'aria-label': 'Close'
            }).append($('<span>').attr('aria-hidden', true).text('&times;'));

            this.title = $('<h3>').addClass('modal-title');

            this.body = $('<div>').addClass('modal-body');

            this.footer = $('<div>').addClass('modal-footer');

            this.$el = $('<div>').addClass('modal mlts-modal').attr('id', modalId).append($('<div>').addClass('modal-dialog').append($('<div>').addClass('modal-content').append(header.append(headerCloseButton, this.title), this.body, this.footer)));

            if (modalOptions.title != null) this.setTitle(modalOptions.title);

            if (modalOptions.type === 'wide') this.$el.addClass('modal-wide');
            else if (modalOptions.type === 'noPadding') this.$el.addClass('mlts-modal-no-padding');

            // remove the modal from the dom after it's hidden
            if (modalOptions.destroyOnHide !== false) {
                this.$el.on('hidden.bs.modal', function() {
                    return _this.$el.remove();
                });
            }

            this.$el.modal(modalOptions);
        }

        _createClass(Modal, [{
            key: 'setTitle',
            value: function setTitle(titleText) {
                this.title.text(titleText);
            }
        }, {
            key: 'show',
            value: function show() {
                this.$el.modal('show');
            }
        }, {
            key: 'hide',
            value: function hide() {
                this.$el.modal('hide');
            }
        }]);
        window.Modal = Modal
        return Modal;
    })
}
var myTestModal = new Modal('blah', {
    title: 'this is a test',
    destroyOnHide: true,
    type: 'wide'
});







require([
        "jquery",
        "underscore",
        "splunkjs/mvc",
        "splunkjs/mvc/utils",
        "splunkjs/mvc/tokenutils",
        "splunkjs/mvc/simplexml",
        "splunkjs/mvc/searchmanager",
        Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js"),
        "splunkjs/ready!",
        "bootstrap.tooltip",
        "bootstrap.popover",
        "css!../app/Splunk_Security_Essentials/style/data_source_check.css"
    ],
    function(
        $,
        _,
        mvc,
        utils,
        TokenUtils,
        DashboardController,
        SearchManager,
        Telemetry,
        Ready
    ) {




        function manageContentModal() {

            let myModal = new Modal('manageContentPrompt', {
                title: 'Manage Content',
                destroyOnHide: true,
                type: 'wide'
            });
            $(myModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            let body = $("<div>").append($("<p>Here you can clear your bookmark list, snapshot your current bookmark list, or restore a snapshot. Bookmarks snapshots are stored in a lookup called sse_bookmark_backup.csv -- if you would like to back them up off system, you can grab a snapshot and then back up this file.</p>"),
                $('<button style="" class="btn">Clear Current List</button>').click(function() {
                    $(".modal,.modal-backdrop").remove()
                    clearBookmarkList();
                }),
                $('<button style="margin-left: 8px;" class="btn">Snapshot Current List</button>').click(function() {
                    $(".modal,.modal-backdrop").remove()
                    snapshotBookmarkList();
                }),
                $('<button style="margin-left: 8px;" class="btn">Import New Snapshot</button>').click(function() {
                    $(".modal,.modal-backdrop").remove()
                    importBookmarkList();
                }),
                $('<button style="margin-left: 8px;" class="btn btn-primary">Manage and Restore Snapshots</button>').click(function() {
                    $(".modal,.modal-backdrop").remove()
                    restoreBookmarkList();
                }))
            myModal.body.html(body)



            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-primary ').text('Close').on('click', function() {

            }))
            myModal.show()
        }
        $("#manageBookmarkLink").click(function() {
            manageContentModal()
        })

        function importBookmarkList() {
            if ($("#importSnapshot").length > 0) {
                $("#importSnapshot").remove()
            }
            let myModal = new Modal('importSnapshot', {
                title: 'Import Snapshot'
            });
            $(myModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            let body = $("<p>On the Manage Snapshots page, you can export a snapshot dump (base64 encoded JSON). If you'd like to import a dump, please paste it into the box below. You will then be taken to the Manage Snapshots page and can opt to restore it if you would like.</p><div id=\"importStatus\"><textarea id=\"importSnapshotBlob\" /></div>")

            myModal.body.html(body)



            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text('Cancel').on('click', function() {

            }), $('<button>').attr({
                type: 'button'
            }).addClass('btn btn-primary disabled').attr("id", "buttonForImport").text('Import').attr("disabled", "disabled").on('click', function() {
                //console.log("Got the import request!", $("#importSnapshotBlob").val())
                let base64blob = $("#importSnapshotBlob").val().replace(/[^a-zA-Z0-9=\/\+]/g, "")
                let jsonBlob = ""
                let output = ""

                try {
                    jsonBlob = atob(base64blob);

                    try {
                        output = JSON.parse(jsonBlob);

                        let rowID = (Math.random() * 100000000000000000).toString(16)
                        let searchString = '| makeresults | eval id="' + rowID + '", user="' + output['user'].replace(/"/g, "") + '", snapshot_name="' + output['name'].replace(/"/g, "\\\"") + '", num_bookmarks=' + output['num_bookmarks'] + ', num_custom_items=' + output['num_custom_items'] + ', json="' + JSON.stringify(output['json']).replace(/"/g, '\\"') + '" | outputlookup append=t sse_bookmark_backup'

                        if (typeof splunkjs.mvc.Components.getInstance("importSnapshotSearch_" + rowID) == "object") {
                            splunkjs.mvc.Components.revokeInstance("importSnapshotSearch_" + rowID)
                        }
                        let importSnapshotSearch = new SearchManager({
                            "id": "importSnapshotSearch_" + rowID,
                            "cancelOnUnload": true,
                            "latest_time": "0",
                            "sample_ratio": null,
                            "status_buckets": 0,
                            "autostart": true,
                            "earliest_time": "now",
                            "search": searchString,
                            "app": utils.getCurrentApp(),
                            "auto_cancel": 90,
                            "preview": true,
                            "runWhenTimeIsUndefined": false
                        }, { tokens: false });

                        importSnapshotSearch.on('search:fail', function(properties) {
                            $("#importStatus").html("<h3>Error!</h3><p>Unknown error appending snapshot to the lookup.</p>")
                        })

                        importSnapshotSearch.on('search:done', function(properties) {

                            $(".modal,.modal-backdrop").remove()
                            let myModal = new Modal('importSnapshotSuccess', {
                                title: 'Import Snapshot Success'
                            });
                            $(myModal.$el).on("hide", function() {
                                // Not taking any action on hide, but you can if you want to!
                            })

                            let body = $("<p>Success! Imported snapshot \"" + output['name'] + ".\" It has now been added to your snapshot list, you may restore it if desired.</p>")

                            myModal.body.html(body)
                            myModal.footer.append($('<button>').attr({
                                type: 'button',
                                'data-dismiss': 'modal'
                            }).addClass('btn ').text('Close All').on('click', function() {
                                $(".modal,.modal-backdrop").remove()
                            }), $('<button>').attr({
                                type: 'button',
                                'data-dismiss': 'modal'
                            }).addClass('btn btn-primary').text('Restore Snapshots').on('click', function() {
                                $(".modal,.modal-backdrop").remove()
                                restoreBookmarkList()
                            }))
                            myModal.show()
                        })

                        importSnapshotSearch.on('search:error', function(properties) {
                            $("#importStatus").html("<h3>Error!</h3><p>Unknown error appending snapshot to the lookup.</p>")
                        })

                        importSnapshotSearch.on('search:cancel', function(properties) {
                            $("#importStatus").html("<h3>Error!</h3><p>Unknown error appending snapshot to the lookup.</p>")
                        })



                    } catch (err) {

                        $(".modal,.modal-backdrop").remove()
                        let myModal = new Modal('restoreSnapshotError2', {
                            title: 'Error Parsing',
                            destroyOnHide: true
                        });
                        myModal.body.html("<p>We received an error when trying to parse this -- after base64 decoding, it appears to not be a valid JSON output. Please ensure that you have the entire string pasted into this box.</p><h3>Error</h3><pre>" + err.message + "</pre><h3>Decoded JSON</h3><pre>" + jsonBlob + "</pre>")
                        myModal.footer.append($('<button>').attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-primary').text('Close'))
                        myModal.show()
                    }
                } catch (err) {

                    $(".modal,.modal-backdrop").remove()
                    let myModal = new Modal('restoreSnapshotError1', {
                        title: 'Error Parsing',
                        destroyOnHide: true
                    });
                    myModal.body.html("<p>We received an error when trying to parse this -- it appears to not be a valid base64 encoded string. Please ensure that you have the entire string pasted into this box.</p><h3>Error</h3><pre>" + err.message + "</pre>")
                    myModal.footer.append($('<button>').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary').text('Close'))
                    myModal.show()
                }
                // console.log("Here is our thing", output)
            }))
            myModal.show()

            $("#importSnapshotBlob").on("keyup change", function(evt) {
                setTimeout(function() {
                    if ($("#importSnapshotBlob").val().length > 0) {
                        $("#buttonForImport").removeAttr("disabled").removeClass("disabled");
                    } else {
                        $("#buttonForImport").attr("disabled", "disabled").addClass("disabled");
                    }
                }, 100)
            })

        }

        function restoreBookmarkList() {

            let myModal = new Modal('restoreSnapshot', {
                title: 'Manage Snapshots',
                destroyOnHide: true
            });
            $(myModal.$el).addClass("modal-extra-wide").on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            let body = $("<p>Below you will find a list of all existing snapshots. Click the restore button to make them current, or the <i class=\"icon-close\"/> to remove them.</p><div id=\"listOfSnapshots\"><h3>Processing...</h3>")

            myModal.body.html(body)



            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text('Close').on('click', function() {

            }))
            myModal.show()


            let searchString = "| inputlookup sse_bookmark_backup | eval time=_time | convert ctime(time)"

            if (typeof splunkjs.mvc.Components.getInstance("snapshotCollectSearch") == "object") {
                splunkjs.mvc.Components.revokeInstance("snapshotCollectSearch")
            }
            let snapshotCollectSearch = new SearchManager({
                "id": "snapshotCollectSearch",
                "cancelOnUnload": true,
                "latest_time": "0",
                "sample_ratio": null,
                "status_buckets": 0,
                "autostart": true,
                "earliest_time": "now",
                "search": searchString,
                "app": utils.getCurrentApp(),
                "auto_cancel": 90,
                "preview": true,
                "runWhenTimeIsUndefined": false
            }, { tokens: false });


            snapshotCollectSearch.on('search:done', function(properties) {


                let SearchID = properties.content.request.label
                if (properties.content.resultCount == 0) {
                    $("#listOfSnapshots").html("<h3>No Snapshots Found</h3>")
                } else {
                    var results = splunkjs.mvc.Components.getInstance(SearchID).data('results', { output_mode: 'json', count: 0 });
                    results.on("data", function(properties) {
                        var SearchID = properties.attributes.manager.id
                        var data = properties.data().results
                        let table = $('<table id="snapshotList" class="table table-striped"><thead><tr><th>Snapshot Name</th><th>When Captured</th><th>User</th><th># Bookmarks</th><th># Custom Items</th><th>Export</th><th>Restore</th><th>Delete</th></tr></thead><tbody></tbody></table>')
                        let tbody = table.find("tbody")
                            // console.log("Got my data!", data)
                        for (let i = 0; i < data.length; i++) {
                            let row = $("<tr>").attr("data-rowid", data[i]['id']).attr("data-json", data[i]['json'])
                            row.append($('<td class="snapshot-name">').text(data[i]['snapshot_name']))
                            row.append($('<td class="snapshot-time">').text(data[i]['time']))
                            row.append($('<td class="snapshot-user">').text(data[i]['user']))
                            row.append($('<td class="snapshot-num_bookmarks">').text(data[i]['num_bookmarks']))
                            row.append($('<td class="snapshot-num_custom_items">').text(data[i]['num_custom_items']))
                            row.append($('<td class="snapshot-">').html($('<i class="icon-export" style="cursor: pointer;">').click(function(evt) {
                                let target = $(evt.target);
                                let row = target.closest("tr");
                                let output = {}
                                output["name"] = row.find(".snapshot-name").text()
                                output["time"] = row.find(".snapshot-time").text()
                                output["user"] = row.find(".snapshot-user").text()
                                output["num_bookmarks"] = row.find(".snapshot-num_bookmarks").text()
                                output["num_custom_items"] = row.find(".snapshot-num_custom_items").text()
                                output["json"] = JSON.parse(target.closest("tr").attr("data-json"))
                                let base64Output = btoa(JSON.stringify(output))
                                    // console.log("Got a request to restore", target.closest("tr").attr("data-rowid"), output, base64Output, target.closest("tr").html())

                                let myModal = new Modal('snapshotJSON', {
                                    title: 'Snapshot Export',
                                    destroyOnHide: true
                                });
                                $(myModal.$el).on("hide", function() {
                                    // Not taking any action on hide, but you can if you want to!
                                })

                                let body = $("<div>")
                                body.append("<p>Below is the contents of this export (a JSON output encoded as base64). You can bring this to any Splunk Security Essentials instance and paste it into the text box on the Import Snapshot window from the Manage List link on the Bookmarked Content page (just as you got to this window).</p>")
                                body.append($('<textarea id="importSnapshotBlob" />').text(base64Output))
                                body.append($('<p> to automatically add the text to your clipboard</p>').prepend($('<a href="#">Click Here</a>').click(function() {
                                    var copyText = document.getElementById("importSnapshotBlob");
                                    copyText.select();
                                    document.execCommand("copy");
                                })))
                                myModal.body.html(body)



                                myModal.footer.append($('<button>').attr({
                                    type: 'button',
                                    'data-dismiss': 'modal'
                                }).addClass('btn ').text('Close').on('click', function() {

                                }))
                                myModal.show()
                            })))
                            row.append($("<td>").append($("<button class=\"btn\">").text("Restore").click(function(evt) {
                                let target = $(evt.target);
                                // console.log("Got a request to restore", target.closest("tr").attr("data-rowid"), target.closest("tr").html())

                                window.currentQueuedJSONReplacement = JSON.parse(target.closest("tr").attr("data-json"))


                                let actuallyDoTheClearing = $.Deferred();
                                $.when(actuallyDoTheClearing).then(function(existingData) {
                                    let readyToAdd = $.Deferred()
                                    if (existingData) {

                                        $.ajax({
                                            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                                            type: 'DELETE',
                                            async: true,
                                            success: function(returneddata) {
                                                readyToAdd.resolve()
                                            },
                                            error: function(xhr, textStatus, error) {

                                                let myModal = new Modal('clearConfirmed', {
                                                    title: 'Error!',
                                                    destroyOnHide: true,
                                                    type: 'wide'
                                                });
                                                myModal.body.html($("<div>").append($("<p>Error clearing existing bookmarks before adding new ones</p>"), $("<pre>").text(textStatus)))
                                                myModal.footer.append($('<button>').attr({
                                                    type: 'button',
                                                    'data-dismiss': 'modal'
                                                }).addClass('btn btn-primary ').text('Close'))
                                                myModal.show()
                                            }
                                        })

                                    } else {
                                        readyToAdd.resolve()
                                    }
                                    $.when(readyToAdd).then(function() {
                                            $("#listOfSnapshots").html('<table class="table"><thead><tr><th>Step</th><th>Status</th></thead><tbody><tr><td>Bookmarks</td><td id="bookmarkStatus"></td></tr><tr><td>Custom Content</td><td id="customBookmarkStatus"></td></tr></tbody></table>')
                                            popAndAddFirstBookmark()
                                            popAndAddFirstCustomBookmark()
                                        })
                                        // console.log("Restoring with ", window.currentQueuedJSONReplacement)
                                })

                                let bookmarkDeferral = $.Deferred();
                                let custombookmarksDeferral = $.Deferred();


                                $.ajax({
                                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                                    type: 'GET',
                                    contentType: "application/json",
                                    async: true,
                                    success: function(returneddata) {
                                        bookmarkDeferral.resolve(returneddata);
                                    },
                                    error: function() { bookmarkDeferral.resolve([]) }
                                })

                                $.ajax({
                                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
                                    type: 'GET',
                                    contentType: "application/json",
                                    async: true,
                                    success: function(returneddata) {
                                        custombookmarksDeferral.resolve(returneddata);
                                    },
                                    error: function() { custombookmarksDeferral.resolve([]) }
                                })

                                $.when(bookmarkDeferral, custombookmarksDeferral).then(function(bookmarks, customBookmarks) {
                                    if (bookmarks.length > 0 || customBookmarks.length > 0) {

                                        let myModal = new Modal('confirmOverwrite', {
                                            title: 'Confirm',
                                            destroyOnHide: true,
                                            type: 'wide'
                                        });
                                        myModal.body.html($("<div>").append($("<p>Are you sure you want to overwrite the current set of bookmarks?</p>")))
                                        myModal.footer.append($('<button>').attr({
                                            type: 'button',
                                            'data-dismiss': 'modal'
                                        }).addClass('btn ').text('Cancel'), $('<button>').attr({
                                            type: 'button',
                                            'data-dismiss': 'modal'
                                        }).addClass('btn btn-primary ').text('Confirm').click(function() {
                                            actuallyDoTheClearing.resolve(true)
                                        }))
                                        myModal.show()

                                    } else {
                                        actuallyDoTheClearing.resolve(false)
                                    }
                                })



                            })))
                            row.append($("<td>").append($("<i class=\"icon-close\">").css("cursor", "pointer").click(function(evt) {
                                let target = $(evt.target);
                                // console.log("Got a request to delete", target.closest("tr").attr("data-rowid"))


                                let searchString = "| inputlookup sse_bookmark_backup | where id!=\"" + target.closest("tr").attr("data-rowid") + "\"| outputlookup sse_bookmark_backup"

                                if (typeof splunkjs.mvc.Components.getInstance("deleteSnapshotSearch_" + target.closest("tr").attr("data-rowid")) == "object") {
                                    splunkjs.mvc.Components.revokeInstance("deleteSnapshotSearch_" + target.closest("tr").attr("data-rowid"))
                                }
                                let deleteSnapshotSearch = new SearchManager({
                                    "id": "deleteSnapshotSearch_" + target.closest("tr").attr("data-rowid"),
                                    "cancelOnUnload": true,
                                    "latest_time": "0",
                                    "sample_ratio": null,
                                    "status_buckets": 0,
                                    "autostart": true,
                                    "earliest_time": "now",
                                    "search": searchString,
                                    "app": utils.getCurrentApp(),
                                    "auto_cancel": 90,
                                    "preview": true,
                                    "runWhenTimeIsUndefined": false
                                }, { tokens: false });

                                deleteSnapshotSearch.on('search:fail', function(properties) {
                                    $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error deleting snapshot.</p>")
                                })

                                deleteSnapshotSearch.on('search:done', function(properties) {
                                    let SearchID = properties.content.request.label
                                        // console.log("Deletion Complete!", SearchID, properties)
                                    $("tr[data-rowid=" + SearchID.replace(/.*?\_/, "") + "]").remove()
                                    if ($("#snapshotList").find("tbody").find("tr").length == 0) {
                                        $("#listOfSnapshots").html("<h3>No Snapshots Found</h3>")

                                    }
                                })

                                deleteSnapshotSearch.on('search:error', function(properties) {
                                    $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error deleting snapshot.</p>")
                                })

                                deleteSnapshotSearch.on('search:cancel', function(properties) {
                                    $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error deleting snapshot.</p>")
                                })
                            })))
                            tbody.append(row)
                        }
                        $("#listOfSnapshots").html(table)
                    })
                }
            })

            snapshotCollectSearch.on('search:fail', function(properties) {
                $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error retrieving Bookmarks.</p>")
            })

            snapshotCollectSearch.on('search:error', function(properties) {
                $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error retrieving Bookmarks.</p>")
            })

            snapshotCollectSearch.on('search:cancel', function(properties) {
                $("#listOfSnapshots").html("<h3>Error!</h3><p>Unknown error retrieving Bookmarks.</p>")
            })
        }


        function snapshotBookmarkList() {

            let myModal = new Modal('confirmSnapshot', {
                title: 'Manage Content',
                destroyOnHide: true,
                type: 'wide'
            });
            $(myModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })
            let currentdate = new Date();
            let datetime = (currentdate.getMonth() + 1) + "/" +
                currentdate.getDate() + "/" +
                currentdate.getFullYear() + " " +
                currentdate.getHours() + ":" +
                currentdate.getMinutes() + ":" +
                currentdate.getSeconds();
            let body = $("<div>").append($("<p>Enter Desired Snapshot Name: </p>").append('<input class="input" id="snapshotName" value="' + datetime + '" />'), $("<br/>"), $('<div id="snapshotStatus">').append($('<button class="btn btn-primary">Snapshot Current Bookmarks</button>').click(function() {

                let bookmarkDeferral = $.Deferred();
                let custombookmarksDeferral = $.Deferred();


                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                    type: 'GET',
                    contentType: "application/json",
                    async: true,
                    success: function(returneddata) {
                        bookmarkDeferral.resolve(returneddata);
                    },
                    error: function() { bookmarkDeferral.resolve([]) }
                })

                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
                    type: 'GET',
                    contentType: "application/json",
                    async: true,
                    success: function(returneddata) {
                        custombookmarksDeferral.resolve(returneddata);
                    },
                    error: function() { custombookmarksDeferral.resolve([]) }
                })

                $.when(bookmarkDeferral, custombookmarksDeferral).then(function(bookmarks, customBookmarks) {
                    // console.log("Got my situation", bookmarks, customBookmarks, $("#snapshotName").val())
                    let object = { "bookmarks": bookmarks, "customBookmarks": customBookmarks }
                    let rowID = (Math.random() * 100000000000000000).toString(16)
                    let searchString = '| makeresults | eval id="' + rowID + '", user="' + $C['USERNAME'].replace(/"/g, "") + '", snapshot_name="' + $("#snapshotName").val().replace(/"/g, "\\\"") + '", num_bookmarks=' + bookmarks.length + ', num_custom_items=' + customBookmarks.length + ', json="' + JSON.stringify(object).replace(/"/g, '\\"') + '" | outputlookup append=t sse_bookmark_backup'
                    $("#snapshotStatus").html("<h3>Processing</h3>")

                    if (typeof splunkjs.mvc.Components.getInstance("snapshotSearch") == "object") {
                        splunkjs.mvc.Components.revokeInstance("snapshotSearch")
                    }
                    let snapshotSearch = new SearchManager({
                        "id": "snapshotSearch",
                        "cancelOnUnload": true,
                        "latest_time": "0",
                        "sample_ratio": null,
                        "status_buckets": 0,
                        "autostart": true,
                        "earliest_time": "now",
                        "search": searchString,
                        "app": utils.getCurrentApp(),
                        "auto_cancel": 90,
                        "preview": true,
                        "runWhenTimeIsUndefined": false
                    }, { tokens: false });


                    snapshotSearch.on('search:done', function(properties) {
                        $("#snapshotStatus").html("<h3>Complete!</h3><p>You may now close this dialog.</p>")
                    })

                    snapshotSearch.on('search:fail', function(properties) {
                        $("#snapshotStatus").html("<h3>Error!</h3><p>Unknown error snapshotting Bookmarks.</p>")
                    })

                    snapshotSearch.on('search:error', function(properties) {
                        $("#snapshotStatus").html("<h3>Error!</h3><p>Unknown error snapshotting Bookmarks.</p>")
                    })

                    snapshotSearch.on('search:cancel', function(properties) {
                        $("#snapshotStatus").html("<h3>Error!</h3><p>Unknown error snapshotting Bookmarks.</p>")
                    })

                })

            })))
            myModal.body.html(body)



            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text('Close').on('click', function() {

            }))
            myModal.show()
        }

        function clearBookmarkList() {

            let myModal = new Modal('confirmClear', {
                title: 'Manage Content',
                destroyOnHide: true,
                type: 'wide'
            });
            $(myModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            let body = $("<div>").append($("<p>Are you Sure?</p>"))
            myModal.body.html(body)



            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text('Cancel').on('click', function() {

            }), $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-primary ').text('Clear Bookmark List').on('click', function() {

                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                    type: 'DELETE',
                    async: true,
                    success: function(returneddata) {
                        let myModal = new Modal('clearConfirmed', {
                            title: 'Complete',
                            destroyOnHide: true,
                            type: 'wide'
                        });

                        $(myModal.$el).on("hide", function() {
                            location.reload()
                        })
                        myModal.body.html($("<div>").append($("<p>Bookmarks have been cleared. This page will reload when you close this window.</p>")))
                        myModal.footer.append($('<button>').attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-primary ').text('Reload Page'))
                        myModal.show()
                    },
                    error: function(xhr, textStatus, error) {

                        let myModal = new Modal('clearConfirmed', {
                            title: 'Error!',
                            destroyOnHide: true,
                            type: 'wide'
                        });
                        myModal.body.html($("<div>").append($("<p>Error Clearing Bookmarks</p>"), $("<pre>").text(textStatus)))
                        myModal.footer.append($('<button>').attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-primary ').text('Close'))
                        myModal.show()
                    }
                })


            }))
            myModal.show()
        }
        $("#manageBookmarkLink").click(function() {
            manageContentModal()
        })
        var HTMLBlock = ""
        var unsubmittedTokens = mvc.Components.getInstance('default');
        var submittedTokens = mvc.Components.getInstance('submitted');
        var myDataset = "No dataset provided"

        var items = new Object
        appName = "Splunk_Security_Essentials"
        ShowcaseInfo = ""
        $("#bookmark_table").append("<table style=\"\" id=\"main_table\" class=\"table table-chrome\" ><thead><tr class=\"dvbanner\"><th style=\"width: 10px; text-align: center\" class=\"tableexpand\"><i class=\"icon-info\"></i></th><th class=\"tableExample\">Content</th><th style=\"text-align: center\">Open</th>" /*<th class=\"tableChangeStatus\" style=\"text-align: center\">Change Status</th>" */ + "<th style=\"text-align: center\" class=\"tablebookmarked\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Bookmarked is the default status -- it's provided just so that you can remember items to review later.\">Bookmarked <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tableawaitingdata\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Awaiting Data indicates that you have plans to ingest the data, but it's not currently on-board.\">Awaiting Data <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tablereadyfordeploy\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Ready for Deployment indicates that the data in ingested, and it's now time to start implementing this detection.\">Ready for Deployment <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tabledeploymentissues\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Deployment Issues indicates that you've attempted to start building out the detection, but ran into a problem with scale, field extractions... anything except for too many alerts. Content with this status isn't ready for use yet.\">Deployment Issues <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tableneedstuning\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Needs Tuning indicates that the content has successfully been implemented, but too many alerts are being sent. Detections in this category are generally in use despite the noise.\">Needs Tuning <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tablesuccess\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Successfully Implemented is the ideal state -- it means that detections are deployed and working pretty well!\">Successfully Implemented <i class=\"icon-info-circle\" /></span></th><th style=\"text-align: center\" class=\"tableclose\"><span data-placement=\"top\" data-toggle=\"tooltip\" title=\"Removing here just means removing the bookmark, not the entire content. You will still be able to find it on the Security Contents page, and be able to re-add the bookmark later.\">Remove <i class=\"icon-info-circle\" /></span></th></tr></thead><tbody id=\"main_table_body\"></tbody></table>");
        $("[data-toggle=tooltip]").tooltip()
        $.getJSON($C['SPLUNKD_PATH'] + '/services/SSEShowcaseInfo?locale=' + window.localeString, function(ShowcaseInfo) {
            let fullShowcaseInfo = JSON.parse(JSON.stringify(ShowcaseInfo))

            function setbookmark_status(name, status, action) {
                if (!action) {
                    action = "bookmarked_content"
                }
                require([Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js")], function(Telemetry) {
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

            function deferralLookForEnabledContent(deferral) {
                let search_name_to_showcase_names = {}
                let SPL_to_name = {}
                    // console.log("Here's my showcaseInfo", fullShowcaseInfo)
                for (let SummaryName in fullShowcaseInfo['summaries']) {
                    if (fullShowcaseInfo['summaries'][SummaryName]['search_name']) {
                        search_name_to_showcase_names[fullShowcaseInfo['summaries'][SummaryName]['search_name']] = SummaryName
                    }
                    if (fullShowcaseInfo['summaries'][SummaryName]['examples']) {
                        for (let i = 0; i < fullShowcaseInfo['summaries'][SummaryName]['examples'].length; i++) {
                            if (fullShowcaseInfo['summaries'][SummaryName]['examples'][i]['label'] && fullShowcaseInfo['summaries'][SummaryName]['examples'][i]['label'].indexOf("Demo") == -1 && fullShowcaseInfo['summaries'][SummaryName]['examples'][i]["showcase"] && fullShowcaseInfo['summaries'][SummaryName]['examples'][i]["showcase"]["value"]) {
                                if (!SPL_to_name[fullShowcaseInfo['summaries'][SummaryName]['examples'][i]["showcase"]["value"].replace(/\s/g, "")]) {
                                    SPL_to_name[fullShowcaseInfo['summaries'][SummaryName]['examples'][i]["showcase"]["value"].replace(/\s/g, "")] = []
                                }
                                //console.log("Adding to spl_to_name", fullShowcaseInfo['summaries'][SummaryName]['examples'][i])
                                SPL_to_name[fullShowcaseInfo['summaries'][SummaryName]['examples'][i]["showcase"]["value"].replace(/\s/g, "")].push(SummaryName)

                            }
                        }
                    }
                }
                // console.log("Here's my search name to showcse name", search_name_to_showcase_names)
                $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/servicesNS/' + $C['USERNAME'] + '/-/saved/searches?output_mode=json&count=0',
                    type: 'GET',
                    async: true,
                    success: function(savedSearchObj) {
                        let enabled_searches = {}

                        // First look to see if exact ES or ESCU 
                        for (let i = 0; i < savedSearchObj.entry.length; i++) {
                            let search = savedSearchObj.entry[i];
                            if (!SPL_to_name[search.content.search.replace(/\s/g, "")]) {
                                SPL_to_name[search.content.search.replace(/\s/g, "")] = []
                            }
                            SPL_to_name[search.content.search.replace(/\s/g, "")].push(search.name);
                            // console.log("Extra logging 1 ", search.name)
                            if (search_name_to_showcase_names[search.name]) {
                                if (!search.content.disabled) {
                                    if (!enabled_searches[search_name_to_showcase_names[search.name]]) {
                                        enabled_searches[search_name_to_showcase_names[search.name]] = []
                                    }
                                    enabled_searches[search_name_to_showcase_names[search.name]].push({ "name": search.name })
                                        // console.log("Got a match", search.name, fullShowcaseInfo['summaries'][search_name_to_showcase_names[search.name]]['data_source_categories'], search.content.disabled)
                                }
                            }
                        }
                        for (let i = 0; i < savedSearchObj.entry.length; i++) {
                            let search = savedSearchObj.entry[i];
                            if (SPL_to_name[search.content.search.replace(/\s/g, "")] && SPL_to_name[search.content.search.replace(/\s/g, "")].length > 1 && search.content.disabled == false) {
                                for (let i = 0; i < SPL_to_name[search.content.search.replace(/\s/g, "")].length; i++) {
                                    if (search_name_to_showcase_names[SPL_to_name[search.content.search.replace(/\s/g, "")][i]]) {

                                        let searchName = SPL_to_name[search.content.search.replace(/\s/g, "")][i]
                                        if (search_name_to_showcase_names[searchName]) {

                                            if (!enabled_searches[search_name_to_showcase_names[searchName]]) {
                                                enabled_searches[search_name_to_showcase_names[searchName]] = []
                                            }
                                            enabled_searches[search_name_to_showcase_names[searchName]].push({ "name": search.name })
                                        }

                                        //  console.log("Found an instance of an ES / ESCU Search", search.name, search_name_to_showcase_names[SPL_to_name[search.content.search.replace(/\s/g, "")][i]], SPL_to_name[search.content.search.replace(/\s/g, "")], search.content.search)
                                    } else if (fullShowcaseInfo['summaries'][SPL_to_name[search.content.search.replace(/\s/g, "")][i]]) {

                                        if (!enabled_searches[SPL_to_name[search.content.search.replace(/\s/g, "")][i]]) {
                                            enabled_searches[SPL_to_name[search.content.search.replace(/\s/g, "")][i]] = []
                                        }
                                        enabled_searches[SPL_to_name[search.content.search.replace(/\s/g, "")][i]].push({ "name": search.name })

                                        // console.log("Found an instance of an SSE Search", search.name, fullShowcaseInfo['summaries'][SPL_to_name[search.content.search.replace(/\s/g, "")][i]], search.content.search)
                                    }
                                }
                            }
                        }
                        deferral.resolve(enabled_searches)

                    },
                    error: function(xhr, textStatus, error) {
                        console.error("Error Updating!", xhr, textStatus, error);
                        //triggerError(xhr.responseText);
                    }
                })
            }
            splunkjs.mvc.Components.getInstance("submitted").on("change:implemented", function(obj, value) {
                if (value < 5) {
                    if (typeof localStorage["sse-haveRunSearchIntrospection"] == "undefined" || localStorage["sse-haveRunSearchIntrospection"] == "") {
                        localStorage["sse-haveRunSearchIntrospection"] = "done"
                        let localContent = $("<div>").html($("<p>You have yet to run introspection to look for any of Splunk's pre-built content that is running on this local system. If you would like to, we can introspect your environment to look for any content that you've enabled, and note that it's active in order to take advantage of all our dashboards helping you understand the content in Splunk. Today, we will find the following content:</p>")).append($("<ul>").append($("<li>").text("ES or ESCU content enabled directly from the app (without copy-pasting the SPL into a new search)"), $("<li>").text("ES, ESCU, or SSE content where you directly copy-pasted the SPL into a new search that you activated.")), $("<p>").text("If you would like to close the dialog for now, you can always re-open it by clicking \"Mark Already-Enabled Content\" in the upper-right corner of this page."))
                        popModalToLookForEnabledContent(localContent)
                    }
                }
            })



            function popModalToLookForEnabledContent(alternateParagraphElement) {

                let myModal = new Modal('confirmClear', {
                    title: 'Look for Active Content',
                    destroyOnHide: true,
                    type: 'wide'
                });
                $(myModal.$el).on("hide", function() {
                    // Not taking any action on hide, but you can if you want to!
                })
                if (typeof alternateParagraphElement != "undefined") {
                    myModal.body.html($("<div>").append(alternateParagraphElement))
                } else {
                    myModal.body.html($("<div>").append($("<p>We can introspect your environment to look for any content that you've enabled, and track it as enabled in order to take advantage of all our dashboards helping you understand the content in Splunk. Today, we will find the following content:</p>"), $("<ul>").append($("<li>").text("ES or ESCU content enabled directly from the app (without copy-pasting the SPL into a new search)"), $("<li>").text("ES, ESCU, or SSE content where you directly copy-pasted the SPL into a new search that you activated."))))
                }


                myModal.body.append($('<button class="btn btn-primary">Look for Enabled Content</button>').click(function(evt) {
                    $(evt.target).hide()
                    let myDeferral = $.Deferred();
                    deferralLookForEnabledContent(myDeferral)
                    $.when(myDeferral).then(function(enabledContent) {
                        // console.log("Here's my enabled content", enabledContent)
                        let mainDiv = $("<div>")
                        let mainUL = $("<ul>")
                        for (let name in enabledContent) {
                            if (fullShowcaseInfo['summaries'][name]) {
                                setbookmark_status(fullShowcaseInfo['summaries'][name]['name'], "successfullyImplemented", "bookmarked_content_automated")
                                let localLI = $("<li>").text(fullShowcaseInfo['summaries'][name]['name'])
                                if (enabledContent[name].length > 1) {
                                    localLI = $("<li>").text(fullShowcaseInfo['summaries'][name]['name'] + " (" + enabledContent[name].length + " times)")
                                }
                                mainUL.append(localLI)
                            }
                        }
                        mainDiv.append(mainUL)
                        $("#DoIntrospection").append(mainDiv)
                        $("#DoIntrospection").closest(".modal").find(".modal-footer").find("button.btn-primary").text("Refresh Page").click(function() {
                            location.reload();
                        })

                    })
                }))

                myModal.body.append($('<div id="DoIntrospection">'))

                myModal.footer.append($('<button>').attr({
                    type: 'button',
                    'data-dismiss': 'modal'
                }).addClass('btn btn-primary ').text('Close').on('click', function() {

                }))
                myModal.show()
            }
            window.popModalToLookForEnabledContent = popModalToLookForEnabledContent;
            var bookmarkItems = []
            $.ajax({ url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark', async: false, success: function(returneddata) { bookmarkItems = returneddata } });

            var showcaseStatus = new Object()
            for (var i = 0; i < bookmarkItems.length; i++) {
                if (bookmarkItems[i].status == "needTuning")
                    bookmarkItems[i].status = "needsTuning" // Fixing a typo along the away
                showcaseStatus[bookmarkItems[i].showcase_name] = bookmarkItems[i].status

            }
            window.showcaseStatus = showcaseStatus

            var ShowcaseList = Object.keys(ShowcaseInfo.summaries)
            var newShowcaseInfo = new Object()
            newShowcaseInfo.roles = new Object()
            newShowcaseInfo.roles.default = new Object()
            newShowcaseInfo.roles.default.summaries = []
            newShowcaseInfo.summaries = new Object()

            var custombookmarkItems = []
            $.ajax({ url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom', async: false, success: function(returneddata) { custombookmarkItems = returneddata } });
            //   console.log("My bookmark, and count", custombookmarkItems, custombookmarkItems.length)
            $("#customSearches").find("text").text(custombookmarkItems.length)
            for (var i = 0; i < custombookmarkItems.length; i++) {
                var shortName = custombookmarkItems[i].showcase_name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
                var obj = new Object()
                obj.name = "Custom: " + custombookmarkItems[i].showcase_name
                if (typeof showcaseStatus[custombookmarkItems[i].showcase_name] == "undefined") {
                    obj.bookmark_status = custombookmarkItems[i].status
                        //  console.log("Checking the showcase.. no match for ", showcaseStatus, custombookmarkItems[i].showcase_name)
                } else {
                    obj.bookmark_status = showcaseStatus[custombookmarkItems[i].showcase_name]
                        //   console.log("Checking the showcase.. got a match for ", showcaseStatus, custombookmarkItems[i].showcase_name)
                }
                var datestring = new Date(custombookmarkItems[i]._time * 1000)
                obj.description = custombookmarkItems[i].description + "<br />Added on " + datestring.toISOString().split('T')[0] + " by " + custombookmarkItems[i].user
                obj.datasource = custombookmarkItems[i].datasource
                obj.journey = custombookmarkItems[i].journey || ""
                obj.isCustom = true
                obj._key = custombookmarkItems[i]._key
                newShowcaseInfo['summaries'][shortName] = obj
                newShowcaseInfo.roles.default.summaries.push(shortName)
            }

            // console.log("Before: ", ShowcaseInfo)
            //console.log("ShowcaseList", ShowcaseList)
            for (var i = 0; i < ShowcaseList.length; i++) {
                var showcaseName = ShowcaseList[i]
                    //console.log("Running(1).. ", showcaseName)
                if (typeof ShowcaseInfo.summaries[showcaseName].datasource != "undefined") {
                    var sources = ShowcaseInfo.summaries[showcaseName].datasource.split(/\|/g)
                    for (var g = 0; g < sources.length; g++) {
                        window.allDataSources[sources[g]] = 1
                    }
                }
                //console.log("Running.. ", showcaseName)
                if ((typeof showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] == "undefined" || showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] == "none") && (typeof ShowcaseInfo['summaries'][showcaseName]['bookmark_status'] == "undefined" || ShowcaseInfo['summaries'][showcaseName]['bookmark_status'] == "none")) {
                    //console.log(showcaseName,ShowcaseInfo['summaries'][showcaseName], ShowcaseInfo['summaries'][showcaseName]['name'], showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']], "is out!")
                    delete ShowcaseInfo['summaries'][showcaseName]
                    ShowcaseInfo.roles.default.summaries.splice(i, 1)
                } else {
                    //console.log(showcaseName, "is in!")
                    if (typeof showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] != "undefined") {
                        ShowcaseInfo['summaries'][showcaseName]['bookmark_status'] = showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']]
                    }
                    newShowcaseInfo['summaries'][showcaseName] = ShowcaseInfo['summaries'][showcaseName]
                    newShowcaseInfo.roles.default.summaries.push(showcaseName)
                        // console.log("Here's my new showcase", newShowcaseInfo)
                }
            }
            ShowcaseInfo = newShowcaseInfo

            if (ShowcaseInfo.roles.default.summaries.length == 0) {
                setTimeout(function() {
                    noContentMessage()
                }, 500)

            }
            // console.log("After: ", ShowcaseInfo)
            //  console.log("After new: ", newShowcaseInfo)
            ShowcaseInfo.roles.default.summaries.sort(function(a, b) {
                if (ShowcaseInfo.summaries[a].name > ShowcaseInfo.summaries[b].name) {
                    return 1;
                }
                if (ShowcaseInfo.summaries[a].name < ShowcaseInfo.summaries[b].name) {
                    return -1;
                }
                return 0;
            });
            for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
                summary = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]
                addItem(summary, ShowcaseInfo.roles.default.summaries[i])
            }

            addingIndividualContent.resolve()
            window.ShowcaseInfo = ShowcaseInfo
            updateDataSourceBlock()

            $("#layout1").append(HTMLBlock) //#main_content

            $("#layout1").append('<div id="bottomTextBlock" style=""></div>')
            contentMessage()

            $(".tabledemo").css("text-align", "center")
            $(".tablelive").css("text-align", "center")
            $(".tableaccel").css("text-align", "center")
            $(".panel-body").css("padding", "0px")
        });




        if ($(".dvTooltip").length > 0) { $(".dvTooltip").tooltip() }
        if ($(".dvPopover").length > 0) { $(".dvPopover").popover() }


        //ProcessSearchQueue()
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").first().css("width", "20%") });
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").last().css("width", "65%") });

        unsubmittedTokens.set(myDataset.replace(/\W/g, ""), "Test");

        submittedTokens.set(unsubmittedTokens.toJSON());



        $("#clearbookmarkLink").click(function() {


            var confirmClearModal = new Modal('confirmClear', {
                title: 'Are You Sure?',
                destroyOnHide: true,
                type: 'wide'
            });
            $(confirmClearModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            confirmClearModal.body.addClass('mlts-modal-form-inline').append("<p>Are you sure you want to clear the bookmarks?</p>")

            confirmClearModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn  ').text('No').on('click', function() {
                confirmClearModal.hide()
            }), $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-primary ').text('Yes').on('click', function() {
                confirmClearModal.hide()

                var resetSearch = new SearchManager({
                    "id": "resetSearch",
                    "cancelOnUnload": true,
                    "latest_time": "0",
                    "sample_ratio": null,
                    "status_buckets": 0,
                    "autostart": true,
                    "earliest_time": "now",
                    "search": '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]',
                    "app": utils.getCurrentApp(),
                    "auto_cancel": 90,
                    "preview": true,
                    "runWhenTimeIsUndefined": false
                }, { tokens: false });


                resetSearch.on('search:done', function(properties) {

                    var successClearModal = new Modal('successClear', {
                        title: 'History Cleared',
                        destroyOnHide: true,
                        type: 'wide'
                    });
                    $(successClearModal.$el).on("hide", function() {
                        // Not taking any action on hide, but you can if you want to!
                    })

                    successClearModal.body.addClass('mlts-modal-form-inline').append("<p>Success!</p>")

                    successClearModal.footer.append($('<button>').addClass('mlts-modal-submit').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                        successClearModal.hide()
                    }))
                    successClearModal.show()

                    $("text.single-result").text("0")

                    $("#main_table_body").find("tr").remove()
                    noContentMessage()

                })


                resetSearch.on('search:error', function(properties) {

                    var failureClearModal = new Modal('failClear', {
                        title: 'Unable to Clear History',
                        destroyOnHide: true,
                        type: 'wide'
                    });
                    $(failureClearModal.$el).on("hide", function() {
                        // Not taking any action on hide, but you can if you want to!
                    })

                    failureClearModal.body.addClass('mlts-modal-form-inline').append("<p>Failed to Clear History! The query itself is below:</p><pre>" + '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]' + "</pre>")

                    failureClearModal.footer.append($('<button>').addClass('mlts-modal-submit').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                        failureClearModal.hide()
                    }))
                    failureClearModal.show()

                })
                resetSearch.on('search:fail', function(properties) {

                    var failureClearModal = new Modal('failClear', {
                        title: 'Unable to Clear History',
                        destroyOnHide: true,
                        type: 'wide'
                    });
                    $(failureClearModal.$el).on("hide", function() {
                        // Not taking any action on hide, but you can if you want to!
                    })

                    failureClearModal.body.addClass('mlts-modal-form-inline').append("<p>Failed to Clear History! The query itself is below:</p><pre>" + '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]' + "</pre>")

                    failureClearModal.footer.append($('<button>').addClass('mlts-modal-submit').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                        failureClearModal.hide()
                    }))
                    failureClearModal.show()

                })

            }))
            confirmClearModal.show()





        });
        $(".dashboard-export-container").css("display", "none");
        $(".dashboard-view-controls").prepend($("<button style=\"margin-left: 5px;\" class=\"btn\">Print to PDF</button>").click(function() { window.print() }));
        $("#introspectContentLink").click(function() { popModalToLookForEnabledContent() });

    }
);


function doToggle(element) {
    if ($("#expand-" + element).find("i").attr("class") == "icon-chevron-down") {
        $("#description-" + element).css("display", "none")
        $("#expand-" + element).find("i").attr("class", "icon-chevron-right")
    } else {
        $("#description-" + element).css("display", "table-row")
            //$("#row-" + element).after($("#description-" + element))

        $("#expand-" + element).find("i").attr("class", "icon-chevron-down")
            //$("#expand-" + element).find("img")[0].src = $("#expand-" + element).find("img")[0].src.replace("downarrow", "uparrow")
        $("#description-" + element).find("td").css("border-top", 0)
    }

}

function addCustom() {

    var newCustomModal = new Modal('newCustom', {
        title: 'Add Custom Content',
        destroyOnHide: true,
        type: 'wide'
    });
    var dataSources = ""
    var myKeys = Object.keys(window.allDataSources).sort()
    for (var i = 0; i < myKeys.length; i++) {
        if (myKeys[i] != "Other")
            dataSources += '<option value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
    }
    dataSources += '<option value="Other">Other</option>'
    var myBody = $('<div id="addCustomDiv"></div>')
    myBody.append($('<label for="customName">Name</label><input name="customName" id="customName" type="text" />'),
        $('<label for="customJourney">Journey</label><select name="customJourney" id="customJourney"><option value="Stage_1">Stage 1</option><option value="Stage_2">Stage 2</option><option value="Stage_3">Stage 3</option><option value="Stage_4">Stage 4</option><option value="Stage_5">Stage 5</option><option value="Stage_6">Stage 6</option></select>'),
        $('<label for="customStatus">Status</label><select name="customStatus" id="customStatus"><option value="bookmarked">Bookmarked</option><option value="needData">Awaiting Data</option><option value="inQueue">Ready for Deployment</option><option value="issuesDeploying">Deployment Issues</option><option value="needsTuning">Needs Tuning</option><option value="successfullyImplemented">Successfully Implemented</option></select>'),
        $('<label for="customDatasource">Data Source</label><select name="customDatasource" id="customDatasource">' + dataSources + '</select>'),
        $('<label for="customDescription">Description</label><textarea name="customDescription" id="customDescription" />'))

    $(newCustomModal.$el).on("hide", function() {
        // Not taking any action on hide, but you can if you want to!
    })

    newCustomModal.body.addClass('mlts-modal-form-inline').append(myBody)

    newCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
        type: 'button',
        'data-dismiss': 'modal'
    }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
        type: 'button',
        'data-dismiss': 'modal'
    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Add').on('click', function() {

        require([Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js")], function(Telemetry) {
            Telemetry.SendTelemetryToSplunk("bookmarkChange", { "status": "addedCustomEntry" })
        })
        var record = { _time: (new Date).getTime() / 1000, journey: $("#customJourney").val(), showcase_name: $("#customName").val(), status: $("#customStatus").val(), datasource: $("#customDatasource").val(), description: $("#customDescription").val(), user: Splunk.util.getConfigValue("USERNAME") }
        var newkey
        $.ajax({
            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
            type: 'POST',
            contentType: "application/json",
            async: false,
            data: JSON.stringify(record),
            success: function(returneddata) { newkey = returneddata }
        })

        var newObj = new Object()
        newObj.name = "Custom: " + record.showcase_name
        newObj.bookmark_status = record.status
        newObj.datasource = record.datasource
        newObj.journey = record.journey
        newObj._key = newkey
        newObj.description = record.description + "<br />Added on " + (new Date()).toISOString().split('T')[0] + " by " + record.user
        var shortName = newObj.name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
        window.ShowcaseInfo['summaries'][shortName] = newObj
        window.ShowcaseInfo['roles']['default']['summaries'].push(shortName)
        addItem(newObj, shortName)
        updateDataSourceBlock()
    }))
    newCustomModal.show()
}

$("#addCustomLink").click(function() {
    addCustom()
})


function noContentMessage() {
    $("#bottomTextBlock").css("background-color", "white")
    $("#bottomTextBlock").css("text-align", "center")
    $("#bottomTextBlock").html("<h3>No Content Bookmarked</h3><p>Please visit the <a href=\"contents\">Security Content page</a> to view the content in Splunk Security Essentials, and bookmark what you find useful.</p>")
    $("#dataSourcePanel").html("")
}

function contentMessage() {
    $("#bottomTextBlock").html('<div class="printandexporticons"><a href="#" id="printUseCaseIcon" onclick="doPrint(); return false;"><i class="icon-print icon-no-underline" style="font-size: 16pt;" /> Print Page </a>&nbsp;&nbsp;<a href="#" id="downloadUseCaseIcon" onclick="DownloadAllUseCases(); return false;"><i class="icon-export" style="font-size: 16pt;" /> Export Content List </a></div>')
        //$("#bottomTextBlock").css("background-color","#f0f2f3")
    $("#bottomTextBlock").css("background-color", "rgba(0,0,0,0)")
    $("#bottomTextBlock").css("text-align", "right")

}

function addItem(summary, showcaseName) {

    //console.log("Adding Item", summary, showcaseName)

    summary.dashboard = summary.dashboard || ""
    dashboardname = summary.dashboard || ""
    if (dashboardname.indexOf("?") > 0) {
        dashboardname = dashboardname.substr(0, dashboardname.indexOf("?"))
    }
    example = summary.name
        //panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
        //panelEnd =  "</div></div>                    </div>                </div>            </div>        </div>    </div>"
    var demo = ""
    var live = ""
    var accel = ""
    if (1 == 1) {
        exampleText = ""
        exampleList = $('<span></span>')
            //console.log("ShowcaseInfo: New Title", document.title)
        if (typeof summary.examples != "undefined") {
            exampleText = summary.examples.length > 1 ? '<b>Examples:</b>' : '<b>Example:</b>';
            exampleList = $('<ul class="example-list"></ul>');

            summary.examples.forEach(function(example) {
                var showcaseURLDefault = summary.dashboard;
                if (summary.dashboard.indexOf("?") > 0) {
                    showcaseURLDefault = summary.dashboard.substr(0, summary.dashboard.indexOf("?"))
                }

                var url = showcaseURLDefault + '?ml_toolkit.dataset=' + example.name;
                if (example.label == "Demo Data") {
                    demo = example.name
                }
                if (example.label == "Live Data") {
                    live = example.name
                }
                if (example.label == "Accelerated Data") {
                    accel = example.name
                }
                //exampleList.append($('<li></li>').text(example.label));
                exampleList.append($('<li></li>').append($('<a></a>').attr('href', url).attr("target", "_blank").attr("class", "external drilldown-link").append(example.label)));

            });
        }

        // var tablebookmarked = ((summary.bookmark_status == "bookmarked") ? "Yes" : "")
        // var tableawaitingdata = ((summary.bookmark_status == "needData") ? "Yes" : "")
        // var tablereadyfordeploy = ((summary.bookmark_status == "inQueue") ? "Yes" : "")
        // var tabledeploymentissues = ((summary.bookmark_status == "issuesDeploying") ? "Yes" : "")
        // var tableneedstuning = ((summary.bookmark_status == "needsTuning") ? "Yes" : "")
        // var tablesuccess = ((summary.bookmark_status == "successfullyImplemented") ? "Yes" : "")


        var tablebookmarked = '<input type="radio" name="' + showcaseName + '" data-status="bookmarked" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "bookmarked") ? "checked" : "") + '>'
        var tableawaitingdata = '<input type="radio" name="' + showcaseName + '" data-status="needData" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "needData") ? "checked" : "") + '>'
        var tablereadyfordeploy = '<input type="radio" name="' + showcaseName + '" data-status="inQueue" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "inQueue") ? "checked" : "") + '>'
        var tabledeploymentissues = '<input type="radio" name="' + showcaseName + '" data-status="issuesDeploying" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "issuesDeploying") ? "checked" : "") + '>'
        var tableneedstuning = '<input type="radio" name="' + showcaseName + '" data-status="needsTuning" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "needsTuning") ? "checked" : "") + '>'
        var tablesuccess = '<input type="radio" name="' + showcaseName + '" data-status="successfullyImplemented" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" ' + ((summary.bookmark_status == "successfullyImplemented") ? "checked" : "") + '>'
        var tableclose = '<i class="icon-close" style="font-size: 20px;"  name="' + showcaseName + '" data-status="none" data-name="' + showcaseName + '" onclick="radioUpdateSetting(this)" >'

        function radioUpdateSetting(obj) {
            let target = $(obj);
            let newName = ShowcaseInfo['summaries'][target.attr("data-name")]['name'];
            let newStatus = target.attr("data-status");
            // console.log("Setting ", newName, newStatus)
            setbookmarkStatus(newName, newStatus)
        }
        window.radioUpdateSetting = radioUpdateSetting

        var bookmarkWidget = ""


        if (typeof forSearchBuilder == "undefined" || forSearchBuilder != true) {
            bookmarkWidget = '<i class="icon-gear" title="Change Status" onclick=\'createbookmarkBox(this, "' + summary.name + '"); return false;\' style=" height: 16pt; font-size: 20pt;;" />'

            window.createbookmarkBox = function(obj, name) {
                //     console.log("click - Running with", obj, name, obj.outerHTML)




                var boxHTML = $('<div id="box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "") + '" style="background-color: white; position: absolute; border: 1px gray solid; padding: 7px; width: 210px; height: 225px;"></div>').append('<i class="icon-close" onclick="$(this).parent().remove()" style="float: right;"></i>', "<h5 style=\"padding-top: 0px;padding-bottom: 5px; margin: 0; \">Change Status</h5>")
                var unmarkBox = $('<p style="margin: 0; cursor: pointer"> <a href="#" onclick="return false;">Remove from List</a></p>')
                unmarkBox.click(function() {
                    setbookmarkStatus(name, "none")

                    for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
                        if (typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]] != "undefined") {
                            if (ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name.replace(/^Custom: /, "") == name.replace(/^Custom: /, "")) {
                                removeRow(ShowcaseInfo.roles.default.summaries[i])
                            }
                        }
                    }
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var bookmarkedBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Bookmarked</a></p>')
                bookmarkedBox.click(function() {
                    setbookmarkStatus(name, "bookmarked")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tablebookmarked").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var hrBox = $("<hr style=\"margin-top: 10px; margin-bottom: 10px; padding: 0;\" ><h5 style=\"padding-top: 0px;padding-bottom: 5px;margin: 0;\">(Optional) Status Detail</h5>")
                var needDataBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Awaiting Data</a></p>')
                needDataBox.click(function() {
                    setbookmarkStatus(name, "needData")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tableawaitingdata").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var inQueueBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Ready for Deployment</a></p>')
                inQueueBox.click(function() {
                    setbookmarkStatus(name, "inQueue")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tablereadyfordeploy").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var issuesDeployingBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Deployment Issues</a></p>')
                issuesDeployingBox.click(function() {
                    setbookmarkStatus(name, "issuesDeploying")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tabledeploymentissues").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var needsTuningBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Needs Tuning</a></p>')
                needsTuningBox.click(function() {
                    setbookmarkStatus(name, "needsTuning")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tableneedstuning").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })
                var successfullyImplementedBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Successfully Implemented</a></div>')
                successfullyImplementedBox.click(function() {
                    setbookmarkStatus(name, "successfullyImplemented")
                    $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                    $("td:contains(" + name + ")").parent().find(".tablesuccess").text("Yes")
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                    $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                    setTimeout(function() {
                        $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                    }, 1000)
                })

                if (name.indexOf("Custom: ") == 0) {
                    boxHTML.append(bookmarkedBox, hrBox, needDataBox, inQueueBox, issuesDeployingBox, needsTuningBox, successfullyImplementedBox)
                } else {
                    boxHTML.append(unmarkBox, bookmarkedBox, hrBox, needDataBox, inQueueBox, issuesDeployingBox, needsTuningBox, successfullyImplementedBox)
                }
                var pos = $(obj).offset()
                var leftPos = pos.left + 15
                var topPos = pos.top
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
                //     console.log("Adding in boxhtml", boxHTML)
                $("body").append(boxHTML)
                $("#" + 'box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css({ top: topPos, left: leftPos })



            }
            window.setbookmarkStatus = function(name, status, action, confirmed) {
                // console.log("Got the following replacement", name, status, action)
                $("#row-print-" + toHex(name)).html(BookmarkStatus[status])
                if (status == "none") {
                    if (confirmed) {
                        // console.log("Removing", name, $("#main-print-" + toHex(name)))
                        $("#main-print-" + toHex(name)).remove()
                        $("#row-" + toHex(name)).remove()
                    } else {

                        var confirmModal = new Modal('newCustom', {
                            title: 'Confirm Deletion?',
                            destroyOnHide: true
                        });
                        confirmModal.body.append($("<p>Are you sure you want to remove this bookmark?</p><p>" + name + "</p>"))

                        confirmModal.footer.append($('<button>').attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-default').text('Cancel'), $('<button>').attr('data-name', name).attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-primary ').text('Confirm').on('click', function(evt) {

                            setbookmarkStatus($(evt.target).attr("data-name"), "none", "bookmarked_content", true)
                        }))
                        confirmModal.show()
                        return 1;
                    }
                }
                name = name.replace(/^Custom: /, "")

                if (!action) {
                    action = "bookmarked_content"
                }
                require([Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js")], function(Telemetry) {
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
                for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
                    if (typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]] != "undefined") {
                        if (ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name.replace(/^Custom: /, "") == name.replace(/^Custom: /, "")) {
                            ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status = status
                        }
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
                updateDataSourceBlock()
            }




            var rowStatus = "<td style=\"text-align: center\" class=\"tablebookmarked\" id=\"" + toHex(example + "demo") + "\">" + tablebookmarked + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tableawaitingdata\" id=\"" + toHex(example + "live") + "\">" + tableawaitingdata + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tablereadyfordeploy\" id=\"" + toHex(example + "accel") + "\">" + tablereadyfordeploy + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tabledeploymentissues\" id=\"" + toHex(example + "live") + "\">" + tabledeploymentissues + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tableneedstuning\" id=\"" + toHex(example + "accel") + "\">" + tableneedstuning + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tablesuccess\" id=\"" + toHex(example + "accel") + "\">" + tablesuccess + "</td>"
            rowStatus += "<td style=\"text-align: center\" class=\"tableclose\" id=\"" + toHex(example + "close") + "\">" + tableclose + "</td>"


            var description = ""
            if (typeof summary.isCustom == "undefined" || summary.isCustom == false) {
                // This is copied from ProcessSummaryUI


                //var Template = "<div class=\"detailSectionContainer expands\" style=\"display: block; border: black solid 1px; padding-top: 0; \"><h2 style=\"background-color: #F0F0F0; line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\")}else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\")} return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2><div style=\"display: none; padding: 8px;\" id=\"SHORTNAMESection\">"
                var Template = "<table id=\"" + toHex(summary.name) + "SHORTNAME_table\" class=\"dvexpand table table-chrome\"><thead><tr><th class=\"expands\"><h2 style=\"line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#" + toHex(summary.name) + "SHORTNAMESection\").toggle(); if($(\"#" + toHex(summary.name) + "SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#" + toHex(summary.name) + "SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\"); $(\"#" + toHex(summary.name) + "SHORTNAME_table\").addClass(\"expanded\"); $(\"#" + toHex(summary.name) + "SHORTNAME_table\").removeClass(\"table-chrome\");  $(\"#" + toHex(summary.name) + "SHORTNAME_table\").find(\"th\").css(\"border-top\",\"1px solid darkgray\");  }else{$(\"#" + toHex(summary.name) + "SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\");  $(\"#" + toHex(summary.name) + "SHORTNAME_table\").removeClass(\"expanded\");  $(\"#" + toHex(summary.name) + "SHORTNAME_table\").addClass(\"table-chrome\"); } return false;'>&nbsp;&nbsp;<i id=\"" + toHex(summary.name) + "SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2></th></tr></thead><tbody><tr><td style=\"display: none; border-top-width: 0;\" id=\"" + toHex(summary.name) + "SHORTNAMESection\">"

                var areaText = ""
                if (typeof summary.category != "undefined") {
                    areaText = "<p><h2>Category</h2>" + summary.category.split("|").join(", ") + "</p>"
                }
                var usecaseText = ""
                if (typeof summary.category != "undefined") {
                    usecaseText = "<p><h2>Use Case</h2>" + summary.usecase.split("|").join(", ") + "</p>"
                }

                var showSPLText = ""
                var knownFPText = ""
                if (typeof summary.knownFP != "undefined" && summary.knownFP != "") {
                    knownFPText = Template.replace(/SHORTNAME/g, "knownFP").replace("TITLE", "Known False Positives") + summary.knownFP + "</td></tr></table>" // "<h2>Known False Positives</h2><p>" + summary.knownFP + "</p>"
                }

                var howToImplementText = ""
                if (typeof summary.howToImplement != "undefined" && summary.howToImplement != "") {
                    howToImplementText = Template.replace(/SHORTNAME/g, "howToImplement").replace("TITLE", "How to Implement") + summary.howToImplement + "</td></tr></table>" // "<h2>How to Implement</h2><p>" + summary.howToImplemement + "</p>"
                }

                var eli5Text = ""
                if (typeof summary.eli5 != "undefined" && summary.eli5 != "") {
                    eli5Text = Template.replace(/SHORTNAME/g, "eli5").replace("TITLE", "Detailed Search Explanation") + summary.eli5 + "</td></tr></table>" // "<h2>Detailed Search Explanation</h2><p>" + summary.eli5 + "</p>"
                }


                var SPLEaseText = ""
                if (typeof summary.SPLEase != "undefined" && summary.SPLEase != "") {
                    SPLEaseText = "<h2>SPL Difficulty</h2><p>" + summary.SPLEase + "</p>"
                }


                var operationalizeText = ""
                if (typeof summary.operationalize != "undefined" && summary.operationalize != "") {
                    operationalizeText = Template.replace(/SHORTNAME/g, "operationalize").replace("TITLE", "How To Respond") + summary.operationalize + "</td></tr></table>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                }

                var relevance = ""
                if (typeof summary.relevance != "undefined" && summary.relevance != "") {
                    relevance = "<h2>Security Impact</h2><p>" + summary.relevance + "</p>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                }


                var descriptionText = "<h2>Description</h2>" + summary.description // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                var alertVolumeText = "<h2>Alert Volume</h2>"



                //alertVolumeText += "</div></div>"

                //relevance = summary.relevance ? "<p><h2>Security Impact</h2>" +  + "</p>" : ""

                per_instance_help = ""


                panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
                panelEnd = "</div></div>                    </div>                </div>            </div>        </div>    </div>"



                var fullSolutionText = ""
                if (typeof summary.fullSolution != "undefined") {
                    fullSolutionText += "<br/><h2>Relevant Splunk Premium Solution Capabilities</h2><button class=\"btn\" onclick=\"triggerModal(window.fullSolutionText); return false;\">Find more Splunk content for this Use Case</button>"

                }

                var otherSplunkCapabilitiesText = ""

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

                    var DoImageSubtitles = function(numLoops) {
                        if (typeof numLoops == "undefined")
                            numLoops = 1
                        var doAnotherLoop = false
                            //         console.log("Starting the Subtitle..")
                        $(".screenshot").each(function(count, img) {
                            //         console.log("got a subtitle", img)

                            if (typeof $(img).css("width") != "undefined" && parseInt($(img).css("width").replace("px")) > 10 && typeof $(img).attr("processed") == "undefined") {
                                var width = "width: " + $(img).css("width")

                                var myTitle = ""
                                if (typeof $(img).attr("title") != "undefined" && $(img).attr("title") != "") {
                                    myTitle = "<p style=\"color: gray; display: inline-block; clear:both;" + width + "\"><center><i>" + $(img).attr("title") + "</i></center>"

                                }
                                $(img).attr("processed", "true")
                                if (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != "") {
                                    //              console.log("Handling subtitle zoom...", width, $(img).attr("zoomin"), $(img).attr("setWidth"), (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != ""))
                                    if (typeof $(img).attr("setwidth") != "undefined" && parseInt($(img).css("width").replace("px")) > parseInt($(img).attr("setwidth"))) {
                                        width = "width: " + $(img).attr("setwidth") + "px"
                                    }
                                    $(img).replaceWith("<div style=\"display: inline-block; margin:10px; border: 1px solid lightgray;" + width + "\"><a href=\"" + $(img).attr("src") + "\" target=\"_blank\">" + img.outerHTML + "</a>" + myTitle + "</div>")
                                } else {
                                    ($(img)).replaceWith("<div style=\"display: block; margin:10px; border: 1px solid lightgray;" + width + "\">" + img.outerHTML + myTitle + "</div>")
                                }

                            } else {
                                doAnotherLoop = true
                                    //       console.log("Analyzing image: ", $(img).css("width"), $(img).attr("processed"), $(img))
                            }
                        })
                        if (doAnotherLoop && numLoops < 30) {
                            numLoops++;
                            setTimeout(function() { DoImageSubtitles(numLoops) }, 500)
                        }
                    }
                    window.DoImageSubtitles = DoImageSubtitles


                }

                var Stage = "<h2><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + summary.journey.replace(/Stage_/g, "") + "\">" + summary.journey.replace(/_/g, " ") + "</a></h2> "

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
                        var localDescription = datasources[i]
                        datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + localDescription + "</a></div>"
                    }
                    datasourceText += "<br/><br/>"
                }



                var mitreText = ""
                if (typeof summary.mitre != "undefined" && summary.mitre != "") {
                    mitre = summary.mitre.split("|")
                    if (mitre.length > 0 && mitreText == "") {
                        mitreText = "<h2><a href=\"https://attack.mitre.org/wiki/Main_Page\" target=\"_blank\">MITRE ATT&CK</a> Tactics</h2>"
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
                        killchainText = "<h2><a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\" target=\"_blank\">Kill Chain</a> Phases</h2>"
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

                var box1 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 63%; min-width:500px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">' + usecaseText + areaText + relevance + alertVolumeText + SPLEaseText + '</div>'

                var box2 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 33%; min-width:250px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0">' + Stage + mitreText + killchainText + cisText + technologyText + datasourceText + '</div>'
                if (typeof summary.isCustom != "undefined") {
                    box1 = ""
                    box2 = box2.replace(/border[^;"]*/, "").replace(/padding[^;"]*/, "")
                }
                //       console.log("Here was my summary", summary)

                description = panelStart + descriptionText + '<br/><div style=" display: table;">' + box1 + box2 + '</div><br/>' + otherSplunkCapabilitiesText + howToImplementText + eli5Text + YouTubeText + knownFPText + operationalizeText + supportingImagesText + showSPLText + per_instance_help + panelEnd




                // End copied content

            } else {
                description = "<h2>Description</h2><p>" + summary.description + "</p>"
                description += "<h2>Journey Stage</h2><p><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + summary.journey.replace(/\D/g, "") + "\">" + summary.journey.replace(/_/g, " ") + "</a></p>"

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
                        var localDescription = datasources[i]
                        datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + localDescription + "</a></div>"
                    }
                    datasourceText += "<br/><br/>"
                }

                description += datasourceText

                description += '<table class="editCustomUseCaseIcons" style="border: 1px solid #eee"><tr><td><a href="#" style="font-color: #555" onclick="editCustom(\'' + showcaseName + '\'); return false;"><i class="icon-pencil" /> Edit</a></td><td><a href="#" style="font-color: #555" onclick="deleteCustomConfirmation(\'' + showcaseName + '\'); return false;"><i class="icon-close" /> Delete</a></td></tr></table>'
            }
            var linkToExample = "";
            if (typeof summary.dashboard != "undefined") {
                linkToExample = '<a href="' + summary.dashboard + '" class="external drilldown-link" target="_blank"></a>'
            }
            $("#main_table_body").append("<tr  class=\"titleRow\" id=\"row-" + toHex(example) + "\" class=\"dvbanner\"><td class=\"tableexpand\" class=\"downarrow\" id=\"expand-" + toHex(example) + "\"><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\"><i class=\"icon-chevron-right\" /></a></td><td class=\"name\"><div></div><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\">" + summary.name + "</a></td><td style=\"text-align: center\">" + linkToExample /* + "</td><td class=\"tableChangeStatus\" style=\"text-align: center\">" + bookmarkWidget */ + "</td>" + rowStatus + "</tr>")


            $("#main_table_body").append("<tr class=\"descriptionRow\" id=\"description-" + toHex(example) + "\" style=\"display: none;\"><td colspan=\"8\">" + description + "</td></tr>")
            var status_display = BookmarkStatus[summary.bookmark_status]
            var SPL = $("<div class=\"donotbreak\"></div>")
            if (typeof summary.examples == "object" && summary.examples.length > 0) {
                SPL.append("<h2>SPL for " + summary.name + "</h2>")
                for (var i = 0; i < summary.examples.length; i++) {
                    if (typeof examples[summary.examples[i].name] != "undefined") {
                        //SPL += "<div><h3>" + summary.examples[i].label + "</h3>" + examples[ summary.examples[i].name ].linebylineSPL + "</div>"
                        var localexample = $("<div class=\"donotbreak\"></div>").append($("<h3>" + summary.examples[i].label + "</h3>"), $(examples[summary.examples[i].name].linebylineSPL))
                        SPL.append(localexample)
                    }

                }
                //      console.log("Got this result", summary.name, SPL)
            }
            var printableimage = $("")
            if (typeof summary.printable_image != "undefined") {
                printableimage = $("<div class=\"donotbreak\" style=\"margin-top: 15px;\"><h2>Screenshot of Demo Data</h2></div>").append($('<img class="printonly" />').attr("src", summary.printable_image))

            }
            $("#bookmark_printable_table").append($("<div>").attr("id", "main-print-" + toHex(summary.name)).append($("<h1>" + summary.name + "</h1><h2>Status</h2><p id=\"row-print-" + toHex(example) + "\">" + status_display + "</p>" + "<h2>App</h2><p id=\"row-print-" + toHex(example) + "\">" + summary.displayapp + "</p>" + $(description.replace(/display: none/g, "")).find("#contentDescription").html()), SPL, printableimage))
            contentMessage()
        }


    }

}


var JourneyStageNames = ["N/A", "Collection", "Normalization", "Expansion", "Enrichment", "Automation and Orchestration", "Advanced Detection", "Other"]

var prettyDescriptions = {
    "usecase": {
        "Security Monitoring": "The foundation of security, looking for common activities from common malware and attackers.",
        "Advanced Threat Detection": "Focused on detecting advanced persistent threats, experienced and motivated attackers, and nation-state actors.",
        "Compliance": "Provides assistance in ensuring that organizations are implementing all required monitoring for the regulatory environment.",
        "Insider Threat": "Detect internal employees who have gone rogue, and are looking to hurt the company, defraud the company, or steal from customers.",
        "Application Security": "Monitor application logs to detect signs that a web application is being directly attacked."
    }
}

var allFilters = [{ //This is from the list of all filters for the modal, not for the default!
        "fieldName": "journey",
        "displayName": "Journey",
        "type": "search",
        "export": "yes",
        "itemSort": ["Stage_1", "Stage_2", "Stage_3", "Stage_4", "Stage_5", "Stage_6"], //JourneyAdjustment
        "style": "height: 1.75em;",
        "width": "250px",
        "ulStyle": "column-count: 1;",
        "manipulateDisplay": function(label) {
            //console.log("Manipulating label..", label)
            label = label.replace("_", " ")
            if (typeof JourneyStageNames[parseInt(label.replace("Stage ", ""))] != "undefined") {
                label = label + " - " + JourneyStageNames[parseInt(label.replace("Stage ", ""))]
            }
            return label
        },
        "tooltip": "Splunk's Security Journey maps examples to relative technical maturity of a Splunk deployment, letting newcomers focus on the basics and advanced users target their needs."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "usecase",
        "displayName": "Security Use Case",
        "type": "search",
        "export": "yes",
        "itemSort": ["Security Monitoring", "Compliance", "Advanced Threat Detection", "Incident Investigation & Forensics", "Incident Response", "SOC Automation", "Insider Threat", "Fraud Detection", "Application Security", "Other"],
        "style": "height: 1.75em; width: 225px;",
        "headerStyle": "width: 225px",
        "width": "225px",
        "ulStyle": "column-count: 1;",
        "tooltip": "Shows the high level use case of an example."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "category",
        "displayName": "Category",
        "type": "search",
        "export": "yes",
        "style": "width:220px; padding-bottom: 2px; display: inline-block",
        "headerStyle": "width: 240px",
        "width": "240px",
        "ulStyle": "column-count: 1 !important;",
        "tooltip": "Shows the more detailed category of an example."
    }, { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "datasource",
        "displayName": "Data Sources",
        "type": "search",
        "export": "yes",
        "style": "width:250px; padding-bottom: 2px; display: inline-block",
        "headerStyle": "width: 550px",
        "width": "250px",
        "ulStyle": "column-count: 2;",
        "tooltip": "The data sources that power ths use cases. These are mapped to individual technologies."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "highlight",
        "displayName": "Featured",
        "type": "exact",
        "width": "150px",
        "export": "yes",
        "style": " padding-bottom: 2px; width: 150px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "Featured searches are those that come highly recommended by Splunk's Security SMEs."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "alertvolume",
        "displayName": "Alert Volume",
        "type": "exact",
        "width": "120px",
        "export": "yes",
        "itemSort": ["Low", "Medium", "High", "None"],
        "style": "height: 1.75em; display: inline-block; width: 120px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "Shows whether an example is expected to generate a high amount of noise, or should be high confidence. "
    }, { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "domain",
        "displayName": "Domain",
        "type": "exact",
        "export": "yes",
        "style": "height: 1.75em; width: 175px;",
        "width": "175px",
        "ulStyle": "column-count: 1;",
        "tooltip": "What high level area of security does this apply to, such as Endpoint, Access, or Network."
    }, //This is from the list of all filters for the modal, not for the default!
    /*  {//This is from the list of all filters for the modal, not for the default!
          "fieldName": "released",
          "displayName": "Released",
          "type": "exact",
          "width": "180px",
          "style": "height: 1.75em; width: 180px;",
          "ulStyle": "column-count: 1;",
          "tooltip": "A little used filter, shows when the example was first released."
      },//This is from the list of all filters for the modal, not for the default! */
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "mitre",
        "displayName": "Mitre ATT&CK Tactic",
        "type": "search",
        "export": "yes",
        "itemSort": ["Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Execution", "Collection", "Exfiltration", "Command and Control"],
        "style": "height: 1.75em; width: 200px;",
        "headerStyle": "width: 200px;",
        "width": "200px",
        "ulStyle": "column-count: 1;",
        "tooltip": "MITRE’s Adversarial Tactics, Techniques, and Common Knowledge (ATT&CK™) is a curated knowledge base and model for cyber adversary behavior, reflecting the various phases of an adversary’s lifecycle and the platforms they are known to target. ATT&CK is useful for understanding security risk against known adversary behavior, for planning security improvements, and verifying defenses work as expected. <br /><a href=\"https://attack.mitre.org/wiki/Main_Page\">Read More...</a>"
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "killchain",
        "displayName": "Kill Chain Phase",
        "type": "search",
        "width": "200px",
        "export": "yes",
        "itemSort": ["Reconnaissance", "Weaponization", "Delivery", "Exploitation", "Installation", "Command and Control", "Actions on Objective"],
        "style": "height: 1.75em; width: 200px;",
        "headerStyle": "width: 200px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "Developed by Lockheed Martin, the Cyber Kill Chain® framework is part of the Intelligence Driven Defense® model for identification and prevention of cyber intrusions activity. The model identifies what the adversaries must complete in order to achieve their objective. The seven steps of the Cyber Kill Chain® enhance visibility into an attack and enrich an analyst’s understanding of an adversary’s tactics, techniques and procedures.<br/><a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\">Read More...</a>"
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "hasSearch",
        "displayName": "Search Included",
        "type": "exact",
        "export": "yes",
        "width": "180px",
        "style": "height: 1.75em; width: 180px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "This filter will let you include only those searches that come with Splunk Security Essentials (and aren't from Premium Apps)"
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "SPLEase",
        "displayName": "SPL Difficulty",
        "type": "exact",
        "export": "yes",
        "width": "180px",
        "style": "height: 1.75em; width: 180px;",
        "itemSort": ["Basic", "Medium", "Hard", "Advanced", "Accelerated"],
        "ulStyle": "column-count: 1;",
        "tooltip": "If you are using Splunk Security Essentials to learn SPL, you can filter here for the easier or more difficult SPL."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "displayapp",
        "displayName": "Example Source",
        "type": "search",
        "export": "yes",
        "style": " padding-bottom: 2px; width: 300px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "The source of the search, whether it is Splunk Enterprise Security, UBA, or Splunk Security Essentials"
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "advancedtags",
        "displayName": "Advanced",
        "type": "search",
        "width": "180px",
        "style": "height: 1.75em; width: 180px;",
        "ulStyle": "column-count: 1;",
        "tooltip": "A catch-all of several other items you might want to filter on."
    }, //This is from the list of all filters for the modal, not for the default!
    { //This is from the list of all filters for the modal, not for the default!
        "fieldName": "bookmark_display",
        "displayName": "Wish List",
        "type": "search",
        "export": "no",
        "width": "180px",
        "style": "height: 1.75em; width: 180px;",
        "ulStyle": "column-count: 1;",
        "itemSort": ["Not on Wish List", "Waiting on Data", "Ready for Deployment", "Needs Tuning", "Issues Deploying", "Successfully Implemented"],
        "tooltip": "Examples you are tracking"
    } //This is from the list of all filters for the modal, not for the default!
];
window.allFilters = allFilters;



function DownloadAllUseCases() {
    var myDownload = []
    var myCSV = ""
    var myHeader = ["Name", "Description", "Wish List Status"]
    for (var filterCount = 0; filterCount < allFilters.length; filterCount++) {
        if (typeof allFilters[filterCount].export != "undefined" && allFilters[filterCount].export == "yes")
            myHeader.push(allFilters[filterCount].displayName)

    }
    myDownload.push(myHeader)
    myCSV += myHeader.join(",") + "\n"
    for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
        var row = ['"' + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['name'].replace(/"/g, '""') + '"', '"' + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['description'].replace(/"/g, '""').replace(/<br[^>]*>/g, " ") + '"']

        row.push('"' + statusToShowcase(ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['bookmark_status']) + '"')
        for (var filterCount = 0; filterCount < allFilters.length; filterCount++) {
            if (typeof allFilters[filterCount].export != "undefined" && allFilters[filterCount].export == "yes") {
                var line = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]][allFilters[filterCount].fieldName] || "";
                if (allFilters[filterCount].type == "search")
                    line = line.replace(/\|/g, ", ")
                if (typeof allFilters[filterCount].manipulateDisplay != "undefined")
                    line = allFilters[filterCount].manipulateDisplay(line)

                row.push('"' + line.replace(/"/g, '""') + '"')
            }
        }
        myDownload.push(row)
        myCSV += row.join(",") + "\n"
    }
    var filename = "Splunk_Security_Use_Cases.csv"

    var blob = new Blob([myCSV], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

$("#downloadUseCaseIcon").click(function() { DownloadAllUseCases(); return false; })


function statusToShowcase(key) {
    switch (key) {
        case "needData":
            return "Waiting on Data"
            break;
        case "inQueue":
            return "Ready for Deployment"
            break;
        case "bookmarked":
            return "Bookmarked"
            break;
        case "needsTuning":
            return "Needs Tuning"
            break;
        case "issuesDeploying":
            return "Issues Deploying"
            break;
        case "successfullyImplemented":
            return "Successfully Implemented"
            break;
        default:
            return ""
    }
}

function updateDataSourceBlock() {
    var content = new Object()
    var fullcontent = new Object()

    // while we are here, let's also update all of those counts..
    $("text.single-result").text("0")

    for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
        var sources = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].datasource.split(/\|/)
        for (var g = 0; g < sources.length; g++) {
            if (typeof content[sources[g]] == "undefined") {
                content[sources[g]] = $("<ul></ul>")
                fullcontent[sources[g]] = []
            }

            content[sources[g]].append("<li>" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name + "</li>")
            fullcontent[sources[g]].push(ShowcaseInfo.roles.default.summaries[i])
        }
        // while we are here, let's also update all of those counts..
        if (typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].isCustom != "undefined" && ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].isCustom == true)
            $("#customSearches").find("text").text(parseInt($("#customSearches").find("text").text()) + 1)
        if ($("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").length > 0)
            $("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").text(parseInt($("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").text()) + 1)
    }
    //console.log("Full Content!", fullcontent)
    var contentlist = Object.keys(content).sort()
    var final = $("<div class=\"box-for-initial-data-source-boxes\"></div>")
    var tableversion = "<table class=\"table printonly table-chrome\" style=\"\"><thead><tr><th>Data Source</th><th>Use Cases</th><th>Categories</th><th>Description</th></tr></thead><tbody>"

    for (var i = 0; i < contentlist.length; i++) {
        final.append($('<div class="dataSourceBox" id="data-source-' + contentlist[i].replace(/[^a-zA-Z0-9]/g, "") + '" ></div>').append("<b>" + contentlist[i] + "</b>", content[contentlist[i]]))
        var description = fullcontent[contentlist[i]].length + " use cases selected"
        var usecaselist = new Object()
        var usecases = ""
        var categorylist = new Object()
        var categories = ""
        for (var g = 0; g < fullcontent[contentlist[i]].length; g++) {
            var localusecases = ShowcaseInfo.summaries[fullcontent[contentlist[i]][g]].usecase.split("|")
            var localcategories = ShowcaseInfo.summaries[fullcontent[contentlist[i]][g]].category.split("|")
            for (var h = 0; h < localusecases.length; h++) {
                usecaselist[localusecases[h]] = 1
            }
            for (var h = 0; h < localcategories.length; h++) {
                categorylist[localcategories[h]] = 1
            }

        }
        for (var g = 0; g < Object.keys(usecaselist).length; g++) {
            // console.log("Running full content with ", Object.keys(usecaselist)[g ])
            if (usecases != "")
                usecases += "<br />"
            if (typeof prettyDescriptions['usecase'][Object.keys(usecaselist)[g]] != "undefined")
                usecases += Object.keys(usecaselist)[g] + ": " + prettyDescriptions['usecase'][Object.keys(usecaselist)[g]]
            else
                usecases += Object.keys(usecaselist)[g]
        }
        for (var g = 0; g < Object.keys(categorylist).length; g++) {
            // console.log("Running full content with ", Object.keys(categorylist)[g ])
            if (categories != "")
                categories += ", "
            categories += Object.keys(categorylist)[g]
        }

        tableversion += "<tr><td>" + contentlist[i] + "</td><td>" + usecases + "</td><td>" + categories + "</td><td>" + description + "</td></tr>"
    }
    tableversion += "</tbody></table>"
    $("#dataSourcePanel").html($("<div></div>").append($("<div></div>").append($("<h2 class=\"printonly\">Data Sources Required</h2>")).append($(tableversion))).append($("<div></div>").append($("<h2 class=\"printonly\">Use Cases for Data Sources</h2>")).append($(final), $("<div class=\"box-for-data-source-boxes\"></div>"))))
        // console.log("Full Content table version", tableversion)

    function handleBoxLayout() {
        let max_height = 0;
        let objects = []
        let desired_layout_height = 200;
        // box-for-initial-data-source-boxes
        // box-for-data-source-boxes
        let numBoxes = $(".dataSourceBox").length
        for (let i = 0; i < numBoxes; i++) {
            let object = { "height": $($(".dataSourceBox")[i]).height(), "id": $($(".dataSourceBox")[i]).attr("id") }
            objects.push(object)
            if ($($(".dataSourceBox")[i]).height() > max_height) {
                max_height = $($(".dataSourceBox")[i]).height()
            }
        }
        let actual_max_height = Math.max(max_height, desired_layout_height);
        let columns = [$('<div class="data_source_column">')];
        let current_height_calculator = 0;

        for (let i = 0; i < numBoxes; i++) {
            let targetObject = $("#" + objects[i]['id']);
            if (current_height_calculator + targetObject.height() > actual_max_height) {
                columns.push($('<div class="data_source_column">'))
                current_height_calculator = 0;
            }
            current_height_calculator = current_height_calculator + targetObject.height();
            targetObject.detach().appendTo(columns[columns.length - 1])
        }
        for (let i = 0; i < columns.length; i++) {
            $(".box-for-data-source-boxes").append(columns[i])
        }
        //$(".dataSourceBox").css("min-width", "275px").css("width", Math.round(85 / columns.length) + "%")
        $(".data_source_column").css("min-width", "305px").css("width", Math.round(95 / columns.length) + "%")


        // Now to calculate the height


    }
    handleBoxLayout()
}

function deleteCustom(id) {
    if (typeof ShowcaseInfo.summaries[id] != "undefined") {
        //  console.log("Deleting example", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        $.ajax({
            url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom/' + key,
            type: 'DELETE',
            async: true
        })
        removeRow(id)
        updateDataSourceBlock()
    } else {
        //  console.log("Could not find id to delete", id, ShowcaseInfo)
    }
}

function removeRow(id) {
    //console.log("Removing row for", id, ShowcaseInfo.summaries[id],ShowcaseInfo.summaries[id].name, $("td:contains(" + ShowcaseInfo.summaries[id].name + ")"))
    var uiid = $("td:contains(" + ShowcaseInfo.summaries[id].name + ").name").parent().attr("id").replace(/row\-/, "")
    $("#row-" + uiid).remove()
    $("#description-" + uiid).remove()
    if ($("#main_table_body tr").length == 0) {
        noContentMessage()
    }
    delete window.ShowcaseInfo.summaries[id]
    window.ShowcaseInfo.roles.default.summaries.splice(window.ShowcaseInfo.roles.default.summaries.indexOf(id), 1)
}


function editCustom(id) {

    var summary = ShowcaseInfo.summaries[id]
    if (typeof summary != "undefined") {
        //  console.log("Popping edit dialog for id", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        var editCustomModal = new Modal('editCustom', {
            title: 'Edit Custom Content',
            destroyOnHide: true,
            type: 'wide'
        });
        var dataSources = ""
        var myKeys = Object.keys(window.allDataSources).sort()
        for (var i = 0; i < myKeys.length; i++) {
            if (myKeys[i] != summary.datasource) {
                dataSources += '<option value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
            } else {
                dataSources += '<option selected value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
            }
        }

        var stagesSelected = ["", "", "", "", "", "", ""]
        stagesSelected[parseInt(summary.journey.replace(/\D/g, ""))] = "selected "

        var statusSelected = new Object();
        statusSelected['bookmarked'] = statusSelected['needData'] = statusSelected['inQueue'] = statusSelected['issuesDeploying'] = statusSelected['needsTuning'] = statusSelected['successfullyImplemented'] = ""
        statusSelected[summary.bookmark_status] = "selected "

        var myBody = $('<div id="addCustomDiv"></div>')
        myBody.append($('<label for="customName">Name</label><input name="customName" id="customName" type="text" value="' + summary.name.replace(/^Custom: /, "") + '" />'),
            $('<label for="customJourney">Journey</label><select name="customJourney" id="customJourney"><option ' + stagesSelected[1] + 'value="Stage_1">Stage 1</option><option ' + stagesSelected[2] + 'value="Stage_2">Stage 2</option><option ' + stagesSelected[3] + 'value="Stage_3">Stage 3</option><option ' + stagesSelected[4] + 'value="Stage_4">Stage 4</option><option ' + stagesSelected[5] + 'value="Stage_5">Stage 5</option><option ' + stagesSelected[6] + 'value="Stage_6">Stage 6</option></select>'),
            $('<label for="customStatus">Status</label><select name="customStatus" id="customStatus"><option ' + statusSelected['bookmarked'] + 'value="bookmarked">Bookmarked</option><option ' + statusSelected['needData'] + 'value="needData">Awaiting Data</option><option ' + statusSelected['inQueue'] + 'value="inQueue">Ready for Deployment</option><option ' + statusSelected['issuesDeploying'] + 'value="issuesDeploying">Deployment Issues</option><option ' + statusSelected['needsTuning'] + 'value="needsTuning">Needs Tuning</option><option ' + statusSelected['successfullyImplemented'] + 'value="successfullyImplemented">Successfully Implemented</option></select>'),
            $('<label for="customDatasource">Data Source</label><select name="customDatasource" id="customDatasource">' + dataSources + '</select>'),
            $('<label for="customDescription">Description</label><textarea name="customDescription" id="customDescription">' + summary.description + '</textarea>'))

        $(editCustomModal.$el).on("hide", function() {
            // Not taking any action on hide, but you can if you want to!
        })

        editCustomModal.body.addClass('mlts-modal-form-inline').append(myBody)

        editCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Change').on('click', function() {

            //  console.log("Making Changes to id", id, ShowcaseInfo.summaries[id])
            require([Splunk.util.make_full_url("/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js")], function(Telemetry) {
                Telemetry.SendTelemetryToSplunk("bookmarkChange", { "status": "changedCustomEntry" })
            })
            var record = { _time: (new Date).getTime() / 1000, journey: $("#customJourney").val(), showcase_name: $("#customName").val(), status: $("#customStatus").val(), datasource: $("#customDatasource").val(), description: $("#customDescription").val(), user: Splunk.util.getConfigValue("USERNAME") }
            var newkey;
            $.ajax({
                url: $C['SPLUNKD_PATH'] + '/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
                type: 'POST',
                contentType: "application/json",
                async: false,
                data: JSON.stringify(record),
                success: function(returneddata) { newkey = returneddata }
            })
            deleteCustom(id)
            var newObj = new Object()
            newObj.name = "Custom: " + record.showcase_name
            newObj.bookmark_status = record.status
            newObj.datasource = record.datasource
            newObj.journey = record.journey
            newObj._key = newkey
            newObj.description = record.description + "<br />Edited on " + (new Date()).toISOString().split('T')[0] + " by " + record.user
            var shortName = newObj.name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
            window.ShowcaseInfo['summaries'][shortName] = newObj
            window.ShowcaseInfo['roles']['default']['summaries'].push(shortName)
            addItem(newObj, shortName)
            updateDataSourceBlock()
            $("#customSearches").find("text").text(parseInt($("#customSearches").find("text").text()) + 1)
        }))
        editCustomModal.show()
    } else {
        // console.log("Couldn't find id to edit", id, ShowcaseInfo)
    }
}

function doPrint() {
    //$("#main_table_body tr[id]").css("display", "table-row")
    //$(".dvexpand tr").css("display", "table-row")
    //$(".dvexpand td").css("display", "table-cell")

    window.print();
}


function deleteCustomConfirmation(id) {

    var summary = ShowcaseInfo.summaries[id]
    if (typeof summary != "undefined") {
        // console.log("Popping delete confirmation dialog for id", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        var editCustomModal = new Modal('deleteCustom', {
            title: 'Confirm?',
            destroyOnHide: true,
            type: 'wide'
        });
        var myBody = $('<p>Are you sure you want to delete?</p>')

        $(editCustomModal.$el).on("hide", function() {
            // Not taking any action on hide, but you can if you want to!
        })

        editCustomModal.body.addClass('mlts-modal-form-inline').append(myBody)

        editCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Delete').on('click', function() {
            deleteCustom(id)
        }))
        editCustomModal.show()
    } else {
        //  console.log("Couldn't find id to edit", id, ShowcaseInfo)
    }
}


function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

$.when(addingIndividualContent).then(function() {
    // console.log("I got this")

    var newElement = $("#row1").clone().attr("id", "intropage").addClass("printonly")
    newElement.find(".panel-body").html('<!--<h1 class="printonly">Use Case Overview</h1>--><img src="/splunkd/__raw/servicesNS/admin/Splunk_Security_Essentials/static/appIcon_2x.png" style="position: absolute; right: 10px; top: -40px; display: block;" /><div id="intropageblock" style="margin-top: 200px;"><h1>Summary of Bookmarked Content</h1><h2>Prepared ' + formatDate(new Date()) + '</h2><h2 style="margin-top: 200px;">Table of Contents</h3><ol><li>Use Case Overview</li><li>Data Sources</li><li>Use Cases for Data Sources</li><li>Content Detail<ul id="usecasetoc"></ul></li></ol> </div>')
    newElement.insertBefore("#row1")

    $("#bookmark_printable_table").find("h1").each(function(count, obj) {
        //   console.log("Adding", $(obj).html())
        $("#usecasetoc").append("<li>" + $(obj).html() + "</li>")
    })
    $("#row1").addClass("breakbeforethis")



})


// Work in Progress...
function addUseCase() {

    // Now we initialize the Modal itself
    var myModal = new Modal("addExisting", {
        title: "Bookmark Additional Content",
        backdrop: 'static',
        keyboard: false,
        destroyOnHide: true,
        type: 'normal'
    });

    $(myModal.$el).on("show", function() {

    })
    myModal.body
        .append($("<p>").text("Would you like to bookmark out-of-the-box Splunk content that already exists in Splunk Security Essentials, or would you like to add a new custom piece of content?"), $('<button class="btn btn-primary">').text("Out-of-the-box Splunk Content").click(function(evt) {
            let target = $(evt.target)
            let body = target.closest(".modal-body")
            $.ajax({
                    url: $C['SPLUNKD_PATH'] + '/services/SSEShowcaseInfo?locale=' + window.localeString,
                    async: true,
                    success: function(ShowcaseInfo) {
                        body.html("")
                        body.append('<link rel="stylesheet" type="text/css" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">');
                        body.append('<script src="//code.jquery.com/ui/1.12.1/jquery-ui.js">');

                        setTimeout(function() {
                            let listOfExistingBookmarkedContent = []
                            let existingTDs = $("td.name");
                            for (let i = 0; i < existingTDs.length; i++) {
                                listOfExistingBookmarkedContent.push($(existingTDs[i]).find("a").text())
                            }
                            // console.log("Got my existing content", listOfExistingBookmarkedContent)
                            window.ShowcaseInfo = ShowcaseInfo
                            body.append("<input class=\"useCasesDropdown\">")
                            let Items = [];
                            for (let myShowcaseName in ShowcaseInfo['summaries']) {
                                if (listOfExistingBookmarkedContent.indexOf(ShowcaseInfo['summaries'][myShowcaseName]['name']) == -1) {
                                    Items.push(ShowcaseInfo['summaries'][myShowcaseName]['name'])
                                }
                            }
                            window.dvtest = Items;
                            body.find(".useCasesDropdown").autocomplete({ source: Items })
                        }, 1000)
                    }
                })
                // open OOTB Content Modal
        }), $('<button class="btn">').text("Custom Content").click(function(evt) {
            // open OOTB Content Modal
        }));

    myModal.footer.append($('<button>').attr({
        type: 'button',
        'data-dismiss': 'modal'
    }).addClass('btn btn-primary').text('Close').on('click', function() {
        // Not taking any action here
    }))
    myModal.show(); // Launch it!
}


function loadSPL() {
    $.ajax({
        url: Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_simple_search.json'),
        async: true,
        success: function(returneddata) {
            var objects = Object.keys(returneddata)
            for (var i = 0; i < objects.length; i++) {
                examples[objects[i]] = returneddata[objects[i]]
                examples[objects[i]].file = "showcase_simple_search"
                examples[objects[i]].searchString = examples[objects[i]].value
                examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
                var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
                if (typeof examples[objects[i]].description != "undefined" && linebylineSPL.length > 0) {
                    var myTable = "<table class=\"linebylinespl\">"
                    for (var g = 0; g < linebylineSPL.length; g++) {
                        myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                    }
                    myTable += "</table>"
                    examples[objects[i]].linebylineSPL = myTable
                }
            }
        }
    });
    $.ajax({
        url: Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_standard_deviation.json'),
        async: true,
        success: function(returneddata) {
            var objects = Object.keys(returneddata)
            for (var i = 0; i < objects.length; i++) {
                examples[objects[i]] = returneddata[objects[i]]
                examples[objects[i]].file = "showcase_standard_deviation"
                examples[objects[i]].searchString = examples[objects[i]].value + '\n| stats count as num_data_samples max(eval(if(_time >= relative_time(now(), "-1d@d"), \'$outlierVariableToken$\',null))) as \'$outlierVariableToken$\' avg(eval(if(_time<relative_time(now(),"-1d@d"),\'$outlierVariableToken$\',null))) as avg stdev(eval(if(_time<relative_time(now(),"-1d@d"),\'$outlierVariableToken$\',null))) as stdev by \'$outlierVariableSubjectToken$\' \n| eval upperBound=(avg+stdev*$scaleFactorToken$) \n | where \'$outlierVariableToken$\' > upperBound'
                examples[objects[i]].searchString = examples[objects[i]].searchString.replace(/\$outlierVariableToken\$/g, examples[objects[i]].outlierVariable).replace(/\$outlierVariableSubjectToken\$/g, examples[objects[i]].outlierVariableSubject).replace(/\$scaleFactorToken\$/g, examples[objects[i]].scaleFactor).replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n\s*/g, "\n")
                examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
                var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
                if (typeof examples[objects[i]].description != "undefined" && linebylineSPL.length > 0) {
                    examples[objects[i]].description.push("calculate the mean, standard deviation and most recent value", "Calculate the upper boundary (X standard deviations above the average)", "Filter where where the most recent result is above the upper boundary")
                    var myTable = "<table class=\"linebylinespl\">"
                    for (var g = 0; g < linebylineSPL.length; g++) {
                        myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                    }
                    myTable += "</table>"
                    examples[objects[i]].linebylineSPL = myTable
                }



            }
        }
    });

    $.ajax({
        url: Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_first_seen_demo.json'),
        async: true,
        success: function(returneddata) {
            var objects = Object.keys(returneddata)
            for (var i = 0; i < objects.length; i++) {
                examples[objects[i]] = returneddata[objects[i]]
                examples[objects[i]].file = "showcase_first_seen_demo"
                examples[objects[i]].searchString = examples[objects[i]].value + '\n| stats earliest(_time) as earliest latest(_time) as latest  by $outlierValueTracked1Token$, $outlierValueTracked2Token$ \n| where earliest >= relative_time(now(), \"-1d@d\")'
                examples[objects[i]].searchString = examples[objects[i]].searchString.replace(/\$outlierValueTracked1Token\$/g, examples[objects[i]].outlierValueTracked1).replace(/\$outlierValueTracked2Token\$/g, examples[objects[i]].outlierValueTracked2).replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n\s*/g, "\n")
                examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
                var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
                if (typeof examples[objects[i]].description != "undefined" && linebylineSPL.length > 0) {
                    examples[objects[i]].description.push("Here we use the stats command to calculate what the earliest and the latest time is that we have seen this combination of fields.", "Now we look to see if the earliest time we saw this event was in the last day (aka, brand new).")
                    var myTable = "<table class=\"linebylinespl\">"
                    for (var g = 0; g < linebylineSPL.length; g++) {
                        myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                    }
                    examples[objects[i]].linebylineSPL = myTable
                    myTable += "</table>"
                        //     console.log("I got this:", examples[objects[i]].linebylineSPL)
                }
            }
        }
    });
}