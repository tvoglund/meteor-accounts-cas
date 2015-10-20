## Accounts CAS

Authentication for meteor using CAS.  Please see https://atmospherejs.com/atoy40/accounts-cas for documentation.  I slightly changed this code to get working with a test server deployed locally.

## Details

Please see link above for most details, the few items this package has changed is described below.  When the client calls Meteor.loginWithCas, if there is an error, the callback will have a Meteor.Error.  If the details property of this error is userDoesNotExist, then the user was not found in the database, but was authenticated by the CAS server.

#### sample settings.json file

{
  "public": {
    "cas": {
      "loginUrl": "https://someServer:443/cas-server-webapp-4.0.4/login",
      "logoutUrl": "https://someServer:443/cas-server-webapp-4.0.4/logout",
      "serviceParam": "service",
      "popupWidth": 810,
      "popupHeight": 610
    }
  },
  "cas": {
    "debug": "true",
    "baseUrl": "https://someServer:443/cas-server-webapp-4.0.4/",
    "autoClose": true
  }
}

#### CAS Ticket Validation

I changed the ticket validation of the package atoy40:accounts-cas.  The service called for ticket validation now has a path of :

base_path + 'serviceValidate?service='+ service + '&ticket=' + ticketId

note:  base_url is parsed from baseUrl of cas server settings in settings.json.  From the example above it would be /cas-server-webapp-4.0.4/
and the port used would be parsed from base_url, but if it is not there, then it would be 443.

The sample response from this service is:

<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>someUserName</cas:user></cas:authenticationSuccess></cas:serviceResponse>

### CAS Links

  - http://community.jaspersoft.com/documentation/jasperreports-server-authentication-cookbook/cas-server-testing
  - https://wiki.jasig.org/display/CASUM/Home
  - http://jasig.github.io/cas/4.0.x/index.html
