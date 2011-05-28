/**
 * Created by JetBrains WebStorm.
 * User: matthewpage
 * Date: 5/23/11
 * Time: 11:33 AM
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
  stylesheets: function() {
    return ["js/libs/codemirror/lib/codemirror.css", "js/libs/codemirror/mode/javascript/javascript.css", "css/editor.css"];
  },
  scripts: function(){
    return ["js/libs/codemirror/lib/codemirror.js", "js/libs/codemirror/mode/javascript/javascript.js"];
  }
};

