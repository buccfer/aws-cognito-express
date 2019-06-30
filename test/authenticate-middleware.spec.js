'use strict'

const { expect } = require('./index')
const { generateConfig } = require('./util')
const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('../src/constants')
const { authenticate } = require('../src')
const { ConfigurationError } = require('../src/errors')

describe('Authenticate middleware', () => {
  it('Should throw ConfigurationError if config is invalid', () => {
    const config = generateConfig()
    Reflect.deleteProperty(config, 'userPoolId')
    expect(() => authenticate(config)).to.throw(ConfigurationError, /"userPoolId" is required/)
  })

  it('Should return a middleware')
  it(`Should call next with an InvalidJWTError if ${AUTHORIZATION_HEADER} header is missing`)
  it(`Should call next with an InvalidJWTError if authentication scheme is not ${AUTHENTICATION_SCHEME}`)
  it('Should call next with the error if the token is invalid')
  it('Should validate the token and set req.cognito with the JWT payload')
})
