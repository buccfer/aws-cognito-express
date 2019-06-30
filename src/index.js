'use strict'

const JWTValidator = require('./lib/jwt-validator')
const isJWTValidatorError = require('./lib/is-jwt-validator-error')
const { authenticate, authenticationError } = require('./middlewares')

module.exports = {
  JWTValidator,
  isJWTValidatorError,
  authenticate,
  authenticationError
}
