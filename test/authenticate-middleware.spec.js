'use strict'

const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('../src/constants')

describe('Authenticate middleware', () => {
  it('Should throw ConfigurationError if config is invalid')
  it('Should return a middleware')
  it(`Should call next with an InvalidJWTError if ${AUTHORIZATION_HEADER} header is missing`)
  it(`Should call next with an InvalidJWTError if authentication scheme is not ${AUTHENTICATION_SCHEME}`)
  it('Should call next with the error if the token is invalid')
  it('Should validate the token and set req.cognito with the JWT payload')
})
