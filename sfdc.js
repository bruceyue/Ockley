/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

module.exports = function(options){

    var https = require('https');
    var sax = require('./node_modules/sax');
    var utils = require('./utils.js')();
    var jsz = require('./public/libs/jszip.js');
    var fs = require('fs');

    var settings = {
        oAuthPublicKey: '',
        oAuthPrivateKey: '',
        oAuthCallbackURI: ''
    };
    utils.extend(settings, options);

    settings.oAuthUrl = 'https://login.salesforce.com/services/oauth2/authorize?display=touch&response_type=code&client_id=' + settings.oAuthPublicKey + '&redirect_uri=' + settings.oAuthCallbackURI;
    settings.oAuthSandboxUrl = 'https://test.salesforce.com/services/oauth2/authorize?display=touch&response_type=code&client_id=' + settings.oAuthPublicSbKey + '&redirect_uri=' + settings.oAuthCallbackURI + '/sandbox';

	function callback(name, callbacks, arg){
		
		if (callbacks && typeof callbacks == 'object' && callbacks.hasOwnProperty(name)){
		    callbacks[name].apply(this, arg);
        }
	}
	
	function callbackSuccess(callbacks, arg){
		callback('onSuccess', callbacks, arg);
	}

	function callbackError(callbacks, arg){
		callback('onError', callbacks, arg);
	}


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

        var getTagParent = function(){
            return (_tags.length > 0) ? _tags[_tags.length -1] : null;
        };

        var pushTag = function(tag){
            var parent = getTagParent();
            if (parent != null){
                if (parent.children != null){
                    var existing = inArray(tag.name, parent.children);
                    if (existing > -1){
                      //console.log('Duplicate sibling tag detected: ' + tag.name);
                      return;
                    }
                    parent.children.push(tag.name);
                }
            }
            _tags.push({ name: tag.name, children: [], parent: (parent ? parent.name : '') });
        };

        var popTag = function(){
            if (_tags.length > 0){
                var t = _tags.pop();
                var len = _tags.length;
                if (len > 0){
                    //console.log('Adding ' + t.name + ' to ' + _tags[len-1].name);
                    _tags[len - 1][t.name] = t;
                }
                else{
                    //console.log('Result tag: ' + JSON.stringify(t));
                    _results.push(t);
                }
            }
        };

        _parser.onopentag = function(tag) {
           //console.log('OpenTag: ' + tag.name);
            if (_tags.length > 0 || isMatch(tag.name)){
                pushTag(tag);
            }
        };
        _parser.onclosetag = function(tagName) {
            //console.log('CloseTag: ' + tagName);
            popTag();
        };
        _parser.ontext = function(text) {
            //console.log('Text: ' + text);
            var len = _tags.length;
            if (len > 0){
                _tags[len - 1].text = text;
            }
        };
        _parser.onerror = function(err) {
            while(_tags.length > 0){
                popTag();
            }
            callbackError(_options, _results);
        };
        _parser.onend = function() {
            //console.log('End of parse input. Remaining tags: ' + _tags.length);
            console.log(JSON.stringify(_results));
            callbackSuccess(_options, _results);
        };

        _parser.write(xmlString);
        _parser.close();
    }

    function getAccessToken(token, isSandbox, callbacks) {

        var publicKey = isSandbox ? settings.oAuthPublicSbKey : settings.oAuthPublicKey;
        var privateKey = isSandbox ? settings.oAuthPrivateSbKey : settings.oAuthPrivateKey;
        var callbackUri = isSandbox ? settings.oAuthCallbackURI + "/sandbox" : settings.oAuthCallbackURI;

        var post_data = 'code=' + token + '&grant_type=authorization_code&client_id=' + publicKey + '&redirect_uri=' + escape(callbackUri) + '&client_secret=' + privateKey;

        var options = {
            host: isSandbox ? 'test.salesforce.com' : 'login.salesforce.com',
            path: '/services/oauth2/token',
            method: 'POST',
            headers: {
                'host': isSandbox ? 'test.salesforce.com' : 'login.salesforce.com',
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
                    	callbackSuccess(callbacks, [JSON.parse(data)]);
                    });

                }).on('error', function(e) {
	               	callbackError(callbacks, [e]);
                });

        req.write(post_data);
        req.end();
    }

    this.getOAuthRequestToken = function(url, isSandbox, callbacks) {

        var tokenURL = unescape(url);
        var requestToken = escape(tokenURL.substring(tokenURL.indexOf("code=") + 5, tokenURL.length));
        getAccessToken(requestToken, isSandbox, callbacks);
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
              		callbackSuccess(options, [data]);
                  }
                  else{
                  	callbackError(options, [data]);
                  }
              });
        });
        req.on('error', function(error){
            callbackError(options, [error]);
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
                  		callbackSuccess(options, []);
                  }
                  else{
                  		callbackError(options, [data]);
                  }
              });

        });
        req.on('error', function(error){
            callbackError(options, [error]);
        });

        req.write(content);
        req.end();
    };

    this.create = function(requestUrl, accessToken, sObjectTypeName, record, options){
        var url = utils.parseUrl(requestUrl);

        var content = JSON.stringify(record);

        var headers = {
            'Host': url.host,
            'Authorization': 'OAuth ' + accessToken,
            'Content-Type': 'application/json',
            'Content-Length': content.length
        };

        var path = "/" + url.path + sObjectTypeName;
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
                  data += chunk;
              });
              res.on('end', function(){
                  //console.log('Create: got status code: ' + res.statusCode);
                  if (res.statusCode == '200' || res.statusCode == '204'){
                      callbackSuccess(options, []);
                  }
                  else{
                  	  callbackError(options, [data]);
                  }
              });

        });
        req.on('error', function(error){
            callbackError(options, [error]);
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
                  
                      parseResults(data, ['result'], {

                      	"onSuccess" : function(results){
                      	
                      		//console.log(results);
                      		if (typeof results == 'array' && results.length > 0){
                      			results = results[0];
                      		}
                      		
                      		if (typeof results == 'object' && results.hasOwnProperty('success')){
                      			if (results.success.text == 'false'){
                      				callbackError(options, [results]);
                      				return;
                      			}
                      		}
                      		
	                      	callbackSuccess(options, [results]);
                      	
                      	},
                      	"onError" : function(error){
							
							callbackError(options, [data]);
                      	}
                      	
                      });
                  }
                  else{
                  		callbackError(options, [data]);
                  }
              });

        });
        req.on('error', function(error){
            callbackError(options, [error]);
        });

        req.write(soap);
        req.end();
    };

    function writeTempFile(filePathName, fileContent){
        fs.writeFile(filePathName, fileContent, 'binary', function (err) {
            if (err) throw err;
        });
    }

    this.getDeployStatus = function(serverUrl, sessionId, id, deployResult, options) {

        var soap = "";
        soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">';
        soap += "<soapenv:Header>";
        soap += "  <met:SessionHeader>";
        soap += "     <met:sessionId>" + sessionId + "</met:sessionId>";
        soap += "  </met:SessionHeader>";
        soap += "</soapenv:Header>";
        soap += "<soapenv:Body>";

        var actionBeginTag = "<met:checkStatus>";
        var actionEndTag = "</met:checkStatus>";


        if (deployResult){
            actionBeginTag = "<met:checkDeployStatus>";
            actionEndTag = "</met:checkDeployStatus>";
        }


        soap += actionBeginTag;
        soap += "  <met:asyncProcessId>" + id + "</met:asyncProcessId>";
        soap += actionEndTag;
        soap += "</soapenv:Body>";
        soap += "</soapenv:Envelope>";

        var url = utils.parseUrl(serverUrl);

        var headers = {
            'Host': url.host,
            'SOAPAction': options.deployStatus ? 'CheckDeployStatus' : 'CheckStatus',
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
                if (chunk) {
                    data += chunk;
                }
            });
            res.on('end', function() {
                if (res.statusCode == '200') {
                    parseResults(data, ['result'], options);
                }
                else {
                    callbackError(options, [data]);
                }
            });

        });
        req.on('error', function(error) {
	        callbackError(options, [error]);
        });

        req.write(soap);
        req.end();
    };

    this.deploy = function(serverUrl, sessionId, files, options) {

        var zip = new jsz.JSZip();

        var file, folder, folders = {}, len = files.length;
        for (var i = 0; i < len; ++i){
            file = files[i];
            if (file.folder != null && file.folder.length > 0){
                folder = file.folder;
                if (folders.hasOwnProperty(folder)){
                    folder = folders[folder];
                }
                else{
                    //add new folder
                    folder = folders[folder] = zip.folder(folder);
                }
                folder.add(file.name, file.content);
            }
            else{
                zip.add(file.name, file.content);
            }
        }

        var zipContent = zip.generate();
        //writeTempFile('./tmp/deploy.zip',zip.generate(true));

        var soap = "";
        soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">';
        soap += "<soapenv:Header>";
        soap += "  <met:SessionHeader>";
        soap += "     <met:sessionId>" + sessionId + "</met:sessionId>";
        soap += "  </met:SessionHeader>";
        soap += "</soapenv:Header>";
        soap += "<soapenv:Body>";
        soap += "<met:deploy>";
        soap += "  <met:ZipFile>" + zipContent + "</met:ZipFile>";

        soap += "<met:DeployOptions>";
        soap += "   <met:allowMissingFiles>true</met:allowMissingFiles>";
        //soap += "   <met:autoUpdatePackage>?</met:autoUpdatePackage>";
        soap += "   <met:checkOnly>false</met:checkOnly>";
        soap += "   <met:ignoreWarnings>true</met:ignoreWarnings>";
        soap += "   <met:performRetrieve>false</met:performRetrieve>";
        //soap += "   <met:purgeOnDelete>?</met:purgeOnDelete>";
        soap += "   <met:rollbackOnError>true</met:rollbackOnError>";
        soap += "   <met:runAllTests>false</met:runAllTests>";
        soap += "   <met:singlePackage>true</met:singlePackage>";
        soap += "</met:DeployOptions>";
        soap += "</met:deploy>";
        soap += "</soapenv:Body>";
        soap += "</soapenv:Envelope>";

        var url = utils.parseUrl(serverUrl);

        var headers = {
            'Host': url.host,
            'SOAPAction': 'Deploy',
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

        //console.log('Deploy requesting: ' + JSON.stringify(reqOpts));
        //console.log('Deploy soap: ' + soap);

        var req = https.request(reqOpts, function(res) {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                if (chunk) {
                    data += chunk;
                }
            });
            res.on('end', function() {
                if (res.statusCode == '200') {
                    //console.log('Deploy got result: ' + data);
                    parseResults(data, ['result'], options);
                }
                else {
                    callbackError(options, [data]);
                }
            });

        });
        req.on('error', function(error) {
            callbackError(options, [error]);
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
                      callbackSuccess(options, [JSON.parse(data)]);
                  }
                  else{
                      callbackError(options, [data]);
                  }
              });

        });
        req.on('error', function(error){
            callbackError(options, [error]);
        });
        req.end();
    }

    this.getIdentityInfo = function(identityServerUrl, accessToken, options){

        fetchIdentityInfo(identityServerUrl, accessToken, options);
    };

    this.getSObjectLastModifiedDate = function(requestUrl, accessToken, sObjectId, sObjectTypeName, callbacks){
        this.query(requestUrl, accessToken, "select LastModifiedDate from " + sObjectTypeName + " where id ='" + sObjectId + "' limit 1", callbacks );
    };

    return this;
};
