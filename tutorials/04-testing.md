If you want to write your application tests without the need of creating a Cognito User Pool, instances of the 
[JWTValidator](JWTValidator.html) class have an additional property **pems** that you can provide in the constructor **config** 
parameter.
 
When a JWT validator is instantiated with the *pems* property, no initialization process takes place. This means that there 
won't be any http request to Cognito to fetch the JWKS.

In the following sections we illustrate how to set the *pems* property and how to create valid JWTs for testing.

## 1. Setting custom pems

#### 1.1. Creating an RSA key pair

In order to create your own JWTs for testing you will first need a RSA key pair to sign those tokens. To generate a RSA key pair 
and store it in the *rsa_keys* folder you can use OpenSSL as follows:

```bash
# Create destination folder.
$ mkdir -p rsa_keys

# Generate private key.
$ openssl genrsa -out rsa_keys/key.pem 2048

# Extract the public part of the private key.
$ openssl rsa -in rsa_keys/key.pem -pubout -out rsa_keys/key.pub
```

#### 1.2. Setting the pems property

The *pems* property must be set to a non-empty object with the following structure:

```javascript
const pems = {
  key_1: '-----BEGIN PUBLIC KEY-----\n ... \n-----END PUBLIC KEY-----\n',
  key_2: '-----BEGIN PUBLIC KEY-----\n ... \n-----END PUBLIC KEY-----\n'
};
```

where each key is the value of the JWT *kid* header and each value is a string containing the PEM encoded RSA public key.
As an example:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const { JWTValidator } = require('aws-cognito-express');

const jwtValidatorConfig = {
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
};

if (process.env.NODE_ENV === 'test') {
  jwtValidatorConfig.pems = {
    my_custom_key_id: fs.readFileSync(path.join(__dirname, 'rsa_keys', 'key.pub'), 'ascii')
  };
}

const jwtValidator = new JWTValidator(jwtValidatorConfig);
```

If you are using the Express.js authentication middleware provided by this library, then you should provide the *pems*
property in the *config* parameter of the [authenticate](global.html#authenticate) function as follows:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { authenticate } = require('aws-cognito-express');

const app = express();

const authenticateConfig = {
  region: 'us-east-2',
  userPoolId: 'us-east-2_6IfDT7ZUq',
  tokenUse: ['id', 'access'],
  audience: ['55plsi2cl0o267lfusmgaf67pf']
};

if (process.env.NODE_ENV === 'test') {
  authenticateConfig.pems = {
    my_custom_key_id: fs.readFileSync(path.join(__dirname, 'rsa_keys', 'key.pub'), 'ascii')
  };
}

app.use(authenticate(authenticateConfig));

module.exports = app;
```

## 2. Creating valid JWTs for testing

To generate valid JWTs to authenticate your users in your tests, you can use the [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) 
library. Since the JWTs you are going to create are just for testing purposes, you only need to install the *jsonwebtoken* 
library as a dev dependency.

```bash
$ npm install --save-dev jsonwebtoken
```

In the example below, we illustrate how to create a JWT such that the JWT validator recognizes it as a valid token.

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// The token use must be one of the token uses provided in the config. ('id'|'access')
const token_use = 'access';

// The JWT payload. It must include the `token_use` field.
const payload = {
  token_use,
  email: 'john.doe@example.com',
  email_verified: true,
  // ...
};

// The RSA private key to be used to sign the JWT.
const privateKey = fs.readFileSync(path.join(__dirname, 'rsa_keys', 'key.pem'), 'ascii');

// The value of the JWT `kid` header. It must have a value such that `pems[keyid]` is the
// public key of the given `privateKey`.
const keyid = 'my_custom_key_id';

// The value of the JWT `aud` field. It must be one of the audiences provided in the config.
const audience = '55plsi2cl0o267lfusmgaf67pf';

// The value of the JWT `iss` field. It must have the format https://cognito-idp.{region}.amazonaws.com/{userPoolId}
const issuer = 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_6IfDT7ZUq';

// Generate the token.
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn: 3600,
  keyid,
  audience,
  issuer
});

console.log('Token: ', token);
// => Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```