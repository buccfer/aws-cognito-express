'use strict'

class BaseError extends Error {
  /**
   * @description Instantiates a BaseError.
   *
   * @param {String} message - The error message.
   *
   * @returns {BaseError} An instance of a BaseError.
   * */
  constructor(message) {
    super()
    this.message = message
    this.name = this.constructor.name
    this.isAWSCognitoJWTValidator = true
    Error.captureStackTrace(this, this.constructor)
  }
}

class ConfigurationError extends BaseError {
  /**
   * @description Instantiates a ConfigurationError.
   *
   * @param {Error} err - An instance of a Joi ValidationError.
   *
   * @returns {ConfigurationError} An instance of a ConfigurationError.
   * */
  constructor(err) {
    const errDescription = err.details.map(error => error.message).join(', ')
    super(`Invalid configuration: ${errDescription}`)
  }
}

class JWKsNotFoundError extends BaseError {
  /**
   * @description Instantiates a JWKsNotFoundError.
   *
   * @param {Error} err - An instance of an Axios HTTP Error.
   *
   * @returns {JWKsNotFoundError} An instance of a JWKsNotFoundError.
   * */
  constructor(err) {
    let errMsg

    if (err.response) {
      errMsg = `Response error: The server responded with status code ${err.response.status}.`
    } else if (err.request) {
      errMsg = 'Response error: No response from server.'
    } else {
      errMsg = `Request error: ${err.message}.`
    }

    super(errMsg)
  }
}

module.exports = {
  ConfigurationError,
  JWKsNotFoundError
}
