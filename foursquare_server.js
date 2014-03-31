Foursquare = {};

Oauth.registerService('foursquare', 2, null, function(query) {

  var accessToken = getAccessToken(query);
  var identity = getIdentity(accessToken);

  return {
    serviceData: {
      id: identity.id,
      accessToken: accessToken,
      email: identity.contact.email
    },
    options: {
      profile: {
        firstName: identity.firstName,
        lastName: identity.lastName
      }
    }
  };
});

var userAgent = "Meteor";
if (Meteor.release)
  userAgent += "/" + Meteor.release;

var getAccessToken = function (query) {
  var config = ServiceConfiguration.configurations.findOne({service: 'foursquare'});
  if (!config)
    throw new ServiceConfiguration.ConfigError("Service not configured");

  var response;
  try {
    response = HTTP.post(
      "https://foursquare.com/oauth2/access_token", {
        headers: {
          Accept: 'application/json',
          "User-Agent": userAgent
        },
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: config.secret,
          grant_type: 'authorization_code',
          redirect_uri: Meteor.absoluteUrl("_oauth/foursquare?close"),
          state: query.credentialToken
        }
      });
  } catch (err) {
    throw _.extend(new Error("Failed to complete OAuth handshake with Foursquare. " + err.message),
                   {response: err.response});
  }
  if (response.data.error) { // if the http response was a json object with an error attribute
    throw new Error("Failed to complete OAuth handshake with Foursquare. " + response.data.error);
  } else {
    return response.data.access_token;
  }
};

var getIdentity = function (accessToken) {
  try {
    return HTTP.get(
      "https://api.foursquare.com/v2/users/self", {
        headers: {"User-Agent": userAgent},
        params: {
          oauth_token: accessToken,
          v: '20140331'
        }
      }).data.response.user;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Foursquare. " + err.message),
                   {response: err.response});
  }
};


Foursquare.retrieveCredential = function(credentialToken) {
  return Oauth.retrieveCredential(credentialToken);
};
