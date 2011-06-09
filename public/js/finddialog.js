/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

 Creates a find dialog and manages its state
 */
function FindDialog( options){

    var settings = $.extend({
        getEditor: null,
        dialogElemSelector: '',
        findTextSelector: '',
        foundTextClassName: '',
        caseSensitiveSelector: ''
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

    function getQueryText(){
        return _dlg.find(settings.findTextSelector).val();
    }
    function setQueryText(text){
        _dlg.find(settings.findTextSelector).val(text);
    }

    function isCaseSensitive(){
        return _dlg.find(settings.caseSensitiveSelector).is(':checked');
    }

    function getEditor(){
        var editor = null;
        if (settings.getEditor != null && $.isFunction(settings.getEditor)){
            editor = settings.getEditor.apply(this, []);

            if (!editor.hasOwnProperty('ockley')){
                editor.ockley = {}
            }

            if (!editor.ockley.hasOwnProperty('findState')){
                editor.ockley.findState = {
                        cursor: null,
                        query: '',
                        isCaseSensitive: false
                    };
            }
        }
        return editor;
    }

    function find(findPrevious){
        var editor = getEditor();
        if (editor != null){
            var query = getQueryText();
            var caseSensitive = isCaseSensitive();
            var findState = editor.ockley.findState;
            if (findState.cursor == null ||
                findState.query != query ||
                findState.isCaseSensitive != caseSensitive){
                findState.query = query;
                findState.isCaseSensitive = caseSensitive;
                findState.cursor = editor.getSearchCursor(query, null, !caseSensitive);
            }
            var ret = false;
            if (findPrevious){
                ret = findState.cursor.findPrevious();
            }
            else{
                ret = findState.cursor.findNext();
            }
            if (ret){
                editor.markText(findState.cursor.from(), findState.cursor.to(), settings.foundTextClassName);
                editor.setCursor(findState.cursor.from());
            }
        }
    }

    function findPrevious(){
        log('find prev');
        find(true);
    }

    function findNext(){
        log('find next');
        find(false);
    }

    function onCloseDialog(event, ui){
        //when the dialog is closed, remove the foundText class for anything that was found
        var editor = getEditor();
        if (editor){
            $(editor.getWrapperElement()).find('.' + settings.foundTextClassName).removeClass(settings.foundTextClassName);
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
}