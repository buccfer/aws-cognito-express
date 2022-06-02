# AWS Cognito Express

[![NPM](https://nodei.co/npm/aws-cognito-express.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/aws-cognito-express/)

[![Build Status](https://app.travis-ci.com/buccfer/aws-cognito-express.svg?branch=master)](https://app.travis-ci.com/github/buccfer/aws-cognito-express)
[![Maintainability](https://api.codeclimate.com/v1/badges/8d53f5de9594eab264e2/maintainability)](https://codeclimate.com/github/buccfer/aws-cognito-express/maintainability)
[![Coverage Status](https://coveralls.io/repos/github/buccfer/aws-cognito-express/badge.svg?branch=master)](https://coveralls.io/github/buccfer/aws-cognito-express?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/buccfer/aws-cognito-express/badge.svg?targetFile=package.json)](https://snyk.io/test/github/buccfer/aws-cognito-express?targetFile=package.json)
[![License](https://badgen.net/badge/license/MIT/blue)](LICENSE)

![Logo](https://s3.us-east-2.amazonaws.com/assets.buccfer.io/aws-cognito-express/logo_333x333.png)

This module authenticates requests on a Node.js application by verifying the `Access` and `ID` tokens issued by AWS Cognito.
It implements the [AWS Guideline for JWT validation](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html).

## Table of contents
- [Use cases](#use-cases)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Documentation](https://buccfer.github.io/aws-cognito-express/tutorial-01-quick-start.html)
- [Releases](https://github.com/buccfer/aws-cognito-express/wiki/Changelog)
- [Responsible disclosure](#responsible-disclosure)

## Use cases
This module offers an out of the box solution to authenticate requests on an Express.js application by verifying the AWS Cognito JWTs sent in the `Authorization` header using the [Bearer scheme](https://tools.ietf.org/html/rfc6750). 

Besides, it was designed so that it has the maximum flexibility. So, if you are not using Express.js, you can still use the `JWTValidator` class and create your custom authentication flow.

In the following picture, we illustrate which part of the authentication flow is covered by this module.

![Authentication Flow](https://www.lucidchart.com/publicSegments/view/567ce1d8-394e-42a5-90a1-f35671a150a5/image.png)

## Features
The following are the features included in this module:

- JWT signature verification.
- JWT claims verification.
  - Verify that the token is not expired.
  - Verify that the audience (aud) claim matches one of the valid audiences provided in the configuration.
  - Verify that the issuer (iss) claim is valid for the configured user pool.
  - Verify that the token_use claim matches one of the valid token uses provided in the configuration.
- Support for JWKs rotation as per described in the [JWT signing key rotation](https://forums.aws.amazon.com/thread.jspa?threadID=241570) thread.
- Ability to set custom pems for local testing without the need of creating a User Pool.

## Prerequisites
You will need:

1. An AWS account. If you don't have one you can sign up [here](https://aws.amazon.com).
2. A Cognito User Pool configured with at least one client application.
3. Node.js 14 or above.

## Installation
```bash
$ npm install --save aws-cognito-express
```

## Responsible disclosure
If you have any security issue to report, contact project maintainers privately. You can find contact information in [CONTACT.md](CONTACT.md).