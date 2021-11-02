define(["jquery","underscore","splunkjs/mvc","views/shared/results_table/renderers/BaseCellRenderer"],function(d,b,e,a){var c=a.extend({canRender:function(f){return(d.inArray(f.field,["title","response","response_time","average"])>=0)},render:function(l,f){l.addClass(f.field);var g=null;if(f.field=="response"){parsed_values=/([0-9]+)([ ](.*))?/i.exec(f.value);if(parsed_values!==null){response=parsed_values[1];has_expected_string=parsed_values[3];f.value=response;if(has_expected_string==="true"){f.value+=" (content matches)";l.addClass("contentmatch")}else{if(has_expected_string==="false"){f.value+=" (content doesn't match)";l.addClass("contentnonmatch")}}var k=parseInt(response,10);if(k>=400){l.addClass("failure");g="alert"}else{if(has_expected_string==="false"){l.addClass("failure");g="alert"}else{if(k>=100){l.addClass("success");g="check"}else{l.addClass("failure");g="alert"}}}}else{l.addClass("failure");g="alert"}}else{if(f.field=="response_time"||f.field=="average"){var j=parseFloat(f.value,10);if(j>=1000){l.addClass("failure");g="alert"}else{l.addClass("success");var h=0;if(j<=100){h=0}else{if(j<=250){h=25}else{if(j<=500){h=50}else{if(j<=750){h=75}else{if(j<=1000){h=100}else{h=null}}}}}if(h!==null){l.html(b.template('<i class="stopwatch-icon-<%- percent %>" /> <%- value %>',{value:f.value,percent:h}));l.addClass("response-"+h);return}}}else{if(f.field=="url"){var i=function(n){var m=document.createElement("a");m.href=n;return m};l.html(b.template('<img height="16" width="16" src="http://www.google.com/s2/favicons?domain=<%- domain %>" /> <%- value %>',{value:f.value,domain:i(f.value).hostname}));return}}}if(g!=null){l.html(b.template('<i class="icon-<%- icon %>"> </i><%- value %>',{value:f.value,icon:g}))}else{l.html(f.value)}}});return c});