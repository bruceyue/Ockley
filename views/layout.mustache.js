module.exports = {
  title: function() {
    return this._data.title || "No Title";
  },
  loggedIn: function(){
    return this._data.loggedIn || "false";
  }
};
