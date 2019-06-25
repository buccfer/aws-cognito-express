'use strict'

const AWSCognitoJWTValidator = require('./validator')
const isAWSCognitoJWTValidatorError = require('./is-validator-error')
const authenticationErrorHandler = require('./error-handler')

module.exports = {
  AWSCognitoJWTValidator,
  isAWSCognitoJWTValidatorError,
  authenticationErrorHandler
}
