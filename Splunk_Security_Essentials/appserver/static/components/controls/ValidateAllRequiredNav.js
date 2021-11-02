require(['jquery', 'splunkjs/mvc/simplexml/ready!'], function($){

    $.ajax({
        url: $C['SPLUNKD_PATH'] + "/servicesNS/nobody/Splunk_Security_Essentials/data/ui/nav/default",

        type: 'GET',
        success: function(data) {
            if($(data).find("[name='eai:data']").text().indexOf("beta_overview") == -1){
                var newNav = $(data).find("[name='eai:data']").text().replace(/<view name="data_source_check" \/>/, '<view name="data_source_check" />\n            <collection label="Beta">\n                <view name="beta_overview" />\n                <divider />\n                <view name="data_inventory" />\n                <view name="content_overview" />\n                <view name="mitre_overview" />\n                <view name="kill_chain_overview" />\n              </collection>')
                var data = {
                    "eai:data": newNav
                };
                //           console.log("Moving forward with this new nav", newNav, data)
                $.ajax({
                    url: $C['SPLUNKD_PATH'] + "/servicesNS/nobody/Splunk_Security_Essentials/data/ui/nav/default",
                    data: data,
                    type: 'POST',
                    success: function(data) {
                        // Eh, sit around
    
                    },
                    error: function(data, error) {
                        // Error Handling? We don't need no stinkin' error handling!
                    }
                });
            }
        },
        error: function(data, error) {
            //      console.error("Error!", data, error);
        }
    });
})