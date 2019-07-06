#### 1. Make sure you have Node.js >= 8.

#### 2. Install aws-cognito-express using npm:
    
```bash
$ npm install --save aws-cognito-express
```
    
#### 3. Add the Cognito authentication middleware and error handler to your Express.js application:
    
```javascript
// app.js

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { authenticate, authenticationError } = require('aws-cognito-express');
const router = require('./router');

const app = express();

app.use(bodyParser.json());

// Add authentication middleware.
app.use(authenticate({
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
}));

app.use('/', router);

// Add authentication error handler.
app.use(authenticationError());

module.exports = app;
```