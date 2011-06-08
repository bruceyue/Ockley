/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
module.exports = {
  stylesheets: function() {
    return ["js/libs/codemirror/lib/codemirror.css",
            "js/libs/codemirror/mode/xml/xml.css",
            "js/libs/codemirror/mode/css/css.css",
            "js/libs/codemirror/mode/javascript/javascript.css",
            "css/editor.css",
            "css/apex.css"];
  },
  scripts: function(){
    return ["js/libs/codemirror/lib/codemirror.js",
            "js/libs/codemirror/mode/htmlmixed/htmlmixed.js",
            "js/libs/codemirror/mode/xml/xml.js",
            "js/libs/codemirror/mode/css/css.js",
            "js/libs/codemirror/mode/javascript/javascript.js",
            "js/apex.js",
            "js/editortabs.js",
            "js/docaccordion.js",
            "js/messagedialog.js",
            "js/finddialog.js"];
  }
};

