/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
var fs = require('fs');
var express = require('./node_modules/express');
var mustachio = require('./node_modules/mustachio');
var utils = require('./utils.js')();

var sfdcOptions = {
    //Note: ockleydev.* are files that contain private and public keys from remote access setup in Salesforce Org
    //Instructions on setting up remote access: http://wiki.developerforce.com/index.php/Getting_Started_with_the_Force.com_REST_API
    oAuthPublicKey : process.env.OAuthPublicKey || fs.readFileSync('../ockleydev.public').toString(),
    oAuthPrivateKey : process.env.OAuthPrivateKey || fs.readFileSync('../ockleydev.private').toString(),
    oAuthCallbackURI: process.env.OAuthCallbackUri || 'https://localhost:3000/token'
};

var sfdc = require('./sfdc.js')(sfdcOptions);

var serverOptions = null;

if(typeof(process.env.PORT) == 'undefined') {
    //probably not running on Heroku

    console.log('using local https server...');

	serverOptions = {
	    //Use cert generation info here: http://www.silassewell.com/blog/2010/06/03/node-js-https-ssl-server-example/
  		key: fs.readFileSync('../privatekey.pem').toString(),
  		cert: fs.readFileSync('../certificate.pem').toString()
	};
}

var app = module.exports = express.createServer(serverOptions);

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

//merge the passed in object onto the session state
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

///////////////////////////////////////////////////
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
        res.send('Missing login server selection', 400);
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

            updateSession(req.session, response);

            sfdc.getIdentityInfo(response.id, response.access_token, {
                onSuccess: function(identityInfo){

                    updateSession(req.session, identityInfo);
                    res.redirect('/editor');
                },
                onError: function(identityErr){

                    console.log('error requesting identity - ' + identityErr);
                    res.send(identityErr, 500);
                }
            });

        },
        onError: function(e){
            console.log('login error - ' + e);
            res.send(e, 500);
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
                res.send(results, 200);
            },
            onError: function(error){
                console.log('query error: ' + error);
                res.send(error, 500);
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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name from ApexClass limit 1000", {

            onSuccess: function(results){
                res.send(results, 200);
            },
            onError: function(error){
                console.log('query error: ' + error);
                res.send(error, 500);
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

    if (req.body == null || req.body.content == null){
        res.send('Missing content param', 400);
        return;
    }

    var content = utils.escape(req.body.content);

    sfdc.compile(req.session.sfdc.urls.apex, req.session.sfdc.access_token, content, {

            onSuccess: function(results){
                res.send(results, 200);
            },
            onError: function(error){
                console.log('compile error - ' + error);
                //note: don't return error code here.
                //ui will display returned error message
                res.send(error);
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
                res.send(results, 200);
            },
            onError: function(error){
                console.log('query error: ' + error);
                res.send(error, 500);
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

    sfdc.query(req.session.sfdc.urls.query, req.session.sfdc.access_token, "select Id, Name from ApexPage limit 1000", {
            onSuccess: function(results){
                res.send(results, 200);
            },
            onError: function(error){
                console.log('query error: ' + error);
                res.send(error, 500);
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

    if (req.body == null || req.body.content == null){
        res.send('Missing content param', 400);
        return;
    }

    var markup = req.body.content;

    sfdc.update(req.session.sfdc.urls.sobjects, req.session.sfdc.access_token, 'ApexPage',  req.params.id, { Markup:  markup }, {
        onSuccess: function(){
            res.send('Success', 200);
        },
        onError: function(error){
            console.log('update error - ' + error);
            //note: don't return error code here.
            //ui will display returned error message
            res.send(error);
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
