'use strict'

const { expect, chance } = require('./index')
const AWSCognitoJWTValidator = require('../src')

describe('Validator', () => {
  it('Should pass', () => {
    const validator = new AWSCognitoJWTValidator({ userPoolId: chance.hash() })
    expect(validator).to.be.an.instanceof(AWSCognitoJWTValidator).that.has.property('userPoolId')
  })
})
