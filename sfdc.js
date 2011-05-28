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

function parseQueryResults(xmlString, options){

    var strict = false;
    var parser = new sax.parser(strict, { lowercasetags: true });
    parser.ockley = {
        record : null,
        tagName : null,
        records : [],
        onSuccess: options.onSuccess,
        onError: options.onError
    };

    parser.onopentag = function(tag) {
        console.log("Sax - Open Element: " + tag.name +" (Attributes: " + JSON.stringify(tag.attributes) + " )");
        var state = this.ockley;
        if (tag.name === "records"){
            state.record = {};
        }
        else if (state.record != null){
            state.tagName = tag.name;
            state.record[tag.name] = "";
        }
    };
    parser.onclosetag = function(tagName) {
        console.log("Sax - Close Element: " + tagName);
        var state = this.ockley;
        if (tagName === "records"){
            if (state.record){
                state.records.push(state.record);
                state.record = null;
            }
        }
        state.tagName = null;
    };
    parser.ontext = function(text) {
        console.log('Sax - Text: ' + text);
        var state = this.ockley;
        var tagName = state.tagName;
        var record = state.record;
        if (record && tagName){
            record[tagName] = text;
        }

    };
    parser.onerror = function(err) {
        console.log('Sax - Error: ' + JSON.stringify(err));

        var onError = this.ockley.onError;
        if (onError){
            onError.apply(this, [err]);
        }

    };
    parser.onend = function() {
        console.log('Sax - End');
        var state = this.ockley;
        var onSuccess = state.onSuccess;
        if (onSuccess){
            console.log('Parsed ' + state.records.length + ' records');
            onSuccess.apply(this, [state.records]);
        }
    };

    parser.write(xmlString);
    parser.close();
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
              //console.log('got response status code:' + sfdcResponse.statusCode);
              data += chunk;
          });
          res.on('end', function(){
              if (res.statusCode == '200'){
                  //data = d.toString('utf8');
                  console.log(data);
                  parseQueryResults(data, options);
              }
              else{
                  if (options.onError){
                    options.onError.apply(this, [d.toString('utf8')]);
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

              //console.log('got response status code:' + sfdcResponse.statusCode);
              var errMsg = "";
              if (res.statusCode == '200'){
                  //console.log(data);
                  var re = new RegExp("<loginResponse>\s*<result>.*<serverUrl>(.+)</serverUrl>.*<sessionId>(.+)</sessionId>.*</result>\s*</loginResponse>", "gm");
                  var matches = re.exec(data);
                  if (matches != null){
                      var totalMatches = matches.length;
                      if (totalMatches > 2){
                          if (options.onSuccess){
                              options.onSuccess.apply(this, [{ serverUrl: matches[1], sessionId: matches[2] }]);
                          }
                          return;
                      }
                      else{
                          errMsg = 'Unable to find session and server url';
                      }
                  }
                  else{
                      errMsg = 'No matches in response';
                  }
              }
              else{
                  errMsg = 'Received statusCode ' + res.statusCode;
              }
              if (options.onError){
                options.onError.apply(this, [errMsg]);
              }
          });
    });
    req.write(soap);
    req.end();
}

module.exports = {
    "query": query,
    "login": login
};