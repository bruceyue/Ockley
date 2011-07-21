/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Manages a jQuery UI collection of buttons.
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

    Ockley.Toolbar = Backbone.View.extend({

        toolBar: null,

        initialize: function() {
            _.bindAll(this, "render");
        },

        render: function() {
            log('Toolbar - render');

            if (this.toolBar == null){
                if (this.options.buttons != null){
                    var eventsMgr = this.options.eventsMgr;
                    $.each(this.options.buttons, function(index, btn){

                        if (btn.hasOwnProperty('selector') &&
                            btn.hasOwnProperty('icon')){
                            $( btn.selector ).button({
                                    text: false,
                                    icons: {
                                        primary: btn.icon
                                    }
                            }).click(function(){
                                if (btn.hasOwnProperty('name')){
                                    if (eventsMgr != null){
                                        eventsMgr.trigger(btn.name);
                                    }
                                }
                            });
                        }
                    });
                }
            }

            return this;
        }

    });


}).call(this);