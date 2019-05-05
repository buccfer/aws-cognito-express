'use strict'

const { expect } = require('./index')
const mult = require('../src')

describe('Validator', () => {
  it('Should pass', () => {
    expect(mult(2, 2)).to.equal(4)
  })
})
