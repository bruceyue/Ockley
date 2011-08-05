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

        var _tabSet = $(settings.tabsSelector);
        var _tabsAutoNumber = 0;

        _tabSet.tabs({
            closable: true,
            closableClick: function(event, ui) {
                    if (settings.hasOwnProperty('eventsMgr')){
                        settings.eventsMgr.trigger('tabClose', $(ui.tab));
                    }

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

        function getSelectedTab(){
            return _tabSet.find('ul.ui-tabs-nav li.ui-tabs-selected a');
        }


        function select(tabId){
            _tabSet.tabs("select", tabId);
        }

        /* public */
        this.getTabCount = function() {
            return _tabSet.tabs("length");
        };


        this.setSelected = function(tabId) {
            select(tabId);
        };

        this.getSelected = function() {
            return getSelectedTab().attr('href');
        };

        this.createNew = function(options) {

            var totalTabs = this.getTabCount();
            var id = '#editorTab' + _tabsAutoNumber++;
            var title = options ? options.title: "Untitled";
            _tabSet.tabs("add", id, title);

            select(totalTabs);

            var tabPanel = _tabSet.find(id);
            var ret = { "tabId" : id, "tabPanel" : tabPanel };

            if (settings.hasOwnProperty('eventsMgr')){
                settings.eventsMgr.trigger('tabOpen', ret);
            }

            return ret;

        };

        _tabSet.bind("tabsselect", { createNew : this.createNew },
            function(event, ui) {
                //var tab = $(ui.tab);
                return true;
        });
    }

}).call(this);