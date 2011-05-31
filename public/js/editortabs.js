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

    _tabSet.bind("tabsselect", {createNewTab : this.createNewTab}, function(event, ui) {
                var tab = $(ui.tab);
                switch (tab.attr('href')) {
                    case '#tabs-new':
                        event.data.createNewTab();
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

    function createNewEditor(tab, tabPanel) {
        var content = $("<div class='editorContainer'><textarea class='editor' ></textarea></div>");
        tabPanel.append(content);

        var txt = tabPanel.find(".editor:first")[0];
        var editor = CodeMirror.fromTextArea(txt, {
            lineNumbers: true,
            value: txt.value,
            height: "auto",
            mode: "apex"
        });
        $('.CodeMirror').addClass('ui-corner-all');
        tab.data('editor', editor);
        return editor;
    }

    this.getTabCount = function() {
        return _tabSet.tabs("length");
    };

    //tabs are links which have hrefs pointing to the tabpanels
    function getTab(tabId){
        var id = $.trim(tabId);
        if (id.indexOf('#') !== 0){
            id = '#' + id;
        }
        return _tabSet.find('a[href=' + id + ']');
    }

    //tabpanels are divs which have ids equal to the href of the tab
    function getTabPanel(tabId){
        var id = $.trim(tabId);
        if (id.indexOf('#') !== 0){
            id = '#' + id;
        }
        return _tabSet.find(id);
    }

    function getTabs(){
        return _tabSet.find('ul.ui-tabs-nav li a');
    }

    this.outerHeight = function() {
        return _tabSet.outerHeight();
    };

    /*
    this.getSelectedTabIndex = function() {
        return _tabSet.tabs('option', 'selected');
    };
    */

    this.setSelectedTab = function(id) {
        _tabSet.tabs("select", id);
    };

    this.setTabTitle = function(tabId, text) {
        getTab(tabId).find('span:first').text(text);
    };

    this.getTabTitle = function(tabId) {
        return getTab(tabId).find('span:first').text();
    };

    this.setTabData = function(tabId, key, value){
        getTab(tabId).data(key, value);
    };

    this.getTabData = function(tabId, key){
        return getTab(tabId).data(key);
    };

    this.findTabData = function(key, value){
        return getTabs().map( function(index, elem) {
            var tab = $(this);
            if(tab.data(key) === value){
                return tab.attr('href');
            }
        });
    };

    this.createNewTab = function() {

        var totalTabs = this.getTabCount();
        var id = "tabs-" + totalTabs;

        _tabSet.tabs("add", '#' + id, "Untitled", totalTabs - 1);

        var editor = createNewEditor(getTab(id), getTabPanel(id));

        this.setSelectedTab(id);

        return {
            "tabId": id,
            "editor": editor
        };
    };

}