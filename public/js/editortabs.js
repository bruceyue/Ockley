/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Manages a jQuery UI tabs set.
 */

(function(){

    var Ockley = namespace("Ockley");

    // Make sure we have both backbone and jQuery
    if (this.Backbone === 'undefined' ||  this.jQuery === 'undefined'){
        throw new Error('Backbone and jQuery are required!');
    }

    Ockley.EditorTabs = function(settings) {

        if (settings == null){
            throw Error('Settings are required!');
        }
        if (!settings.hasOwnProperty('tabsSelector')){
            throw Error('tabsSelector setting is required!');
        }

        /*
        if (!settings.hasOwnProperty('newTabSelector')){
            throw Error('newTabSelector setting is required!');
        }
        */

        var _tabSet = $(settings.tabsSelector);

        _tabSet.tabs({
            closable: true,
            closableClick: function(event, ui) {
                    //prevent closing of the "new" tab
                    //return (settings.newTabSelector !== $(ui.tab).attr('href'));

                    return true;
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
            //var index = Math.max(totalTabs - 1, 0);
            var id = settings.tabsSelector + totalTabs;
            var title = options ? options.title: "Untitled";
            _tabSet.tabs("add", id, title, []);

            select(totalTabs);

            //Note: tabs are links which have hrefs pointing to the tabpanels
            //var tab = getTab(id);

            var tabPanel = _tabSet.find(id);

            return { "tabId" : id, "tabPanel" : tabPanel };

        };

        _tabSet.bind("tabsselect", { createNew : this.createNew },
            function(event, ui) {
                var tab = $(ui.tab);
                switch (tab.attr('href')) {
                    /*
                    case settings.newTabSelector:
                        event.data.createNew();
                        return false;
                        break;
                    */
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

}).call(this);