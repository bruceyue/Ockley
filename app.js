/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
var express = require('./node_modules/express');
var mustachio = require('./node_modules/mustachio');
var sfdc = require('./sfdc.js');

var OAuth = require('./oauth')({
    publicKey : process.env.OAuthPublicKey || '',
    privateKey : process.env.OAuthPrivateKey || '',
    callbackURI: process.env.OAuthCallbackUri || 'https://ockley.herokuapp.com/token'
});


var app = module.exports = express.createServer();

app.configure(function() {
    app.register('.mustache', mustachio);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'mustache');
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    var secretKey = process.env.SESSIONKEY || "SuperSecretSecretSquirrel";
    app.use(express.session({ secret: secretKey}));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

function isAuthenticated(req){
    return (req.session && req.session.sfdcSession);
}

function encode(text){
    text = text.replace(/&/g, '\&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    return text;
}

//ROUTES

app.get('/', function(req, res) {
    res.render("index", {
        title: "Ockley",
        loggedIn: isAuthenticated(req)
    });
});

app.get('/login', function(req, res) {
    res.render("login", {
        title: "Login"
    });
});

app.post('/login', function(req, res) {

    if (req.body == null || req.body.user == null){
        //TODO - report error
        console.log('Missing login user name and password');
        res.redirect('back');
        return;
    }

    var user = req.body.user;
    sfdc.login(user.name, user.pass, {
        onSuccess : function(results){
            console.log('login success');
            console.log(results);
            if (results && results.length)
            {
                results = results[0];
                if (results.metadataserverurl){
                    var metaUrl = results.metadataserverurl.text;
                    req.session.sfdcMetadataServerUrl = metaUrl;
                    req.session.sfdcApexServerUrl = metaUrl.replace('Soap/m', 'Soap/s')
                }
                if (results.serverurl){
                    req.session.sfdcServerUrl = results.serverurl.text;
                }
                if (results.sessionid){
                    req.session.sfdcSession = results.sessionid.text;
                }
            }
            res.redirect('/editor');
        },
        onError : function(error){
            console.log('login error - ' + error);
            res.send(error);
        }
    });

});

app.post('/oauth', function(req, res) {

    var url = OAuth.getOAuthURL();
    console.log('redirecting to oauth url:' + url);
    res.redirect( url );
});

app.get('/token', function(req, res){
    console.log('getting request token...');
    OAuth.getRequestToken( req.url, {
        onSuccess: function(response){
            console.log('oauth response: ' + JSON.stringify(response));
            req.session.refresh_token = response.refresh_token;
            req.session.sfdcSession = response.access_token;

            sfdc.getIdentityInfo(response.id, response.access_token, {
                onSuccess: function(identityInfo){
                    console.log('got identity info');
                    console.log(JSON.stringify(identityInfo))
                    if (identityInfo.hasOwnProperty('urls')){
                        var metaUrl = identityInfo.urls.metadata;
                        req.session.sfdcMetadataServerUrl = metaUrl;
                        req.session.sfdcApexServerUrl = metaUrl.replace('Soap/m', 'Soap/s');
                        req.session.sfdcServerUrl = identityInfo.urls.enterprise;
                    }
                    res.redirect('/editor');
                },
                onError: function(identityErr){
                    console.log('error requesting identity - ' + identityErr);
                    res.send(identityErr);
                }
            });
            
        },
        onError: function(e){
            console.log('login error - ' + e);
            res.send(e);
        }
    });
});


app.del('/logout', function(req, res) {
    console.log('logging out ');
    if (req.session) {
        console.log(req.session.sfdcSession);
        req.session.sfdcSession = null;
        req.session.destroy(function() {});
    }
    res.redirect('/');
});

app.get('/editor', function(req, res) {

    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    res.render("editor", {
        title: "Editor",
        loggedIn: isAuthenticated(req)
    });
});

//get a specific apex page
app.get('/apex/:id.:format?', function(req, res){

    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    sfdc.query(req.session.sfdcServerUrl, req.session.sfdcSession, "select Id, Name, Body from ApexClass where id ='" + req.params.id + "' limit 1", {
            
            onSuccess: function(results){
                console.log('query success');
                //console.log('Query Results: ');
                //console.log(results);
                res.send(results);
            },
            onError: function(error){
                console.log('query error');
                //TODO - report error
                console.log(error);
            }
    });
});

//get apex classes
app.get('/apex.:format?', function(req, res) {

    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    sfdc.query(req.session.sfdcServerUrl, req.session.sfdcSession, "select Id, Name, Body from ApexClass limit 1000", {
            onSuccess: function(results){
                console.log('query success');
                res.send(results);
            },
            onError: function(error){
                console.log('query error');
                //TODO - report error
                console.log(error);
            }
    });
});

//save a specific apex page
app.post('/apex/:id.:format?', function(req, res){
    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    console.log('Saving doc ' + req.params.id );

    console.log(req.body);


    if (req.body == null || req.body.content == null){
        //TODO - report error
        console.log('Missing content param');
        res.redirect('back');
        return;
    }

    var content = encode(req.body.content);


    sfdc.compile(req.session.sfdcApexServerUrl, req.session.sfdcSession, content, {

            onSuccess: function(results){
                console.log('parse success - results: ');
                console.log(results);
                res.send(results);
            },
            onError: function(error, results){
                console.log('parse error - ' + error + ' got this much: ');
                console.log(results);
                //TODO - report error
                res.redirect('back');
            }
    });
});


//get a specific vf page
app.get('/vf/:id.:format?', function(req, res){

    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    sfdc.query(req.session.sfdcServerUrl, req.session.sfdcSession, "select Id, Name, Markup from ApexPage where id ='" + req.params.id + "' limit 1", {

            onSuccess: function(results){
                res.send(results);
            },
            onError: function(error){
                //TODO - report error
                console.log(error);
            }
    });
});

//get vf pages
app.get('/vf.:format?', function(req, res) {

    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    sfdc.query(req.session.sfdcServerUrl, req.session.sfdcSession, "select Id, Name, Markup from ApexPage limit 1000", {
            onSuccess: function(results){
                res.send(results);
            },
            onError: function(error){
                //TODO - report error
                console.log(error);
            }
    });
});

//save a specific vf page
app.post('/vf/:id.:format?', function(req, res){
    if (!isAuthenticated(req)){
        res.redirect("/login");
        return;
    }

    if (req.params.format != 'json'){
      res.send('Format not available', 400);
      return;
    }

    console.log('Saving doc ' + req.params.id );

    console.log(req.body);

    if (req.body == null || req.body.content == null){
        //TODO - report error
        console.log('Missing content param');
        res.redirect('back');
        return;
    }

    var markup = encode(req.body.content);

    sfdc.update(req.session.sfdcServerUrl, req.session.sfdcSession, 'ApexPage',  req.params.id, [], { Markup:  markup }, {
        onSuccess: function(results){
            console.log('update success - results: ');
            console.log(results);
            res.send(results);
        },
        onError: function(error, results){
            console.log('update error - ' + error + ' got this much: ');
            console.log(results);
            console.log(error);
        }
    });
});

app.get('*', function(req, res) {
    console.log('404:' + req.url);
    res.send("Nope", 404);
});

// Only listen on $ node app.js
if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port);
    console.log("Express server listening on port %d", app.address().port);
}
