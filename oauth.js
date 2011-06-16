/*
 This code was originally written by Josh Birk.
 https://github.com/joshbirk/NodeJS-RESTFDC.git

 mpage - I have reformatted and modified it to work with Ockley.
 */

module.exports = function(options){
    var http = require('http');
    var https = require('https');

    var settings = {
        publicKey : '',
        privateKey : '',
        callbackURI : ''
    };

    //merge options onto settings
    if (options != null) {
        for (var key in options) {
          settings[key] = options[key];
        }
    }

    this.getOAuthURL = function(){
        return 'https://login.salesforce.com/services/oauth2/authorize?display=touch&response_type=code&client_id=' + settings.publicKey + '&redirect_uri=' + settings.callbackURI;
    };

    this.getRequestToken = function(url, callbacks) {

        var tokenURL = unescape(url);
        var requestToken = escape(tokenURL.substring(tokenURL.indexOf("code=") + 5, tokenURL.length));
        console.log('Request Token:::' + requestToken);
        getAccessToken(requestToken, callbacks);
    };

    function getAccessToken(token, callbacks) {
        console.log('Getting Access Token for ' + token);

        var post_data = 'code=' + token + '&grant_type=authorization_code&client_id=' + settings.publicKey + '&redirect_uri=' + escape(settings.callbackURI) + '&client_secret=' + settings.privateKey;
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

    return this;
};