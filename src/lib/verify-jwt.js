'use strict'

const jwt = require('jsonwebtoken')
const { InvalidJWTError } = require('./errors')

/**
 * @private
 * @description Validates the JWT audience.
 * @param {string[]} tokenAudience - The JWT audience.
 * @param {string[]} validAudience - The valid audience.
 * @returns {boolean} Whether the token audience is valid or not.
 * */
const validateAudience = (tokenAudience, validAudience) => {
  const validAudienceSet = new Set(validAudience)
  return tokenAudience.some((audience) => validAudienceSet.has(audience))
}

/**
 * @private
 * @description Verifies the JWT signature. If valid, it returns the decoded payload.
 * @param {string} token - The JSON web token.
 * @param {string} pem - The PEM encoded public RSA key.
 * @param {Object} options - Additional fields to validate.
 * @param {string[]} options.audience - A set of valid values for the audience (aud or client_id) field.
 * @param {string} options.issuer - A valid value for the issuer (iss) field.
 * @param {string[]} options.tokenUse - A set of valid values for the token use (token_use) field.
 * @returns {Promise<Object>} A promise that resolves to the decoded JWT payload if the verification
 * succeeds. Otherwise, it is rejected with the appropriate error.
 * */
const verifyJwt = (token, pem, { audience, issuer, tokenUse }) => new Promise((resolve, reject) => {
  const opts = {
    algorithms: ['RS256'],
    complete: false,
    ignoreExpiration: false,
    issuer
  }

  jwt.verify(token, pem, opts, (err, payload) => {
    if (err) return reject(new InvalidJWTError(err.message))

    if (!tokenUse.includes(payload.token_use)) {
      return reject(new InvalidJWTError(`"${payload.token_use}" tokens are not allowed`))
    }

    // Cognito access tokens don't have an "aud" claim, so we need to check the "client_id" claim instead.
    // See https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html#http-api-jwt-authorizer.evaluation
    let tokenAudience = payload.aud || payload.client_id
    tokenAudience = Array.isArray(tokenAudience) ? tokenAudience : [tokenAudience]

    const hasValidAudience = validateAudience(tokenAudience, audience)

    if (!hasValidAudience) {
      return reject(new InvalidJWTError(`jwt audience invalid. expected: ${audience.join(' or ')}`))
    }

    return resolve(payload)
  })
})

module.exports = verifyJwt
