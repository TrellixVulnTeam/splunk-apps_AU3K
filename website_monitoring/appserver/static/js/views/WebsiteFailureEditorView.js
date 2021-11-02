define(["underscore","backbone","splunkjs/mvc","jquery","splunkjs/mvc/simplesplunkview","models/SplunkDBase","collections/SplunkDsBase","splunkjs/mvc/simpleform/input/text","splunkjs/mvc/simpleform/input/dropdown","splunkjs/mvc/utils","util/splunkd_utils"],function(m,l,e,g,j,f,b,h,c,k,d){var a=f.extend({initialize:function(){f.prototype.initialize.apply(this,arguments)}});var i=b.extend({url:"/admin/macros?count=-1",initialize:function(){f.prototype.initialize.apply(this,arguments)}});return j.extend({className:"WebsiteFailureEditorView",apps:null,defaults:{},initialize:function(){this.options=m.extend({},this.defaults,this.options);options=this.options||{};this.already_rendered=false;this.response_time_macro=null;this.response_code_macro=null},loadMacrosIntoForm:function(){if(e.Components.getInstance("response-threshold-input")!==null){e.Components.getInstance("response-threshold-input").val(this.response_time_macro.entry.content.attributes.definition)}if(e.Components.getInstance("response-code-input")!==null){e.Components.getInstance("response-code-input").val(this.response_code_macro.entry.content.attributes.definition)}},events:{"click #save":"save","click #open-settings-modal":"clickOpenModal"},getMacro:function(n){var o=jQuery.Deferred();if(this.app_name===null||this.app_name===undefined){this.app_name=k.getCurrentApp()}macro=new a();macro.fetch({url:d.fullpath("/servicesNS/nobody/"+this.app_name+"/admin/macros/"+n),success:function(r,p,q){console.info("Successfully retrieved the macro");o.resolve(r)}.bind(this),error:function(){o.reject();console.warn("Unable to retrieve the macro")}.bind(this)});return o},setMacroDefinition:function(n,o){g.when(this.getMacro(n)).then(function(p){p.entry.content.set({definition:o},{silent:true});return p.save()}).done(function(){})},saveMacroModel:function(o,n){o.entry.content.set({definition:n},{silent:true});return o.save()},getControls:function(){return'<div class="controls" style="margin-top: 12px"><a href="#" class="btn btn-primary" id="save" style="display: inline;">Save</a></div>'},getModalTemplate:function(o,n){return'<div tabindex="-1" id="threshold-modal" class="modal fade in hide"><div class="modal-header"><button type="button" class="close btn-dialog-close" data-dismiss="modal">x</button><h3 class="text-dialog-title">'+o+'</h3></div><div class="modal-body form form-horizontal modal-body-scrolling">'+n+'</div><div class="modal-footer"><a href="#" class="btn btn-dialog-cancel" data-dismiss="modal" style="display: inline;">Close</a><a href="#" class="btn btn-primary" id="save" style="display: inline;">Save</a> </div></div>'},makeInputTemplate:function(n,p,o){return'<div id="'+p+'-control-group" class="control-group">	<label class="control-label">'+n+'</label>		<div class="controls">			<div style="display: inline-block;" class="input" id="'+p+'" />			<span class="hide help-inline"></span>			<span class="help-block"> '+o+"</span>		</div></div>"},getInputTemplate:function(){return'<div style="display:none" id="warning_message_dialog"><div class="alert alert-error"><i class="icon-alert"></i><span id="warning_message"></span></div></div><div style="display:none" id="success_message_dialog"><div class="alert alert-info"><i class="icon-alert"></i><span id="success_message"></span></div></div><span id="settings_form"><div>You define what you want to consider an outage below. These settings will also apply to the <a class="external" target="external" href="alert?s=%2FservicesNS%2Fnobody%2Fwebsite_monitoring%2Fsaved%2Fsearches%2FWebsite%2520Performance%2520Problem">alert search</a> that provides notifications of outages.</div><div style="margin-bottom: 16px">.</div><div class="input" id="response-threshold-input"><label>Response Time Threshold (in milliseconds)</label></div><div style="margin-top: 24px" class="input" id="response-code-input"><label>Response Codes Considered Failures</label></div></span>'},showSuccessMessage:function(n){this.hideMessage();g("#success_message_dialog",this.$el).show();g("#success_message",this.$el).text(n)},showFailureMessage:function(n){this.hideMessage();g("#warning_message_dialog",this.$el).show();g("#warning_message",this.$el).text(n)},hideMessage:function(){g("#success_message_dialog",this.$el).hide();g("#warning_message_dialog",this.$el).hide()},validate:function(){var n=this.getValidationMessage();if(n===true){this.hideMessage()}else{this.showFailureMessage(n)}},getValidationMessage:function(){var n=0;if(!/([0-9])+$/gi.test(e.Components.getInstance("response-threshold-input").val())){return"The threshold is not valid (must be a integer greater than zero)"}return n===0},startRendering:function(){var n=[this.getMacro("response_time_threshold"),this.getMacro("response_codes_to_alert_on")];g.when.apply(g,n).done(function(o,p){this.response_code_macro=p;this.response_time_macro=o;this.completeRender()}.bind(this))},render:function(){this.startRendering()},completeRender:function(){if(!this.already_rendered){if(this.response_time_macro.entry.acl.attributes.can_write&&this.response_code_macro.entry.acl.attributes.can_write){var o='<a id="open-settings-modal" href="#">Modify the definition of a failure</a>';o=o+this.getModalTemplate("Failure Definition",this.getInputTemplate());this.$el.html(o);var p=new h({id:"response-threshold-input",searchWhenChanged:false,el:g("#response-threshold-input",this.$el)},{tokens:false}).render();p.on("change",function(q){this.validate()}.bind(this));var n=new c({id:"response-code-input",searchWhenChanged:false,el:g("#response-code-input",this.$el),choices:[{label:"400 and 500 response codes",value:"response_code>=400"},{label:"500 response codes",value:"response_code>=500"},{label:"400 and 500 response codes, but not 404",value:"(response_code>=400 AND response_code!=404)"},{label:"300, 400 and 500 response codes",value:"response_code>=300"}]},{tokens:false}).render();n.onInputReady=function(){};p.onInputReady=function(){};this.loadMacrosIntoForm()}else{this.$el.html("")}this.already_rendered=true}return this},clickOpenModal:function(){this.showModal()},showModal:function(){this.render();this.hideMessage();g("#threshold-modal",this.$el).modal()},showSaving:function(n){if(typeof n==="undefined"){n=true}if(n){g("#save",this.$el).prop("disabled",false);g("#save",this.$e).addClass("disabled")}else{g("#save",this.$el).removeProp("disabled");g("#save",this.$e).removeClass("disabled")}},save:function(){this.showSaving();g.when(this.saveMacroModel(this.response_time_macro,e.Components.getInstance("response-threshold-input").val())).then(this.saveMacroModel(this.response_code_macro,e.Components.getInstance("response-code-input").val())).done(function(){this.showSaving(false);g("#threshold-modal",this.$el).modal("hide")}.bind(this)).fail(function(){this.showSaving(false);this.showFailureMessage("Configuration could not be changed")}.bind(this))}})});