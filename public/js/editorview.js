/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

(function(){

    // Save a reference to the global object.
    var root = this;

    // The top-level namespace. All public Ockley classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Ockley;
    if (typeof exports !== 'undefined') {
        Ockley = exports;
    } else {
        if (root.Ockley == null){
            root.Ockley = {};
        }
        Ockley = root.Ockley;
    }

    // Make sure we have both backbone and jQuery
    if (root.Backbone === 'undefined' ||  root.jQuery === 'undefined'){
        throw new Error('Backbone and jQuery are required!');
    }

    var Editor = {

    };

    Ockley.EditorView = Backbone.View.extend({

        tabs: null,
        tabId: null,
        tabPanel: null,
        editor: null,

        defaults: {
            mode: 'apex'
        },

        events: {
             "undo": "undo"
        },

        initialize: function(){
            _.bindAll(this, "render", "undo", "redo", "isSelectedView");
            this.model.bind('change', this.render);
            if (this.options.hasOwnProperty("tabs")){
                this.tabs = this.options.tabs;
            }
            if (this.options.hasOwnProperty("eventsMgr")){
                this.options.eventsMgr.bind("undo", this.undo);
                this.options.eventsMgr.bind("redo", this.redo);
            }

        },

        isSelectedView: function() {
            return (this.tabs.getSelected() == this.tabId );
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