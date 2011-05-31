/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
function DocAccordion(elemId, options){

    var _accordion = $(elemId);
    var _documents = {};
    var _settings = $.extend({
        documentClicked: null
    }, options);

    _accordion.accordion({
        collapsible: true,
        active: false,
        fillSpace: true,
        changestart: function(event, ui){
            var url = null;

            var header = $(ui.newHeader);
            var headerTitle = header.text();
            var content = $(ui.newContent);
            content.empty();
            var docs = _documents[headerTitle];
            if (docs != null){
                var list = $("<ul></ul>");
                var listItem;
                var link;

                $.each(docs, function(index, doc){
                    listItem = $("<li></li>");
                    link = $("<a href='#' id='" + doc.id + "'>" + doc.name +"</a>");
                    link.data("header", header);
                    listItem.append(link);
                    list.append(listItem);
                });
                content.append(list);
            }
            _accordion.accordion("resize");
        }
    });

    //add an empty documents object for each header
    var headers = $(_accordion.accordion( "option", "header" ));
    headers.each(function(index, header){
        _documents[header.text()] = {};
    });
    headers = null;


    var links = $('#accordion div.ui-accordion-content a');
    links.die();
    links.live('click', function(){
        if (_settings.documentClicked && $.isFunction(_settings.documentClicked)){
            var link = $(this);
            var header = link.data('header');
            var headerTitle = header.text();
            _settings.documentClicked.call(this, headerTitle, link);
        }
    });

    this.getDocuments = function(header){
        if (!_documents.hasOwnProperty(header)){
            return null;
        }
        return _documents[header];
    };

    this.setDocuments = function(header, docs){
        _documents[header] = docs;
    };

    this.appendDocuments = function(header, newDocs){
        var docs = this.getDocuments(header);
        if (docs == null){
            docs = {};
        }
        var id;
        $.each(newDocs, function(index, doc){
            id = doc.id;
            if (id){
                if (docs.hasOwnProperty(id)){
                    $.extend(docs[id], doc);
                }
                else{
                    docs[id] = doc;
                }
            }
        });
        this.setDocuments(header, docs);
    };
}
