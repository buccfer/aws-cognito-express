'use strict'

const httpStatus = require('http-status')
const debug = require('../lib/debug')
const isJWTValidatorError = require('../lib/is-jwt-validator-error')
const { AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME } = require('../lib/constants')

/**
 * @description An Express authentication error handler generator.
 * @returns {Function} An Express authentication error handler.
 *
 * @example
 *
 * 'use strict';
 *
 * const express = require('express');
 * const { authenticationError } = require('aws-cognito-express');
 *
 * const app = express();
 *
 * app.use(authenticationError());
 * */
const authenticationError = () => (err, req, res, next) => {
  if (!isJWTValidatorError(err)) {
    debug('Error is not a JWT Validator error. Passing it to the next error handler. Error: %O', err)
    return next(err)
  }

  const statusCode = httpStatus.UNAUTHORIZED

  debug(`Error is a JWT Validator error. Sending response with status code ${statusCode}..`)
  return res.status(statusCode)
    .header(AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME)
    .json({
      statusCode,
      error: httpStatus[statusCode],
      message: err.message
    })
}

module.exports = authenticationError
