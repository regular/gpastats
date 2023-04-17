//jshint esversion: 11
//jshint -W033
const agg = require('./aggregate')
const {DateTime} = require('luxon')
const test = require('tape')

const conf = {tz: 'Europe/Berlin'}

test('makes bucket', t=>{
  const {add} = agg(conf, 7, data=>data.platform)
  const b = add(null, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-01').toSeconds() * 1000,
      count: 2,
      platform: 'IOS'
    }
  })
  t.deepEqual(b, {
    key: '2023-03',
    value: { IOS: 2 } 
  })
  t.end()
})

test('fitsBucket', t=>{
  const {add, fitsBucket} = agg(conf, 7, data=>data.platform)
  const b = add(null, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-01').toSeconds() * 1000,
      count: 2,
      platform: 'IOS'
    }
  })
  t.deepEqual(b, {
    key: '2023-03',
    value: { IOS: 2 } 
  })
  t.ok(fitsBucket(b, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-06').toSeconds() * 1000,
      count: 5,
      platform: 'IOS'
    }
  }))
  t.notOk(fitsBucket(b, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-04-01').toSeconds() * 1000,
      count: 5,
      platform: 'IOS'
    }
  }))
  t.end()
})

test('add to bucket', t=>{
  const {add} = agg(conf, 7, data=>data.platform)
  let b = add(null, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-01').toSeconds() * 1000,
      count: 2,
      platform: 'IOS'
    }
  })

  b = add(b, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-06').toSeconds() * 1000,
      count: 5,
      platform: 'IOS'
    }
  })
  b = add(b, {
    type: 'appInfo',
    data: {
      timestamp: DateTime.fromISO('2023-03-29').toSeconds() * 1000,
      count: 4,
      platform: 'ANDROID'
    }
  })
  t.deepEqual(b, {
    key: '2023-03',
    value: { IOS: 7, ANDROID: 4 } 
  })
  t.end()
})
