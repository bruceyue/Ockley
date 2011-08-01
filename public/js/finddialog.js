/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

 Creates a find dialog and manages its state
 */
(function(){

    var Ockley = namespace("Ockley");

    // Make sure we have both backbone and jQuery
    if (this.Backbone === 'undefined' ||  this.jQuery === 'undefined'){
        throw new Error('Backbone and jQuery are required!');
    }

    Ockley.FindDialog = function(options){

        var settings = $.extend({
            dialogElemSelector: '',
            findTextSelector: '',
            caseSensitiveSelector: '',
            "eventsMgr": null
        }, options);

        var dialogOptions = {
            autoOpen: false,
            resizable: false,
            title: 'Find',
            buttons: {
                "Previous" : findPrevious,
                "Next" : findNext
            },
            close: onCloseDialog,
            width: 400
        };

        var _dlg = $(settings.dialogElemSelector).dialog(dialogOptions);

        var _findState = {
            query: '',
            isCaseSensitive: false,
            changed: false
        };

        function getQueryText(){
            return _dlg.find(settings.findTextSelector).val();
        }
        function setQueryText(text){
            _dlg.find(settings.findTextSelector).val(text);
        }

        function isCaseSensitive(){
            return _dlg.find(settings.caseSensitiveSelector).is(':checked');
        }

        function find(findPrevious){
            var query = getQueryText();
            var caseSensitive = isCaseSensitive();
            if (_findState.query != query ||
                _findState.isCaseSensitive != caseSensitive){
                _findState.query = query;
                _findState.isCaseSensitive = caseSensitive;
                _findState.changed = true;
            }
            if (findPrevious){
                if (settings.eventsMgr != null){
                    settings.eventsMgr.trigger('findPrevious', _findState);
                }
            }
            else{
                if (settings.eventsMgr != null){
                    settings.eventsMgr.trigger('findNext', _findState);
                }
            }
        }

        function findPrevious(){
            find(true);
        }

        function findNext(){
            find(false);
        }

        function onCloseDialog(event, ui){
            if (settings.eventsMgr != null){
                settings.eventsMgr.trigger('findClose', _findState);
            }
        }

        this.show = function(text){
            setQueryText(text);
            _dlg.dialog('open');
            return this;
        };

        this.hide = function(){
            _dlg.dialog('close');
            return this;
        };
    };

}).call(this);