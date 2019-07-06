'use strict'

const JWTValidator = require('./src/lib/jwt-validator')
const isJWTValidatorError = require('./src/lib/is-jwt-validator-error')
const { authenticate, authenticationError } = require('./src/middlewares')

module.exports = {
  JWTValidator,
  isJWTValidatorError,
  authenticate,
  authenticationError
}
