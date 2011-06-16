/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
module.exports = {
  stylesheets: function() {
    return ["//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/smoothness/jquery-ui.css",
            "libs/codemirror/lib/codemirror.css",
            "libs/codemirror/mode/xml/xml.css",
            "libs/codemirror/mode/css/css.css",
            "libs/codemirror/mode/javascript/javascript.css",
            "css/editor.css",
            "css/apex.css"];
  },
  scripts: function(){
    return ["//ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js",
            "libs/codemirror/lib/codemirror.js",
            "libs/codemirror/mode/htmlmixed/htmlmixed.js",
            "libs/codemirror/mode/xml/xml.js",
            "libs/codemirror/mode/css/css.js",
            "libs/codemirror/mode/javascript/javascript.js",
            "js/apex-1.min.js",
            "js/editortabs-1.min.js",
            "js/docaccordion-1.min.js",
            "js/messagedialog-1.min.js",
            "js/finddialog-1.min.js"];
  }
};

