
var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "806152709565461";
var FACEBOOK_APP_SECRET = "34562a1ff83f455e7aba07d1c4c3bb0d";


module.exports = function(passport) {
    passport.use('facebook',new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: "http://localhost:4000/auth/facebook/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            console.log(profile);
            var user = {
                'email': profile.emails[0].value,
                'name' : profile.name.givenName + ' ' + profile.name.familyName,
                'id'   : profile.id,
                'token': accessToken
            };
            return done(null, user);
        }
    ));
};