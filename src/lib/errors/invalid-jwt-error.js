'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when the provided JWT is invalid.
 * @category Errors
 * @hideconstructor
 * */
class InvalidJWTError extends BaseError {}

module.exports = InvalidJWTError
