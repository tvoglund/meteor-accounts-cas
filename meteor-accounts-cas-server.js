bDebug = false;
MyLogs = new Meteor.Collection("casLogs");

var Fiber = Npm.require('fibers');
var url = Npm.require('url');
var CAS = Npm.require('cas');
var xmldom = Npm.require('xmldom');
var xpath  = Npm.require('xpath');

//tv added this.
var https = Npm.require('https');

var _casCredentialTokens = {};

RoutePolicy.declare('/_cas/', 'network');

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use(function(req, res, next) {
  // Need to create a Fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  Fiber(function () {
    middleware(req, res, next);
  }).run();
});

middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    var barePath = req.url.substring(0, req.url.indexOf('?'));
    var splitPath = barePath.split('/');

    // Any non-cas request will continue down the default
    // middlewares.
    if (splitPath[1] !== '_cas') {
      next();
      return;
    }

    // get auth token
    var credentialToken = splitPath[2];
    if (!credentialToken) {
      closePopup(res);
      return;
    }

    // validate ticket
    casTicket(req, credentialToken, function () {
      closePopup(res);
    });

  } catch (err) {
    console.log("account-cas: unexpected error : " + err.message);
    closePopup(res);
  }
};

var casTicket = function (req, token, callback) {
  // get configuration
  if (!Meteor.settings.cas && !Meteor.settings.cas.validate) {
    console.log("accounts-cas: unable to get configuration");
    callback();
  }

  // get ticket and validate.
  var parsedUrl = url.parse(req.url, true);
  var ticketId = parsedUrl.query.ticket;

  var cas = new CAS({
    base_url: Meteor.settings.cas.baseUrl,
    service: Meteor.absoluteUrl() + "_cas/" + token
  });
  //*********truby I replaced the cas.validate with what I have below.
 /*
  cas.validate(ticketId, function (err, status, username) {
    if (err) {
      console.log("accounts-cas: error when trying to validate " + err);
    } else {
      if (status) {
        console.log("accounts-cas: user validated " + username);
        _casCredentialTokens[token] = {id: username};
      } else {
        console.log("accounts-cas: unable to validate " + ticketId);
      }
    }

    callback();
  });
*/

  /**********************START of my stuff***************************/
  var date = new Date();
  var cas_url = url.parse(Meteor.settings.cas.baseUrl.toString());
  var host_name = "";
  var port = "";
  var base_path = "";


  if (cas_url.protocol != 'https:') {
    throw new Error('Only https CAS servers are supported.');
  } else if (!cas_url.hostname) {
    throw new Error('Option `base_url` must be a valid url like: https://example.com/cas');
  } else {
    host_name = cas_url.host;
    port = cas_url.port || 443;
    base_path = cas_url.pathname;
  }

    var bound = Meteor.bindEnvironment(function(username){
        if (username == "") {
            debugLog('cas_server.js','108','Username was not found.',true);
        }
        else if(username.split("Got error: ").length > 1)
        {
            debugLog('cas_server.js','112',username,true);
        }
        else if (username.length > 0){
            _casCredentialTokens[token] = {id: username};
            debugLog('cas_server.js','116',username,false);
        }

        callback();
    });

  var service = Meteor.absoluteUrl() + "_cas/" + token;
  var req = https.request({
    host: 'shibbolethtest.cloudapp.net',
    port: 8443,
    path: '/cas-server-webapp-4.0.4/serviceValidate?service='+ service + '&ticket=' + ticketId,
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  },function(res){

      res.setEncoding('utf8');
      var response = '';
      res.on('data', function(chunk) {
          response += chunk;
      });

      res.on('end', function() {
          //test string
          //var xml = '<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>tvoglund</cas:user></cas:authenticationSuccess></cas:serviceResponse>';
          var doc = new xmldom.DOMParser().parseFromString(response);
          var userElement = xpath.select("//*[local-name(.)='authenticationSuccess']//*[local-name(.)='user']", doc);
          var username = "";
          if(userElement.length > 0){
              firstUserElement = userElement[0];
              if(firstUserElement.childNodes.length > 0){
                  username = firstUserElement.childNodes[0].nodeValue;
              }
          }
          bound(username);
      });

  });
  req.end();
  req.on('error', function(e){
    bound("Got error: " + e.message);
  });
  /**********************END of my stuff***************************/

  return; 
};

/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */
 Accounts.registerLoginHandler(function (options) {
   var date = new Date();
   debugLog('cas_server.js','174','Inside Accounts.registerLoginHandler',false);

  if (!options.cas) {
    return undefined;
  }

  if (!_hasCredential(options.cas.credentialToken)) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
      'no matching login attempt found');
  }

  var result = _retrieveCredential(options.cas.credentialToken);
  var options = { profile: { name: result.id } };
  var user = Accounts.updateOrCreateUserFromExternalService("cas", result, options);

  return user;
});

var _hasCredential = function(credentialToken) {
  return _.has(_casCredentialTokens, credentialToken);
}

/*
 * Retrieve token and delete it to avoid replaying it.
 */
var _retrieveCredential = function(credentialToken) {
  var result = _casCredentialTokens[credentialToken];
  delete _casCredentialTokens[credentialToken];
  return result;
}

var closePopup = function(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var content = '<html><head><script>window.close()</script></head></html>';
  res.end(content, 'utf-8');
}

var debugLog = function(file, line, message, isError){
// code to run on server at startup
    if(Meteor.settings) {
        if(Meteor.settings['public']) {
            bDebug = Meteor.settings.cas.debug == "true";
        }
    }

        var date = new Date();
        var n = date.toDateString();
        var time = date.toLocaleTimeString();

        if(bDebug) {
            if(isError) {
                MyLogs.insert({
                    file: file,
                    line: line,
                    error: message,
                    info: 'na',
                    date: n + ' ' + time
                });
            }
            else{
                MyLogs.insert({
                    file: file,
                    line: line,
                    error: 'na',
                    info: message,
                    date: n + ' ' + time
                });
            }
        }
}

