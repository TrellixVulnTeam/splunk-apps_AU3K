'use strict';


require(
    [
        'jquery',
        'underscore',
        'backbone',
        "splunk.util",
        'app/Splunk_Security_Essentials/components/controls/Modal'

    ],
    function(
        $,
        _,
        Backbone,
        splunkUtil,
        Modal
    ) {
        $("#data_inventory").click(function() {
            window.location.href = "data_inventory";
        })

        $("#analytics_advisor").click(function() {
            window.location.href = "content_overview";
        })
        $("#enabled_content").click(function() {

            // Now we initialize the Modal itself
            var myModal = new Modal("addExisting", {
                title: "Enabled Content",
                backdrop: 'static',
                keyboard: false,
                destroyOnHide: true,
                type: 'normal'
            });

            $(myModal.$el).on("show", function() {

            })
            let body = '<p>There are two ways to tell Splunk Security Essentials what content is enabled:<ol><li>If you use Enterprise Security (ES) and this search head is your main ES search head with active correlation searches, you can go directly to the Bookmarked Content page and launch the "Mark Already-Enabled Content" link in the gray box. It will look for any ES or ESCU content based on the search name, or with the exact matching SPL (it will find SSE searches with exact SPL matches as well).</li><li>For everyone else, go to the main Security Contents dashboard and you can mark what content is enabled by clicking on the <img src="' + Splunk.util.make_full_url('/static/app/Splunk_Security_Essentials/images/general_images/notenabled.png') + '" style="height: 16px;" /> checkmark icon.</li><ol></p>'
            myModal.body
                .append(body);

            myModal.footer.append($('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text('Close').on('click', function() {
                // Not taking any action here
            }), $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text("Bookmarked Content").on('click', function() {
                window.location.href = "bookmarked_content"
            }), $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn ').text("Security Contents").on('click', function() {
                window.location.href = "contents"
            }))
            myModal.show(); // Launch it!
        })

    })