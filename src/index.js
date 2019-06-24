'use strict'

const AWSCognitoJWTValidator = require('./validator')
const isAWSCognitoJWTValidatorError = require('./is-validator-error')

module.exports = {
  AWSCognitoJWTValidator,
  isAWSCognitoJWTValidatorError
}
