'use strict'

const debug = require('./debug')
const AWSCognitoJWTValidator = require('./validator')
const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('./constants')
const { InvalidJWTError } = require('./errors')

/**
 * @description An Express authentication middleware generator.
 *
 * @param {} config - The JWT Validator config.
 *
 * @returns {Function} An Express authentication middleware.
 *
 * @example
 *
 * 'use strict';
 *
 * const express = require('express');
 * const { authenticate } = require('aws-cognito-express');
 *
 * const app = express();
 *
 * app.use(authenticate({
 *   region: 'us-east-2',
 *   userPoolId: 'us-east-2_6IfDT7ZUq',
 *   tokenUse: ['id', 'access'],
 *   audience: ['55plsi2cl0o267lfusmgaf67pf']
 * }));
 * */
const authenticate = (config) => {
  const jwtValidator = new AWSCognitoJWTValidator(config)

  return async (req, res, next) => {
    const authorizationHeader = req.header(AUTHORIZATION_HEADER)
    debug(`${AUTHORIZATION_HEADER} header value: ${authorizationHeader}`)

    if (!authorizationHeader) {
      return next(new InvalidJWTError(`Missing ${AUTHORIZATION_HEADER} header.`))
    }

    const [authenticationScheme, token] = authorizationHeader.split(' ')

    if (authenticationScheme !== AUTHENTICATION_SCHEME) {
      return next(new InvalidJWTError('Invalid authentication scheme.'))
    }

    try {
      const payload = await jwtValidator.validate(token)
      debug('Setting req.cognito with JWT payload: %O', payload)
      req.cognito = payload
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

module.exports = authenticate
