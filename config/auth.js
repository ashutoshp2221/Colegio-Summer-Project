// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {
    'googleAuth' : {
        'clientID'         : process.env.CLIENTID,
        'clientSecret'     : process.env.CLIENTSECRET,
        'callbackURL'      : process.env.NODE_ENV === "production" ? process.env.CALLBACKURL : "http://localhost:3000/auth/google/callback"
    }
};
