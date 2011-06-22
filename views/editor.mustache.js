/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
module.exports = {
  stylesheets: function() {
    return [/*"//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/smoothness/jquery-ui.css",*/
            "//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css",
            /*"css/Aristo/jquery-ui-1.8.7.custom.css",*/
            "libs/codemirror/lib/codemirror.css",
            "libs/codemirror/mode/xml/xml.css",
            "libs/codemirror/mode/css/css.css",
            "libs/codemirror/mode/javascript/javascript.css",
            "css/editor.css",
            "css/apex.css"];
  },
  scripts: function(){
    return ["//ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js",
            "libs/ui.tabs.closable/ui.tabs.closable.min.js",
            "libs/codemirror/lib/codemirror.js",
            "libs/codemirror/mode/htmlmixed/htmlmixed.js",
            "libs/codemirror/mode/xml/xml.js",
            "libs/codemirror/mode/css/css.js",
            "libs/codemirror/mode/javascript/javascript.js",
            "js/apex.js",
            "js/editortabs.js",
            "js/docaccordion.js",
            "js/messagedialog.js",
            "js/finddialog.js",
            "js/toolbar.js"];
  }
};

