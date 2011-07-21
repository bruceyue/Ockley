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

    // Generic Document
    Ockley.Doc = {

        defaults: {
            content: "",
            lastModified: null,
            name: ""
        },

        initialize: function(){
        },

        parseOne: function(record){
            return {
                "name" : record.Name,
                "id" : record.Id,
                "content" : record.Body || record.Markup,
                "lastModified" : record.LastModifiedDate
            };
        },

        parse: function(response) {
            var ret = response,
                records = response.records,
                len = records.length;

            if (records != null && len > 0){
                ret = this.parseOne(records[0]);
            }

            return ret;
        }
    };

    //Apex Document
    //Note: url gets a specific doc
    Ockley.ApexDoc = Backbone.Model.extend(_.extend({

        defaults: {
            docType: "apex"
        },

        url: function() {
            return "/apex/" + this.get('id') + '.json';
        }

    }, Ockley.Doc) );

    //Visualforce Document
    //Note: url gets a specific doc
    Ockley.VisualforceDoc = Backbone.Model.extend(_.extend({

        defaults: {
            docType: "vf"
        },

        url: function() {
            return "/vf/" + this.get('id') + '.json';
        }
    }, Ockley.Doc) );

}).call(this);