/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
module.exports = {
  title: function() {
    return this._data.title || "No Title";
  },
  loggedIn: function(){
    return this._data.loggedIn || "false";
  }
};
