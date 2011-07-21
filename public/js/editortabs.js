/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Manages a jQuery UI tabs set.
 */

function EditorTabs(elemId) {
    var _tabSet = $(elemId);

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

    this.createNew = function(options) {

        var totalTabs = getTabCount();
        var index = totalTabs - 1;
        var id = "#tabs-" + totalTabs;
        _tabSet.tabs("add", id, options.title, index);

        select(index);

        //Note: tabs are links which have hrefs pointing to the tabpanels
        //var tab = getTab(id);

        var tabPanel = _tabSet.find(id);

        return { "tabId" : id, "tabPanel" : tabPanel };

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
                    //TODO - refresh tabs?
                    //refreshEditor(tab);
                    break;
            }
            return true;
    });

    setTimeout(function(){
        removeCloseButton('#tabs-new');
    }, 0);

}