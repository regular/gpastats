//jshint esversion:11, -W033

const test = require('tape')
const addObjs = require('./add-objs')

test('one operand is {}', t=>{
  t.deepEqual(addObjs({
    foo: 1,
    bar: 2
  },{}), {
    foo: 1,
    bar: 2
  })
  t.deepEqual(addObjs({}, {
    foo: 1,
    bar: 2
  }), {
    foo: 1,
    bar: 2
  })
  t.end()
})

test('non-empty operands', t=>{
  t.deepEqual(addObjs({
    foo: 1,
    bar: 2,
    tre: -1
  },{
    foo: 10,
    bar: 20,
    baz: 30
  }), {
    foo: 11,
    bar: 22,
    baz: 30,
    tre: -1
  })
  t.end()
})
