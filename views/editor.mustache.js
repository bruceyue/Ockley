/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
module.exports = {
  stylesheets: function() {
    return ["//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css",
            "libs/codemirror/lib/codemirror.css",
            "libs/codemirror/mode/xml/xml.css",
            "libs/codemirror/mode/css/css.css",
            "libs/codemirror/mode/javascript/javascript.css",
            "css/editor.css",
            "css/apex.css"];
  },
  scripts: function(){
    return ["libs/underscore/underscore-min.js",
            "libs/backbone/backbone.js",
            "//ajax.aspnetcdn.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js",
            "//ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js",
            "libs/ui.tabs.closable/ui.tabs.closable.min.js",
            "libs/jquery.ui.selectmenu.js",
            "libs/codemirror/lib/codemirror.js",
            "libs/codemirror/mode/htmlmixed/htmlmixed.js",
            "libs/codemirror/mode/xml/xml.js",
            "libs/codemirror/mode/css/css.js",
            "libs/codemirror/mode/javascript/javascript.js",
            "js/apex.js",
            "js/messagedialog.js",
            "js/finddialog.js",
            "js/toolbar.js",
            "js/doc.js",
            "js/doclist.js",
            "js/doclistitem.js",
            "js/editortabs.js",
            "js/editorview.js"];
  }
};

