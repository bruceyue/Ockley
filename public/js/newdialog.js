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

    Ockley.NewDialog = function(options){

        var settings = $.extend({
            dialogElemSelector: '',
            "eventsMgr": null
        }, options);

        var options = {
            autoOpen: false,
            resizable: false,
            title: 'New',
             buttons: {
                "Ok" : function(){
                    var selected = $(this).find('input').filter(":checked");
                    var name = $(this).find('#nameText').val();
                    if (selected.size() > 0){
                        if (settings.eventsMgr != null){
                            settings.eventsMgr.trigger('newDocument', selected.val(), name);
                        }
                    }

                    $(this).dialog("close");
                },
                "Cancel" : function() { $(this).dialog("close"); }
            },
            width: 400
        };
        var _dlg = $(settings.dialogElemSelector).dialog(options);
    };

}).call(this);