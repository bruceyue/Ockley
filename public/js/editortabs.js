/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

EditorTabs class
Manages a jQuery UI tabs set.
Creates CodeMirror Editor tabs.
 */

function EditorTabs(elemId) {
    var _tabSet = $(elemId);

    _tabSet.tabs().find(".ui-tabs-nav").sortable({ axis: "x" });

    _tabSet.bind("tabsselect", { createNew : this.createNew },
        function(event, ui) {
            var tab = $(ui.tab);
            switch (tab.attr('href')) {
                case '#tabs-new':
                    event.data.createNew();
                    return false;
                    break;
                default:
                    var editor = tab.data('editor');
                    if (editor != null) {
                        editor.refresh();
                    }
                    break;
            }
            return true;
    });

    function getTab(tabId){
        return _tabSet.find('a[href=' + tabId + ']');
    }

    function getTabs(){
        return _tabSet.find('ul.ui-tabs-nav li a');
    }

    function getTabCount() {
        return _tabSet.tabs("length");
    }


    /* public */
    this.setSelected = function(tabId) {
        _tabSet.tabs("select", tabId);
    };

    this.getSelected = function() {
        return _tabSet.find('ul.ui-tabs-nav li.ui-tabs-selected a').attr('href');
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

    this.getEditor = function(tabId){
        return getTab(tabId).data('editor');
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
            mode: settings.mode
        });
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

        this.setSelected(index);
    };

}