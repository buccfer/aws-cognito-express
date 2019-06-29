'use strict'

const { expect, httpStatus, sinon, chance } = require('./index')
const { authenticationErrorHandler } = require('../src')
const { InvalidJWTError } = require('../src/errors')
const { AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME } = require('../src/constants')

describe('Error handler', () => {
  const req = {}
  let errorHandler
  let res
  let next

  beforeEach(() => {
    errorHandler = authenticationErrorHandler()
    res = {
      /* eslint-disable no-unused-vars */
      status(statusCode) { return this },
      header(name, value) { return this },
      json(payload) { return this }
      /* eslint-enable no-unused-vars */
    }
    next = sinon.spy()
  })

  it('Should return an error handler', () => {
    expect(errorHandler).to.be.a('function')
    expect(errorHandler.length).to.equal(4)
  })

  it('Should pass the error to the next error handler if the error is not from this library', () => {
    const err = new Error(chance.sentence())
    errorHandler(err, req, res, next)
    expect(next.withArgs(err).calledOnce).to.be.true
  })

  it(`Should respond ${httpStatus.UNAUTHORIZED} if the error is from this library`, () => {
    const err = new InvalidJWTError(chance.sentence())
    const responsePayload = {
      statusCode: httpStatus.UNAUTHORIZED,
      error: httpStatus[httpStatus.UNAUTHORIZED],
      message: err.message
    }
    const statusSpy = sinon.spy(res, 'status')
    const headerSpy = sinon.spy(res, 'header')
    const jsonSpy = sinon.spy(res, 'json')

    errorHandler(err, req, res, next)
    expect(next.called).to.be.false
    expect(statusSpy.withArgs(httpStatus.UNAUTHORIZED).calledOnce).to.be.true
    expect(headerSpy.withArgs(AUTHENTICATION_SCHEME_HEADER, AUTHENTICATION_SCHEME).calledOnce).to.be.true
    expect(jsonSpy.withArgs(responsePayload).calledOnce).to.be.true

    statusSpy.restore()
    headerSpy.restore()
    jsonSpy.restore()
  })
})
