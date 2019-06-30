'use strict'

const { expect, sinon, chance, nock, httpStatus, mockDate } = require('../index')
const { generateConfig, signToken, jwks } = require('../util')
const { AUTHORIZATION_HEADER, AUTHENTICATION_SCHEME } = require('../../src/lib/constants')
const { authenticate } = require('../../src')
const { ConfigurationError, InvalidJWTError } = require('../../src/lib/errors')

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
    let issuer
    let initScope

    before(() => {
      if (!nock.isActive()) nock.activate()
    })

    beforeEach(() => {
      config = generateConfig()
      authenticateMiddleware = authenticate(config)
      next = sinon.spy()
      tokenPayload = { email: chance.email(), email_verified: chance.bool() }
      issuer = `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`
      nock.cleanAll()
      initScope = nock(`${issuer}/.well-known/jwks.json`).get('').reply(httpStatus.OK, { keys: jwks })
    })

    after(() => {
      nock.cleanAll()
      nock.restore()
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
        issuer,
        tokenUse: chance.pickone(config.tokenUse)
      })
      req = { header: name => `Basic ${token}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      const err = next.getCall(0).args[0]
      expect(err).to.be.an.instanceOf(InvalidJWTError)
      expect(err.message).to.equal('Invalid authentication scheme.')
    })

    it('Should call next with the error if the token is invalid', async () => {
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(config.audience),
        issuer,
        tokenUse: chance.pickone(config.tokenUse),
        expiresIn: 10 // 10 seconds.
      })
      // Set date to now + 11 seconds.
      mockDate.set(Date.now() + 11e3)
      req = { header: name => `${AUTHENTICATION_SCHEME} ${token}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      const err = next.getCall(0).args[0]
      expect(err).to.be.an.instanceOf(InvalidJWTError)
      expect(err.message).to.equal('jwt expired')
      expect(initScope.isDone()).to.be.true
      mockDate.reset()
    })

    it('Should validate the token and set req.cognito with the JWT payload', async () => {
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(config.audience),
        issuer,
        tokenUse: chance.pickone(config.tokenUse)
      })
      req = { header: name => `${AUTHENTICATION_SCHEME} ${token}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      const err = next.getCall(0).args[0]
      expect(err).to.be.undefined
      expect(req.cognito).to.deep.include(tokenPayload)
      expect(initScope.isDone()).to.be.true
    })

    it('Should use the same validator for different requests', async () => {
      // First request makes the validator to initialize.
      const firstRequestToken = signToken('key_1', tokenPayload, {
        audience: chance.pickone(config.audience),
        issuer,
        tokenUse: chance.pickone(config.tokenUse)
      })
      req = { header: name => `${AUTHENTICATION_SCHEME} ${firstRequestToken}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      let err = next.getCall(0).args[0]
      expect(err).to.be.undefined
      expect(req.cognito).to.deep.include(tokenPayload)
      expect(initScope.isDone()).to.be.true

      // Clean mocks.
      next.resetHistory()
      nock.cleanAll()
      initScope = nock(`${issuer}/.well-known/jwks.json`).get('').reply(httpStatus.OK, { keys: jwks })

      // Second request already has the validator initialized.
      const secondRequestTokenPayload = { email: chance.email(), email_verified: chance.bool() }
      const secondRequestToken = signToken('key_2', secondRequestTokenPayload, {
        audience: chance.pickone(config.audience),
        issuer,
        tokenUse: chance.pickone(config.tokenUse)
      })
      req = { header: name => `${AUTHENTICATION_SCHEME} ${secondRequestToken}` } // eslint-disable-line no-unused-vars
      await authenticateMiddleware(req, res, next)
      expect(next.calledOnce).to.be.true
      err = next.getCall(0).args[0] // eslint-disable-line prefer-destructuring
      expect(err).to.be.undefined
      expect(req.cognito).to.deep.include(secondRequestTokenPayload)
      expect(initScope.isDone()).to.be.false
    })
  })
})
