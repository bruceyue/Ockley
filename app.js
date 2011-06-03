/*
Ockley 1.0
Copyright 2011,  Matthew Page
licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
var express = require('./node_modules/express');
var mustachio = require('./node_modules/mustachio');
//var mongoose = require('./node_modules/mongoose');
//var mongoStore = require('connect-mongodb');
var sfdc = require('./sfdc.js');

var app = module.exports = express.createServer();

var dbUri = process.env.MONGOHQ_URL || 'mongodb://localhost/ockley-development';

app.configure(function() {
    app.register('.mustache', mustachio);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'mustache');
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    //TODO - Important! Change secret on deployment
    app.use(express.session({ secret: "ZRJP7z78Rg2s0hT6_RW-9" /*, store: mongoStore(dbUri) */}));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
/*
    var uri = process.env.MONGOHQ_URL || 'mongodb://localhost/ockley-development';
    console.log(uri);
    app.set('db-Uri', uri);
*/
});

app.configure('production', function() {
    app.use(express.errorHandler());
/*
    var uri = process.env.MONGOHQ_URL || 'mongodb://localhost/ockley-production';
    console.log(uri);
    app.set('dbUri', uri);
*/
});

/*
console.log('connect to db with uri: ' + dbUri);
var db = mongoose.connect(dbUri);
*/

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
        onSuccess : function(result){
            console.log('login success');
            //console.log(result);
            if (result && result.length)
            {
                result = result[0];
                if (result.metadataserverurl){
                    var metaUrl = result.metadataserverurl.text;
                    req.session.sfdcMetadataServerUrl = metaUrl;
                    req.session.sfdcApexServerUrl = metaUrl.replace('Soap/m', 'Soap/s')
                }
                if (result.serverurl){
                    req.session.sfdcServerUrl = result.serverurl.text;
                }
                if (result.sessionid){
                    req.session.sfdcSession = result.sessionid.text;
                }
            }
            res.redirect('/editor');
        },
        onError : function(error){
            console.log('login error' + error);
            //TODO - report error
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

    sfdc.compile(req.session.sfdcApexServerUrl, req.session.sfdcSession, req.body.content, {

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

    var markup = req.body.content;

    markup = markup.replace(/&/g, '\&amp;');
    markup = markup.replace(/</g, '&lt;');
    markup = markup.replace(/>/g, '&gt;');

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
    res.send("Nope", 404);
});

// Only listen on $ node app.js
if (!module.parent) {
    var port = process.env.PORT || 3000;
    app.listen(port);
    console.log("Express server listening on port %d", app.address().port);
}
