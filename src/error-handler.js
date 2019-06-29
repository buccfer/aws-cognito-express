'use strict'

const httpStatus = require('http-status')
const isAWSCognitoJWTValidatorError = require('./is-validator-error')
const { AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME } = require('./constants')

/**
 * @description An Express error handler generator.
 *
 * @returns {Function} An Express error handler for authentication errors.
 *
 * @example
 *
 * 'use strict';
 *
 * const express = require('express');
 * const { authenticationErrorHandler } = require('aws-cognito-express');
 *
 * const app = express();
 * app.use(authenticationErrorHandler());
 * */
const authenticationErrorHandler = () => (err, req, res, next) => {
  if (!isAWSCognitoJWTValidatorError(err)) return next(err)

  const statusCode = httpStatus.UNAUTHORIZED

  return res.status(statusCode)
    .header(AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME)
    .json({
      statusCode,
      error: httpStatus[statusCode],
      message: err.message
    })
}

module.exports = authenticationErrorHandler
