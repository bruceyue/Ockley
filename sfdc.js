/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

module.exports = function(options){

    var https = require('https');
    var sax = require('./node_modules/sax');
    var utils = require('./utils.js')();

    var settings = {
        oAuthPublicKey: '',
        oAuthPrivateKey: '',
        oAuthCallbackURI: ''
    };
    utils.extend(settings, options);

    settings.oAuthUrl = 'https://login.salesforce.com/services/oauth2/authorize?display=touch&response_type=code&client_id=' + settings.oAuthPublicKey + '&redirect_uri=' + settings.oAuthCallbackURI;
    settings.oAuthSandboxUrl = 'https://test.salesforce.com/services/oauth2/authorize?display=touch&response_type=code&client_id=' + settings.oAuthPublicKey + '&redirect_uri=' + settings.oAuthCallbackURI;


    function parseResults(xmlString, tagNames, options){

        var _parser = new sax.parser(false, { lowercasetags: true, trim:true });
        var _options = options;
        var _tags = [];
        var _results = [];
        var _tagNames = tagNames;

        function inArray( elem, array ) {
            if ( array.indexOf ) {
                return array.indexOf( elem );
            }
            for ( var i = 0, length = array.length; i < length; i++ ) {
                if ( array[ i ] === elem ) {
                    return i;
                }
            }
            return -1;
        }

        var isMatch = function(tag){
            return (inArray(tag, _tagNames) > -1);
        };

        var pushTag = function(tag){
            _tags.push({ name: tag.name });
        };

        var popTag = function(){
            if (_tags.length){
                var t = _tags.pop();
                var len = _tags.length;
                if (len){
                    _tags[len - 1][t.name] = t;
                }
                else{
                    _results.push(t);
                }
            }
        };

        _parser.onopentag = function(tag) {
            if (_tags.length || isMatch(tag.name)){
                pushTag(tag);
            }
        };
        _parser.onclosetag = function(tagName) {
            popTag();
        };
        _parser.ontext = function(text) {
            var len = _tags.length;
            if (len){
                _tags[len - 1].text = text;
            }
        };
        _parser.onerror = function(err) {
            var onError = _options.onError;
            if (onError){
                while(_tags.length){
                    popTag();
                }
                onError.call(this, err, _results);
            }

        };
        _parser.onend = function() {
            var onSuccess = _options.onSuccess;
            if (onSuccess){
                onSuccess.call(this, _results);
            }
        };

        _parser.write(xmlString);
        _parser.close();
    }

    function getAccessToken(token, callbacks) {

        var post_data = 'code=' + token + '&grant_type=authorization_code&client_id=' + settings.oAuthPublicKey + '&redirect_uri=' + escape(settings.oAuthCallbackURI) + '&client_secret=' + settings.oAuthPrivateKey;

        var options = {
            host: 'login.salesforce.com',
            path: '/services/oauth2/token',
            method: 'POST',
            headers: {
                'host': 'login.salesforce.com',
                'Content-Length': post_data.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept':'application/jsonrequest',
                'Cache-Control':'no-cache,no-store,must-revalidate'
            }
        };

        var req = https.request(options,
                function(res) {

                    var data = '';
                    res.setEncoding('utf8');
                    res.on('data', function(chunk) {
                      data += chunk;
                    });

                    res.on('end', function(d) {
                        if (callbacks && callbacks.hasOwnProperty('onSuccess')){
                            callbacks.onSuccess.apply(this, [JSON.parse(data)]);
                        }
                    });

                }).on('error', function(e) {
                    if (callbacks && callbacks.hasOwnProperty('onError')){
                            callbacks.onError.apply(this, [e]);
                    }
                });

        req.write(post_data);
        req.end();
    }

    this.getOAuthRequestToken = function(url, callbacks) {

        var tokenURL = unescape(url);
        var requestToken = escape(tokenURL.substring(tokenURL.indexOf("code=") + 5, tokenURL.length));
        getAccessToken(requestToken, callbacks);
    };

    this.query = function(requestUrl, accessToken, query, options){

        var url = utils.parseUrl(requestUrl);

        var headers = {
            'Host': url.host,
            'Authorization': 'OAuth ' + accessToken
        };

        var path = "/" + url.path + '?q=' + encodeURIComponent(query);
        var reqOpts = {
            host: url.host,
            port: 443,
            path: path,
            method: 'GET',
            headers: headers
        };

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  data += chunk;
              });
              res.on('end', function(){
                  if (res.statusCode == '200'){
                      if (options.onSuccess){
                        options.onSuccess.apply(this, [data]);
                      }
                  }
                  else{
                      if (options.onError){
                        options.onError.apply(this, [data]);
                      }
                  }
              });
        });
        req.on('error', function(error){
            if (options.onError){
                options.onError.apply(this, [error]);
            }
        });

        req.end();
    };

    this.update = function(requestUrl, accessToken, sObjectTypeName, sObjectId, record, options){

        var url = utils.parseUrl(requestUrl);

        var content = JSON.stringify(record);

        var headers = {
            'Host': url.host,
            'Authorization': 'OAuth ' + accessToken,
            'Content-Type': 'application/json',
            'Content-Length': content.length
        };

        var path = "/" + url.path + sObjectTypeName + '/' + sObjectId;
        var reqOpts = {
            host: url.host,
            port: 443,
            path: path,
            method: 'PATCH',
            headers: headers
        };

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  data += chunk;
              });
              res.on('end', function(){
                  if (res.statusCode == '200' || res.statusCode == '204'){
                      if (options.onSuccess){
                          options.onSuccess.apply(this, []);
                      }
                  }
                  else{
                      if (options.onError){
                        options.onError.apply(this, [data]);
                      }
                  }
              });

        });
        req.on('error', function(error){
            if (options.onError){
                options.onError.apply(this, [error]);
            }
        });

        req.write(content);
        req.end();
    };

    this.compile = function(serverUrl, sessionId, code, options){

        var soap = "";
        soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apex="http://soap.sforce.com/2006/08/apex">';
        soap += "<soapenv:Header>";
        soap += "  <apex:SessionHeader>";
        soap += "     <apex:sessionId>" + sessionId + "</apex:sessionId>";
        soap += "  </apex:SessionHeader>";
        soap += "</soapenv:Header>";
        soap += "<soapenv:Body>";
        soap += "  <apex:compileClasses>";
        soap += "     <apex:scripts>" + code + "</apex:scripts>";
        soap += "  </apex:compileClasses>";
        soap += "</soapenv:Body>";
        soap += "</soapenv:Envelope>";

        var url = utils.parseUrl(serverUrl);

        var headers = {
            'Host': url.host,
            'SOAPAction': 'CompileClasses',
            'Content-Type': 'text/xml',
            'Content-Length': soap.length
        };

        var path = "/" + url.path;
        var reqOpts = {
            host: url.host,
            port: 443,
            path: path,
            method: 'POST',
            headers: headers
        };

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  if (chunk){
                    data += chunk;
                  }
              });
              res.on('end', function(){
                  if (res.statusCode == '200'){
                      parseResults(data, ['result'], options);
                  }
                  else{
                      if (options.onError){
                          options.onError.apply(this, [data]);
                      }
                  }
              });

        });
        req.on('error', function(error){
            if (options.onError){
                options.onError.apply(this, [error]);
            }
        });

        req.write(soap);
        req.end();
    };

    this.getOAuthUrl = function(){

        return settings.oAuthUrl;
    };

    this.getOAuthSandboxUrl = function(){

        return settings.oAuthSandboxUrl;
    };

    function fetchIdentityInfo(identityServerUrl, accessToken, options){

        var url = utils.parseUrl(identityServerUrl);

        var headers = {
            'Host': url.host,
            'Authorization': 'OAuth ' + accessToken
        };

        var path = "/" + url.path;
        var reqOpts = {
            host: url.host,
            port: 443,
            path: path,
            method: 'GET',
            headers: headers
        };

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  data += chunk;
              });
              res.on('end', function(){
                  if (res.statusCode == '302'){
                      fetchIdentityInfo(res.headers.location, accessToken, options);
                  }
                  else if (res.statusCode == '200'){
                      if (options.onSuccess){
                          options.onSuccess.apply(this, [JSON.parse(data)]);
                      }
                  }
                  else{
                      if (options.onError){
                        options.onError.apply(this, [data]);
                      }
                  }
              });

        });
        req.on('error', function(error){
            if (options.onError){
                options.onError.apply(this, [error]);
            }
        });
        req.end();
    }

    this.getIdentityInfo = function(identityServerUrl, accessToken, options){

        fetchIdentityInfo(identityServerUrl, accessToken, options);
    };

    return this;
};