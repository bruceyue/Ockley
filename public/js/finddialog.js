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
    var _findText = _dlg.find(settings.findTextSelector);
    var _findCursor = null;

    function getEditor(){
        if (settings.getEditor != null && $.isFunction(settings.getEditor)){
            return settings.getEditor.apply(this, []);
        }
        return null;
    }

    function find(findPrevious){
        var editor = getEditor();
        if (editor != null){
            var query = _findText.val();
            if (_findCursor == null){
                _findCursor = editor.getSearchCursor(query)
            }
            var ret = false;
            if (findPrevious){
                ret = _findCursor.findPrevious();
            }
            else{
                ret = _findCursor.findNext();
            }
            if (ret){
                editor.markText(_findCursor.from(), _findCursor.to(), settings.foundTextClassName);
                editor.setCursor(_findCursor.from());
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
        _findText.val(text);
        _dlg.dialog('open');
        return this;
    };

    this.hide = function(){
        _dlg.dialog('close');
        return this;
    };
}