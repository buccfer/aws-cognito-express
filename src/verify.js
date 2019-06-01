'use strict'

const jwt = require('jsonwebtoken')
const { InvalidJWTError } = require('./errors')

/**
 * @description Verifies the JWT signature. If valid, it returns the decoded payload.
 * This function is just a promise wrapper of the jsonwebtoken's verify function.
 *
 * @param {String} token - The JSON web token.
 * @param {String} pem - The PEM encoded public RSA key.
 * @param {Object} [options = {}] - Additional options for jsonwebtoken's verify function.
 *
 * @returns {Promise<Object>} A promise that resolves to the decoded JWT payload if the verification
 * succeeds. Otherwise, it is rejected with the appropriate error.
 * */
const verify = (token, pem, options = {}) => new Promise((resolve, reject) => {
  // TODO: finish this with default options.
  jwt.verify(token, pem, options, (err, payload) => {
    if (err) return reject(new InvalidJWTError(err.message))
    return resolve(payload)
  })
})

module.exports = verify
