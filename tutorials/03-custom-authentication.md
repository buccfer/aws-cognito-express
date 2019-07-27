If you are not using Express.js or if you want to write your custom authentication and error handling logic, this module 
exports some helpers you can use to achieve such goal.

### Validating tokens

To write your custom authentication logic, you can make use of the [JWTValidator](JWTValidator.html) class.

> **IMPORTANT**: You *must* instantiate a validator **only once** and then use it to validate the tokens in each request.
To be initialized, validators make an http request to the Cognito's JWKS endpoint. So if you instantiate a new validator
for each request, you will add unnecessary overhead due to the initialization process.

```javascript
'use strict';

const { JWTValidator } = require('aws-cognito-express');

const jwtValidator = new JWTValidator({
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
});

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

jwtValidator.validate(token)
  .then(jwtPayload => console.log(jwtPayload))
  .catch(err => console.error(err));
```

### Handling validation errors

This module exports a convenient function [isJWTValidatorError](global.html#isJWTValidatorError) that you can use in your 
custom error handlers to verify if the error was thrown by the JWT validator.

```javascript
'use strict';

const { JWTValidator, isJWTValidatorError } = require('aws-cognito-express');

const jwtValidator = new JWTValidator({
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
});

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const err = new Error('Unexpected error');
isJWTValidatorError(err);
// => false

jwtValidator.validate(token)
  .catch((err) => {
    isJWTValidatorError(err);
    // => true
  });
```