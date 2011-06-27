/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Manages a jQuery UI tabs set.
Creates CodeMirror Editor tabs.
 */

function EditorTabs(elemId) {
    var _tabSet = $(elemId);
    var _resized = false;

    _tabSet.tabs({
        closable: true,
        closableClick: function(event, ui) {
                //prevent closing of the "new" tab
                return ('#tabs-new' !== $(ui.tab).attr('href'));
            }
    }).find(".ui-tabs-nav").sortable({ axis: "x" });


    function removeCloseButton(tabId){
        //remove the close button from a tab
        var tabIcon = _tabSet.find('a[href='+ tabId + ']').next('a');
        if (tabIcon.has('span.ui-icon')){
            tabIcon.hide();
        }
    }

    function getTab(tabId){
        return _tabSet.find('a[href=' + tabId + ']');
    }

    function getTabs(){
        return _tabSet.find('ul.ui-tabs-nav li a');
    }

    function getTabCount() {
        return _tabSet.tabs("length");
    }

    function getSelectedTab(){
        return _tabSet.find('ul.ui-tabs-nav li.ui-tabs-selected a');
    }

    function refreshEditor(tab, resize){
        if (resize || _resized){
            resizeAll();
        }
        var editor = tab.data('editor');
        if (editor != null) {
            editor.refresh();
        }
    }

    function resizeAll(){
        _resized = true;
        var w = _tabSet.innerWidth() - 6;
        var h = _tabSet.innerHeight() - 6;
        var tabsNav = _tabSet.find('.ui-tabs-nav');
        h -= tabsNav.outerHeight();

        _tabSet.find('.ui-tabs-panel, .editorContainer, .CodeMirror, .CodeMirror-scroll').width(w).height(h);
    }

    function select(tabId){
        _tabSet.tabs("select", tabId);
    }

    /* public */
    this.setSelected = function(tabId) {
        select(tabId);
    };

    this.getSelected = function() {
        return getSelectedTab().attr('href');
    };

    this.findByData = function(key, value){
        return getTabs().map( function(index, elem) {
            var tab = $(this);
            if(tab.data(key) === value){
                return tab.attr('href');
            }
        });
    };

    this.getData = function(tabId, key){
      return getTab(tabId).data(key);
    };

    this.setData = function(tabId, key, value){
      getTab(tabId).data(key, value);
    };

    this.getEditor = function(tabId){
        if (tabId == null){
            tabId = this.getSelected();
        }
        return getTab(tabId).data('editor');
    };

    this.refresh = function(resize){
      var tab = getSelectedTab();
      refreshEditor(tab, resize);
    };

    this.createNew = function(options) {

        var settings = $.extend({
            title: "Untitled",
            text: null,
            data: null,
            mode: 'apex'
        }, options);

        var totalTabs = getTabCount();
        var index = totalTabs - 1;
        var id = "#tabs-" + totalTabs;
        _tabSet.tabs("add", id, settings.title, index);

        //Note: tabs are links which have hrefs pointing to the tabpanels
        var tab = getTab(id);

        var tabPanel = _tabSet.find(id);

        var content = $("<div class='editorContainer'><textarea class='editor' ></textarea></div>");
        tabPanel.append(content);

        var txt = tabPanel.find(".editor:first")[0];
        var editor = CodeMirror.fromTextArea(txt, {
            lineNumbers: true,
            value: txt.value,
            height: "auto",
            mode: settings.mode,
            indentUnit: 2,
            indentWithTabs: false,
            tabMode: "shift",
            enterMode: "keep",
            electricChars: false,
            onCursorActivity: function() {
                //highlight the line that the cursor is on
                var currentLine = editor.ockley.currentLineNumber;
                var cursorLine = editor.getCursor().line;
                if (currentLine != cursorLine){
                    editor.setLineClass(currentLine, null);
                    editor.ockley.currentLineNumber = cursorLine;
                    editor.setLineClass(cursorLine, "ui-state-highlight");
                }

            }
        });

        //initialize line highlighting
        if (!editor.hasOwnProperty('ockley')){
            editor.ockley = {}
        }
        if (!editor.ockley.hasOwnProperty('currentLineNumber')){
            editor.ockley.currentLineNumber = 0;
        }
        editor.setLineClass(0, "ui-state-highlight");

        //fancy corners
        tabPanel.find('.CodeMirror').addClass('ui-corner-all');

        if (settings.text != null){
            editor.setValue(settings.text);
        }

        var data = settings.data;
        if (data != null){
            for (var key in data){
                if (data.hasOwnProperty(key)){
                    tab.data(key, data[key]);
                }
            }
        }
        tab.data('editor', editor);

        select(index);

    };

    _tabSet.bind("tabsselect", { createNew : this.createNew },
        function(event, ui) {
            var tab = $(ui.tab);
            switch (tab.attr('href')) {
                case '#tabs-new':
                    event.data.createNew();
                    return false;
                    break;
                default:
                    refreshEditor(tab);
                    break;
            }
            return true;
    });

    setTimeout(function(){
        removeCloseButton('#tabs-new');
    }, 0);

}