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

    //Generic Document List
    var DocList = {

        parse: function(response) {
            var ret = [];
            $.each(response.records, function(index, record){
                ret.push( Ockley.Doc.parseOne(record) );
            });
            return ret;
        }
    };

    //Apex Document List
    //Note: url gets all apex documents
    Ockley.ApexDocList = Backbone.Collection.extend(_.extend({

        model: Ockley.ApexDoc,
        url:  '/apex.json'
    }, DocList));

    //Visualforce Document List
    //Note: url gets all vf documents
    Ockley.VisualforceDocList = Backbone.Collection.extend(_.extend({

        model: Ockley.VisualforceDoc,
        url:  '/vf.json'
    }, DocList));

}).call(this);