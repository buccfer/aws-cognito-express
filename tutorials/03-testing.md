If you are wondering how could you write your application tests without the need of creating a Cognito User Pool just for that, then we've got your back.
Our JWT Validator has an additional property `pems` that you can provide in the constructor `config` parameter.
 
When a validator is instantiated with the `pems` property, no initialization process takes place. This means there won't be any http request to Cognito
to fetch the JWKS.

In the following sections we illustrate how to set the `pems` property and how to create valid JWTs for testing.

### 1. Setting custom pems for the JWT Validator.

#### 1.1. Creating your RSA key pairs.

In order to create your own JWTs for testing you will need a RSA key pair to sign those tokens. To generate an RSA key pair and
store it in the `rsa_keys` folder you can use OpenSSL as follows:

```bash
# Create destination folder.
$ mkdir -p rsa_keys

# Generate private key.
$ openssl genrsa -out rsa_keys/key.pem 2048

# Extract the public part of the private key.
$ openssl rsa -in rsa_keys/key.pem -pubout -out rsa_keys/key.pub
```

#### 1.2. Setting the pems property.

The `pems` property must be set to a non-empty object with the following structure:

```javascript
const pems = {
  key_1: '-----BEGIN PUBLIC KEY-----\n(...)\n-----END PUBLIC KEY-----\n',
  key_2: '-----BEGIN PUBLIC KEY-----\n(...)\n-----END PUBLIC KEY-----\n'
};
```

where each key represents the value of the JWT `kid` header and each value is a string containing the PEM encoded RSA public key.
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

**NOTE**: If you are using the Express.js authentication middleware provided by this library, then you should provide the `pems`
property in the `config` parameter of the `authenticate` function:

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

### 2. Creating valid JWTs for testing.
