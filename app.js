/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
var express = require('./node_modules/express');
var mustachio = require('./node_modules/mustachio');
var mongoose = require('./node_modules/mongoose');
var mongoStore = require('connect-mongodb');
var sfdc = require('./sfdc.js');

var app = module.exports = express.createServer();

app.configure(function() {
    app.register('.mustache', mustachio);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'mustache');
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    //TODO - Important! Change secret on deployment
    app.use(express.session({ secret: "WlJP7z13Rg2s0hT5_RW-7", store: mongoStore(app.set('db-uri')) }));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.set('db-uri', 'mongodb://localhost/ockley-development');
});

app.configure('production', function() {
    app.use(express.errorHandler());
    app.set('db-uri', 'mongodb://localhost/ockley-production');
});

var db = mongoose.connect(app.set('db-uri'));

function isAuthenticated(req){
    return (req.session && req.session.sfdcSession);
}

//ROUTES

app.get('/', function(req, res) {
    res.render("index", {
        title: "Home",
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
        onSuccess : function(info){
            req.session.sfdcServerUrl = info.serverUrl;
            req.session.sfdcSession = info.sessionId;
            res.redirect('/editor');
        },
        onError : function(error){
            //TODO - report error
            console.log(error);
            res.redirect('back');
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
                if (res){
                    res.send(results);
                }
                res = null;
            },
            onError: function(error){
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
                res.send(results);
            },
            onError: function(error){
                //TODO - report error
                console.log(error);
            }
    });
});

//save a specific apex page
app.post('/apex/:id.:format?', function(req, res){
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
                if (res){
                    res.send(results);
                }
                res = null;
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
                if (res){
                    res.send(results);
                }
                res = null;
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


    if (req.markup == null){
        //TODO - report error
        console.log('Missing markup param');
        res.redirect('back');
        return;
    }

    sfdc.query(req.session.sfdcServerUrl, req.session.sfdcSession, req.markup, {

            onSuccess: function(results){
                if (res){
                    res.send(results);
                }
                res = null;
            },
            onError: function(error){
                //TODO - report error
                console.log(error);
            }
    });
});

app.get('*', function(req, res) {
    res.send("Nope", 404);
});

// Only listen on $ node app.js
if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
