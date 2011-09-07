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

    Ockley.EditorView = Backbone.View.extend({

        tabs: null,
        tabId: null,
        tabPanel: null,
        editor: null,
        foundTextClassName: 'foundText',

        defaults: {
            mode: 'apex'
        },

        events: {
             "undo": "undo"
        },

        initialize: function(){
            _.bindAll(this, "render", "undo", "redo", "save", "isSelectedView", "find", "findNext", "findPrevious", "findOpen", "findClose");
            this.model.bind('change', this.render);
            if (this.options.hasOwnProperty("tabs")){
                this.tabs = this.options.tabs;
            }
            if (this.options.hasOwnProperty("eventsMgr")){
                this.options.eventsMgr.bind("undo", this.undo);
                this.options.eventsMgr.bind("redo", this.redo);
                this.options.eventsMgr.bind("findNext", this.findNext);
                this.options.eventsMgr.bind("findPrevious", this.findPrevious);
                this.options.eventsMgr.bind("findOpen", this.findOpen);
                this.options.eventsMgr.bind("findClose", this.findClose);
                this.options.eventsMgr.bind("save", this.save );
            }

        },

        isSelectedView: function() {
            return (this.tabs.getSelected() == this.tabId );
        },

        find: function(findState, next){
            if (findState.changed || findState.cursor == null){
                findState.cursor = this.editor.getSearchCursor(findState.query, null, !findState.caseSensitive);
                findState.changed = false;
            }
            var ret = false;
            if (next){
                ret = findState.cursor.findNext();
            }
            else{
                ret = findState.cursor.findPrevious();
            }
            if (ret){
                this.editor.markText(findState.cursor.from(), findState.cursor.to(), this.foundTextClassName);
                this.editor.setCursor(findState.cursor.from());
            }
        },

        findNext: function(findState){
            if (this.isSelectedView()){
                this.find(findState, true);
            }
        },

        findPrevious: function(findState){
            if (this.isSelectedView()){
                this.find(findState, false);
            }
        },  

        findOpen: function( findState ){
            if (this.isSelectedView()){
                //when the dialog is opened, place the currently selected text (if any) in the query box
                findState.query = this.editor.getSelection() || "";
            }
        },

        findClose: function( findState ){
            if (this.isSelectedView()){
                //when the dialog is closed, remove the foundText class for anything that was found
                $(this.editor.getWrapperElement()).find('.' + this.foundTextClassName).removeClass(this.foundTextClassName);
                findState.cursor = null;
            }
        },

        undo: function() {
          if (this.isSelectedView()){
              if (this.editor != null){
                  this.editor.undo();
              }
          }
        },

        redo: function() {
          if (this.isSelectedView()){
              if (this.editor != null){
                  this.editor.redo();
              }
          }
        },

        save: function() {
          if (this.isSelectedView()){
              if (this.editor != null){
              	
              	var eventsMgr = null;
              	
              	if (this.options.hasOwnProperty("eventsMgr")){
              		eventsMgr = this.options.eventsMgr;
              	}
              	
              	if (eventsMgr != null){
					eventsMgr.trigger('saving');
  				}
              	
              	this.model.save(
              		{   
              			'content' : this.editor.getValue() 
              		}, 
              		{   
              			success: function(model, response){
              				if (eventsMgr != null){
	              				var ret = Ockley.getSfResult(response);
    	          				if (ret.success){
        	      					eventsMgr.trigger('saved');
            	  				}
              					else {
	              					eventsMgr.trigger('saveError', ret.data || ret);
              					}
              				}
              			}, 
              			error: function(model, response){
              				if (eventsMgr != null){
              					eventsMgr.trigger('saveError', response);
              				}
              			}
              		}
              	);
              }
          }
        },


        render: function(){
            log('EditorView render');
            if (this.editor == null){
                var title = this.model.get("name");
                var ret = this.tabs.createNew({ 'title' : title });
                this.tabId = ret.tabId;
                this.tabPanel = ret.tabPanel;

                var content = $("<div class='editorContainer'><textarea class='editor' ></textarea></div>");
                this.tabPanel.append(content);

                var txt = this.tabPanel.find(".editor:first")[0];
                var e = this.editor = CodeMirror.fromTextArea(txt, {
                    lineNumbers: true,
                    value: txt.value,
                    height: "auto",
                    mode: this.options.mode,
                    indentUnit: 2,
                    indentWithTabs: false,
                    tabMode: "shift",
                    enterMode: "keep",
                    electricChars: false,
                    onCursorActivity: function() {
                        //highlight the line that the cursor is on
                        var currentLine = e.ockley.currentLineNumber;
                        var cursorLine = e.getCursor().line;
                        if (currentLine != cursorLine){
                            e.setLineClass(currentLine, null);
                            e.ockley.currentLineNumber = cursorLine;
                            e.setLineClass(cursorLine, "ui-state-highlight");
                        }

                    }
                });

                //initialize line highlighting
                if (!e.hasOwnProperty('ockley')){
                    e.ockley = {}
                }
                if (!e.ockley.hasOwnProperty('currentLineNumber')){
                    e.ockley.currentLineNumber = 0;
                }
                e.setLineClass(0, "ui-state-highlight");

                //fancy corners
                this.tabPanel.find('.CodeMirror').addClass('ui-corner-all');

                e.setValue(this.model.get("content"));

            }
            else{
                this.editor.refresh();
            }
        }
    });


}).call(this);