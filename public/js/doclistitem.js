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

    var DocListItem = {

         tagName: "li",
         className: "",
         template: $.template( 'DocumentLinkTemplate', $('#docLinkTemplate') ),
         events: {
             "click a": "open"
         },
         initialize: function() {
             _.bindAll(this, "render");
             this.model.bind('change', this.render);
         },
         render: function() {
             log('DocListItem - render');
             $.tmpl( "DocumentLinkTemplate", {
                 'name' : this.model.get('name'),
                 'id'   : this.model.get('id')
             } ).appendTo( this.el );
             return this;
         },
         open: function() {

             log('DocListItem: open');

             //go get the doc contents
             //this will trigger a change event that all the views will receive
             //they can then re-render their content
             this.model.fetch();
         }
     };

     Ockley.ApexDocListItem = Backbone.View.extend(_.extend({}, DocListItem));

     Ockley.VisualforceDocListItem = Backbone.View.extend(_.extend({}, DocListItem));


}).call(this);