/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */
var https = require('https');
var sax = require('./node_modules/sax');

function parseUrl(url){
    var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var result = parse_url.exec(url);
    var ret = {};
    var names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'];
    var i, len = names.length;
    for (i = 0; i < len; ++i) {
        ret[names[i]] = result[i];
    }
    return ret;
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

function query(serverUrl, sessionId, query, options){

    var soap = "";
    soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:partner.soap.sforce.com">';
    soap += "<soapenv:Header>";
    soap += "  <urn:SessionHeader>";
    soap += "     <urn:sessionId>" + sessionId + "</urn:sessionId>";
    soap += "  </urn:SessionHeader>";
    soap += "</soapenv:Header>";
    soap += "<soapenv:Body>";
    soap += "  <urn:query>";
    soap += "     <urn:queryString>" + query + "</urn:queryString>";
    soap += "  </urn:query>";
    soap += "</soapenv:Body>";
    soap += "</soapenv:Envelope>";

    var url = parseUrl(serverUrl);

    var headers = {
        'Host': url.host,
        'SOAPAction': 'Query',
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
              data += chunk;
          });
          res.on('end', function(){
              //console.log('got response status code:' + res.statusCode);
              //console.log('data: ' + data);
              if (res.statusCode == '200'){
                  parseResults(data, ['records'], options);
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
}

function update(serverUrl, sessionId, sObjectTypeName, sObjectId, fieldsToNull, fieldsValues, options){

    var soap = "";
    soap += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:partner.soap.sforce.com" xmlns:urn1="urn:sobject.partner.soap.sforce.com">';
    soap += "<soapenv:Header>";
    soap += "  <urn:SessionHeader>";
    soap += "     <urn:sessionId>" + sessionId + "</urn:sessionId>";
    soap += "  </urn:SessionHeader>";
    soap += "</soapenv:Header>";
    soap += "<soapenv:Body>";
    soap += "  <urn:update>";
    soap += "     <urn:sObjects>";
    soap += "     <urn1:type>" + sObjectTypeName + "</urn1:type>";

    var len = fieldsToNull.length;
    for(var i = 0; i < len; ++i){
        soap += "<urn1:fieldsToNull>" + fieldsToNull[i] + "</urn1:fieldsToNull>";
    }

    soap += "    <urn1:Id>" + sObjectId + "</urn1:Id>";

    for (var field in fieldsValues){
        if (fieldsValues.hasOwnProperty(field)){
           soap += "<urn1:" + field + ">" + fieldsValues[field] + "</urn1:" + field + ">";
        }
    }

    soap += "    </urn:sObjects>";
    soap += " </urn:update>";
    soap += "</soapenv:Body>";
    soap += "</soapenv:Envelope>";

    //console.log('soap: ' + soap);

    var url = parseUrl(serverUrl);

    var headers = {
        'Host': url.host,
        'SOAPAction': 'Update',
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
              data += chunk;
          });
          res.on('end', function(){
              console.log('got response status code:' + res.statusCode);
              console.log('data: ' + data);
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
}

function compile(serverUrl, sessionId, code, options){

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

    var url = parseUrl(serverUrl);

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
}

function login(name, password, options){

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
}

/*
The 'id' URI that accompanies the access token and instance URL is the gateway to Force.com's Identity Service. You can send a GET request to the id URI, accompanied by an OAuth authorization HTTP header containing the access token, and receive a wealth of information regarding the user and org:
*/
function getIdentityInfo(identityServerUrl, accessToken, options){
    var url = parseUrl(identityServerUrl);

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

    console.log('Requesting identity info: ' + JSON.stringify(reqOpts));
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
        console.log(error);
        if (options.onError){
            options.onError.apply(this, [error]);
        }
    });

    //req.write(soap);
    req.end();
}

module.exports = {
    "query": query,
    "login": login,
    "compile": compile,
    "update": update,
    "getIdentityInfo":getIdentityInfo
};