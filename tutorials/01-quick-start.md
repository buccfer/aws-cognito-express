#### 1. Make sure you have Node.js >= 8.
```bash
$ node -v
=> v10.16.0
```

#### 2. Install aws-cognito-express using npm.
```bash
$ npm install --save aws-cognito-express
```

#### 3. Add the authentication middleware and error handler to your Express.js application.
```javascript
// app.js
'use strict';

const express = require('express');
const { authenticate, authenticationError } = require('aws-cognito-express');

const app = express();

// Add the authentication middleware.
app.use(authenticate({
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
}));

// Protected route.
app.get('/articles', (req, res, next) => {
  console.log('JWT payload: ', req.cognito);
});

// Add the authentication error handler.
app.use(authenticationError());

module.exports = app;
```