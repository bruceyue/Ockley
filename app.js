/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
var express = require('./node_modules/express');
var mustachio = require('./node_modules/mustachio');
var utils = require('./utils.js')();
var sfdc = require('./sfdc.js')({
    oAuthPublicKey : process.env.OAuthPublicKey || '',
    oAuthPrivateKey : process.env.OAuthPrivateKey || '',
    oAuthCallbackURI: process.env.OAuthCallbackUri || 'https://ockley.herokuapp.com/token'
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
    return (req.session && req.session.sfdc && req.session.sfdc.access_token);
}

function updateSession(session, state){
    if (!session.hasOwnProperty('sfdc')){
        session.sfdc = {};
    }

    if (state.hasOwnProperty('urls')){
        var urls = state.urls;

        for(var key in urls){
            urls[key] = urls[key].replace('{version}', '21.0');
        }

        if (urls.hasOwnProperty('metadata')){
            urls.apex = urls.metadata.replace('Soap/m', 'Soap/s');
        }
    }

    utils.extend(session.sfdc, state);
}

function getSfdcServerUrl(session){
    var serverUrl = session.sfdc.urls.enterprise;

    //TODO - support partners
    var isPartner = false;
    if (isPartner){
        serverUrl = session.sfdc.urls.partner;
    }
    return serverUrl;
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

    if (req.body == null || req.body.server == null){
        res.send('Missing login server selection');
        return;
    }

    var selectedServer = req.body.server.url;
    var isSandbox = selectedServer === 'test.salesforce.com';
    var url = isSandbox ? sfdc.getOAuthSandboxUrl() : sfdc.getOAuthUrl();
    console.log('Redirecting to login url: ' + url);
    res.redirect(url);
});

app.get('/token', function(req, res){

    var callbacks = {
        onSuccess: function(response){
            console.log('oauth response: ' + JSON.stringify(response));
            updateSession(req.session, response);

            sfdc.getIdentityInfo(response.id, response.access_token, {
                onSuccess: function(identityInfo){
                    console.log('got identity info: ' + JSON.stringify(identityInfo));
                    updateSession(req.session, identityInfo);
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
    };

    sfdc.getOAuthRequestToken( req.url, callbacks );
});


app.del('/logout', function(req, res) {
    console.log('logging out ');
    if (req.session) {
        req.session.sfdc = null;
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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name, Body from ApexClass where id ='" + req.params.id + "' limit 1", {
            
            onSuccess: function(results){
                console.log('query success');
                //console.log('Query Results: ');
                //console.log(records);
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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name, Body from ApexClass limit 1000", {

            onSuccess: function(results){
                console.log('query success');
                //console.log('query Results: ');
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

    var content = utils.escape(req.body.content);


    sfdc.compile(getSfdcServerUrl(req.session), req.session.sfdc.access_token, content, {

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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name, Markup from ApexPage where id ='" + req.params.id + "' limit 1", {

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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name, Markup from ApexPage limit 1000", {
            onSuccess: function(results){
                console.log('query success');
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

    var markup = req.body.content;//utils.escape(req.body.content);

    sfdc.update(req.session.sfdc.urls.sobjects, req.session.sfdc.access_token, 'ApexPage',  req.params.id, { Markup:  markup }, {
        onSuccess: function(){
            console.log('update success - results: ');
            res.send('Success');
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
