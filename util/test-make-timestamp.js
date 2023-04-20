//jshint esversion:11, -W033

const test = require('tape')
const Ts = require('./make-timestamp')

test('date', t=>{
  const berlin = Ts('Europe/Berlin')
  const newyork = Ts('America/New_York')

  t.equal(
    berlin('2023-03-01').toISO(),
    '2023-03-01T00:00:00.000+01:00'
  )
  t.equal(
    newyork('2023-03-01').toISO(),
    '2023-03-01T00:00:00.000-05:00'
  )
  t.end()
})

test('hour', t=>{
  const berlin = Ts('Europe/Berlin')
  const newyork = Ts('America/New_York')

  t.equal(
    berlin('2023-03-01T12').toISO(),
    '2023-03-01T12:00:00.000+01:00'
  )
  t.equal(
    newyork('2023-03-01T12').toISO(),
    '2023-03-01T12:00:00.000-05:00'
  )
  t.end()
})

test('minute', t=>{
  const berlin = Ts('Europe/Berlin')
  const newyork = Ts('America/New_York')

  t.equal(
    berlin('2023-03-01T12:30').toISO(),
    '2023-03-01T12:30:00.000+01:00'
  )
  t.equal(
    newyork('2023-03-01T12:30').toISO(),
    '2023-03-01T12:30:00.000-05:00'
  )
  t.end()
})

test('second', t=>{
  const berlin = Ts('Europe/Berlin')
  const newyork = Ts('America/New_York')

  t.equal(
    berlin('2023-03-01T12:30:15').toISO(),
    '2023-03-01T12:30:15.000+01:00'
  )
  t.equal(
    newyork('2023-03-01T12:30:15').toISO(),
    '2023-03-01T12:30:15.000-05:00'
  )
  t.end()
})
