'use strict'

const debug = require('../lib/debug')
const JWTValidator = require('../lib/jwt-validator')
const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('../lib/constants')
const { InvalidJWTError } = require('../lib/errors')

/**
 * @description An Express authentication middleware generator.
 * @throws {ConfigurationError} The provided configuration is invalid.
 * @param {JWTValidatorConfig} config - The JWT Validator configuration.
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
  const jwtValidator = new JWTValidator(config)

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
