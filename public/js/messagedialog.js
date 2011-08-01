/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function(){

    var Ockley = namespace("Ockley");

    // Make sure we have both backbone and jQuery
    if (this.Backbone === 'undefined' ||  this.jQuery === 'undefined'){
        throw new Error('Backbone and jQuery are required!');
    }


    Ockley.MessageDialog = function(elemId){

        var options = {
            autoOpen: false,
            resizable: false,
            closeText: ''
        };
        var _dlg = $(elemId).dialog(options);
        _dlg.prev(".ui-dialog-titlebar").hide();

        this.show = function(msg, showOk){
            this.setMessage(msg);
            this.showOk(showOk);
            _dlg.dialog('open');
            return this;
        };

        this.hide = function(){
            _dlg.dialog('close');
            return this;
        };

        this.setMessage = function(msg){
            _dlg.find('p').text(msg);
            return this;
        };

        this.showOk = function(show){
            var btns = {};
            if (show){
                btns["Ok"] = function() { _dlg.dialog("close"); };
            }
            _dlg.dialog( "option", "buttons", btns );
        };
    };

}).call(this);