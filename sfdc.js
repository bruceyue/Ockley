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
            //console.log('push tag: ' + tag.name);
            _tags.push({ name: tag.name });
        };

        var popTag = function(){
            if (_tags.length){
                var t = _tags.pop();
                //console.log('popped tag: ' + t.name);
                var len = _tags.length;
                if (len){
                    _tags[len - 1][t.name] = t;
                }
                else{
                    //console.log('pushing result: ');
                    //console.log(t);
                    _results.push(t);
                }
            }
        };

        _parser.onopentag = function(tag) {
            //console.log("Sax - Open Element: " + tag.name +" (Attributes: " + JSON.stringify(tag.attributes) + " )");
            if (_tags.length || isMatch(tag.name)){
                pushTag(tag);
            }
        };
        _parser.onclosetag = function(tagName) {
            //console.log("Sax - Close Element: " + tagName);
            popTag();
        };
        _parser.ontext = function(text) {
            //console.log('Sax - Text: ' + text);
            var len = _tags.length;
            if (len){
                _tags[len - 1].text = text;
            }
        };
        _parser.onerror = function(err) {
            //console.log('Sax - Error: ' + JSON.stringify(err));
            var onError = _options.onError;
            if (onError){
                while(_tags.length){
                    popTag();
                }
                onError.call(this, err, _results);
            }

        };
        _parser.onend = function() {
            //console.log('Sax - End');
            var onSuccess = _options.onSuccess;
            if (onSuccess){
                //console.log('Parsed ' + _results.length + ' elements');
                //console.log(_results);
                onSuccess.call(this, _results);
            }
        };

        _parser.write(xmlString);
        _parser.close();
    }

    function getAccessToken(token, callbacks) {
        console.log('Getting Access Token for ' + token);

        var post_data = 'code=' + token + '&grant_type=authorization_code&client_id=' + settings.oAuthPublicKey + '&redirect_uri=' + escape(settings.oAuthCallbackURI) + '&client_secret=' + settings.oAuthPrivateKey;
        console.log(post_data);

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
                    console.log("statusCode: ", res.statusCode);
                    console.log("headers: ", res.headers);

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
        console.log('Request Token:::' + requestToken);
        getAccessToken(requestToken, callbacks);
    };

    this.query = function(requestUrl, accessToken, query, options){

        console.log('query: server url: ' +requestUrl);
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

        console.log('Querying: ' + JSON.stringify(reqOpts));

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  data += chunk;
              });
              res.on('end', function(){
                  console.log('got response status code:' + res.statusCode);
                  //console.log('data: ' + data);
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

        var data = JSON.stringify(record);

        var headers = {
            'Host': url.host,
            'Authorization': 'OAuth ' + accessToken,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        };

        var path = "/" + url.path + sObjectTypeName + '/' + sObjectId;
        var reqOpts = {
            host: url.host,
            port: 443,
            path: path,
            method: 'PATCH',
            headers: headers
        };

        console.log('updating: ' + JSON.stringify(reqOpts));

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  data += chunk;
              });
              res.on('end', function(){
                  console.log('got response status code:' + res.statusCode);
                  console.log('data: ' + data);
                  if (res.statusCode == '200'){
                      //parseResults(data, ['result'], options);
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

        req.write(data);
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

        //console.log('Making request: ' + JSON.stringify(reqOpts));

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function(chunk) {
                  //console.log('got response status code:' + sfdcResponse.statusCode);
                  if (chunk){
                    data += chunk;
                  }
              });
              res.on('end', function(){
                  //console.log('got response status code:' + res.statusCode);
                  //console.log('data: ' + data);
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

/*    no longer support basic auth
    this.login = function(name, password, options){

        var soap = '';
        soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:partner.soap.sforce.com">';
        soap += '<soapenv:Body>';
        soap +=      '<urn:login>';
        soap +=          '<urn:username>' + name + '</urn:username>';
        soap +=          '<urn:password>' + password + '</urn:password>';
        soap +=      '</urn:login>';
        soap += '</soapenv:Body>';
        soap += '</soapenv:Envelope>';

        var headers = {
            'Host': 'login.salesforce.com',
            'SOAPAction': 'Login',
            'Content-Type': 'text/xml',
            'Content-Length': soap.length
        };

        var reqOpts = {
            host: 'login.salesforce.com',
            port: 443,
            path: '/services/Soap/u/21.0',
            method: 'POST',
            headers: headers
        };

        var req = https.request(reqOpts, function(res) {
              var data = '';
              res.setEncoding('utf8');

              res.on('data', function(chunk) {
                  data += chunk;
              });

              res.on('end', function(){
                  console.log('got response status code:' + res.statusCode);
                  //console.log('data: ' + data);
                  if (res.statusCode == '200'){
                      parseResults(data, ['result'], options);
                  }
                  else{
                      if (options.onError){
                          if (res.statusCode == '500'){
                            console.log('parsing error');
                            parseResults(data, ['soapenv:fault'], {
                               onSuccess: function(errResult){
                                   console.log('parse success');
                                   console.log(errResult);
                                   if (errResult && errResult.length){
                                       errResult = errResult[0];
                                       if (errResult.faultstring){
                                           options.onError.apply(this, [errResult.faultstring.text]);
                                       }
                                   }
                               },
                               onError: function(errResult){
                                   console.log('parse error');
                                   console.log(errResult);
                                   options.onError.apply(this, [data]);
                               }
                            });
                          }
                          else{
                            options.onError.apply(this, [data]);
                          }
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
*/

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
                      console.log('got redirect ' +  res.headers.location);
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
            console.log(error);
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