'use strict'

const AWSCognitoJWTValidator = require('./validator')
const isAWSCognitoJWTValidatorError = require('./is-validator-error')
const authenticationErrorHandler = require('./error-handler')
const authenticate = require('./authenticate-middleware')

module.exports = {
  AWSCognitoJWTValidator,
  isAWSCognitoJWTValidatorError,
  authenticationErrorHandler,
  authenticate
}
