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
mkdir -p rsa_keys

# Generate private key.
$ openssl genrsa -out rsa_keys/key.pem 2048

# Extract the public part of the private key.
$ openssl rsa -in rsa_keys/key.pem -pubout -out rsa_keys/key.pub
```

#### 1.2. Setting the 'pems' property.

### 2. Creating valid JWTs for testing.
