Most use cases require that the user data is fetched from a database. For example, when you want to check the user permissions
or retrieve some data based on the user settings. In that case, you can create your own authentication middleware reusing the 
one provided by this library.

In the following example we will use the [compose-middleware](https://www.npmjs.com/package/compose-middleware) package to create 
our own authentication middleware that will:

1. Validate the JWT.
2. If the JWT is valid, it will fetch the user from the `User` MongoDB collection.

```javascript
// authentication.middleware.js
'use strict';

const HttpErrors = require('http-errors');
const mongoose = require('mongoose');
const { compose } = require('compose-middleware');
const { authenticate } = require('aws-cognito-express');

// Custom middleware to fetch the user from the 'User' MongoDB collection.
async function fetchUser(req, res, next) {
  const { email } = req.cognito;
  const User = mongoose.model('User');
  
  try {
    const user = await User.findOne({ email });

    if (!user) {
      // NOTE: You should create an error handler for http errors.
      return next(new HttpErrors.Unauthorized(`User with email ${email} does not exist`));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = compose([
  authenticate({
    region: 'us-east-2',
    userPoolId: 'us-east-2_6IfDT7ZUq',
    tokenUse: ['id', 'access'],
    audience: ['55plsi2cl0o267lfusmgaf67pf']
  }),
  fetchUser
]);
```

Finally, you can use your custom middleware as follows:

```javascript
// app.js
'use strict';

const express = require('express');
const { authenticationError } = require('aws-cognito-express');
const customAuthenticationMiddleware = require('./authentication.middleware');

const app = express();

// Add the custom authentication middleware.
app.use(customAuthenticationMiddleware);

// Protected route.
app.get('/articles', (req, res, next) => {
  console.log('Logged in user: ', req.user);
});

// Add the authentication error handler.
app.use(authenticationError());

module.exports = app;
```
