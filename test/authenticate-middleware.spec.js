'use strict'

const { expect, sinon, chance } = require('./index')
const { generateConfig, signToken } = require('./util')
const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('../src/constants')
const { authenticate } = require('../src')
const { ConfigurationError, InvalidJWTError } = require('../src/errors')

describe('Authenticate', () => {
  it('Should throw ConfigurationError if config is invalid', () => {
    const config = generateConfig()
    Reflect.deleteProperty(config, 'userPoolId')
    expect(() => authenticate(config)).to.throw(ConfigurationError, /"userPoolId" is required/)
  })

  it('Should return a middleware', () => {
    const config = generateConfig()
    const authenticateMiddleware = authenticate(config)
    expect(authenticateMiddleware).to.be.a('function')
    expect(authenticateMiddleware.length).to.equal(3)
  })

  describe('Middleware', () => {
    const res = {}
    let config
    let authenticateMiddleware
    let req
    let next
    let tokenPayload

    beforeEach(() => {
      config = generateConfig()
      authenticateMiddleware = authenticate(config)
      next = sinon.spy()
      tokenPayload = { email: chance.email(), email_verified: chance.bool() }
    })

    it(`Should call next with an InvalidJWTError if ${AUTHORIZATION_HEADER} header is missing`, async () => {
      req = { header: name => undefined } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      const err = next.getCall(0).args[0]
      expect(err).to.be.an.instanceOf(InvalidJWTError)
      expect(err.message).to.equal(`Missing ${AUTHORIZATION_HEADER} header.`)
    })

    it(`Should call next with an InvalidJWTError if scheme is not ${AUTHENTICATION_SCHEME}`, async () => {
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(config.audience),
        issuer: `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`,
        tokenUse: chance.pickone(config.tokenUse)
      })
      req = { header: name => `Basic ${token}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      const err = next.getCall(0).args[0]
      expect(err).to.be.an.instanceOf(InvalidJWTError)
      expect(err.message).to.equal('Invalid authentication scheme.')
    })

    it('Should call next with the error if the token is invalid')
    it('Should validate the token and set req.cognito with the JWT payload')
  })
})
