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

    Ockley.MessageDialog = function(options){

        var settings = $.extend({
            dialogElemSelector: '',
            message: '',
            "eventsMgr": null
        }, options);

        var dialogOptions = {
            autoOpen: false,
            resizable: false,
            closeText: '',
            close: onCloseDialog,
            open: onOpenDialog,
        };

        var _dlg = $(settings.dialogElemSelector).dialog(dialogOptions);

        //no titlebar
        _dlg.prev(".ui-dialog-titlebar").hide();

        if (settings.message != null){
            setMessage(settings.message);
        }

        function setMessage(msg){
            _dlg.find('p').text(msg);
        }
        
        function onOpenDialog(event, ui){
            if (settings.eventsMgr != null){
                settings.eventsMgr.trigger('msgOpen');
            }
        }

        function onCloseDialog(event, ui){
            if (settings.eventsMgr != null){
                settings.eventsMgr.trigger('msgClose');
            }
        }


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
            setMessage(msg);
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