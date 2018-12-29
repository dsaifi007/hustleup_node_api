// local authentication
// For more details go to https://github.com/jaredhanson/passport-local
//var LocalStrategy    = require('passport-local').Strategy;
var connection=require('../config/mysql_conn');
//var passport=require('routes/passport_old');

// Facebook authentication
// For more details go to https://github.com/jaredhanson/passport-facebook
var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "806152709565461";
var FACEBOOK_APP_SECRET = "34562a1ff83f455e7aba07d1c4c3bb0d";

// Twitter authentication
// For more details go to https://github.com/jaredhanson/passport-twitter
/*var TwitterStrategy = require('passport-twitter').Strategy;
var TWITTER_CONSUMER_KEY = "<Insert Your Key Here>";
var TWITTER_CONSUMER_SECRET = "<Insert Your Secret Key Here>";*/


//var User       = require('../app/models/user');

module.exports = function() {

    // Maintaining persistent login sessions
    // serialized  authenticated user to the session
   /* passport.serializeUser(function(user, done) {
        done(null, user.id);
    });*/

    // deserialized when subsequent requests are made
    /*passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });*/


// Use the FacebookStrategy within Passport.
// Strategies in Passport require a `verify` function, which accept
// credentials (in this case, an accessToken, refreshToken, and Facebook
// profile), and invoke a callback with a user object.
    passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: "http://localhost:4000/auth/facebook/callback"
        },
        function(req, accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                if (!req.user) {
                    connection.query("Select * from ht_user_registration where email=?",profile.emails[0].value,
                        function(err, user) {
                        if (err){ return done(err);}
                        if (user) {
                            return done(null, user);
                        } else {
                            var newUser            = new User();
                            newUser.user.username    = profile.displayName;
                            newUser.user.email    = profile.emails[0].value;
                            newUser.user.name	= '';
                            newUser.user.address	= '';
                            console.log("fb data="+JSON.stringify(newUser));
                           /* newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });*/
                        }

                    });
                   /* User.findOne({ 'user.email' :  profile.emails[0].value }, function(err, user) {
                        if (err){ return done(err);}
                        if (user) {
                            return done(null, user);
                        } else {
                            var newUser            = new User();
                            newUser.user.username    = profile.displayName;
                            newUser.user.email    = profile.emails[0].value;
                            newUser.user.name	= '';
                            newUser.user.address	= '';

                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }

                    });*/
                } else {
                    var user            = req.user;
                    user.user.username    = profile.displayName;
                    user.user.email    = profile.emails[0].value;
                    user.user.name	= '';
                    user.user.address	= '';
                    console.log("fb data new="+JSON.stringify(newUser));
                    /*user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });*/
                }
            });
        }
    ));

// Use the TwitterStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a token, tokenSecret, and Twitter profile), and
// invoke a callback with a user object.
   /* passport.use(new TwitterStrategy({
            consumerKey: TWITTER_CONSUMER_KEY,
            consumerSecret: TWITTER_CONSUMER_SECRET,
            callbackURL: "http://192.168.1.101:8080/auth/twitter/callback"
        },
        function(req,token, tokenSecret, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                if (!req.user) {
                    User.findOne({ 'user.username' :  profile.displayName }, function(err, user) {
                        if (err){ return done(err);}
                        if (user) {
                            return done(null, user);
                        } else {
                            var newUser            = new User();
                            newUser.user.username    = profile.displayName;
                            newUser.user.name	= ''
                            newUser.user.address	= ''

                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }

                    });
                } else {
                    var user            = req.user;
                    user.user.username    = profile.displayName;
                    user.user.name	= ''
                    user.user.address	= ''

                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            });
        }
    ));*/
};