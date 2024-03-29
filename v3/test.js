//jshint esversion: 11
//jshint -W033
const pull = require('pull-stream')
const tmp = require('tmp')
const Log = require('flumelog-array')
const Flume = require('flumedb')
const {join} = require('path')
const {DateTime} = require('luxon')
const test = require('tape')

const addViews = require('./views')

const tz = 'Europe/Berlin'
const ts = require('../util/make-timestamp')(tz)

test('menu items', t=>{
  const log = Log()
  log.filename = join(tmp.dirSync({unsafeCleanup: true}).name, 'xxx')
  let db = Flume(log)
  addViews(db, {tz})
   
  db.append([
    {
      type: 'menuSectionItem',
      data: {
        verb: 'SELECTED',
        locale: 'de',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: ts('2023-01-01T12:00').toSeconds() * 1000
      }
    }, {
      type: 'menuSectionItem',
      data: {
        verb: 'SELECTED',
        locale: 'es',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: ts('2023-12-31T23:59').toSeconds() * 1000
      }
    }, {
      type: 'menuSectionItem',
      data: {
        verb: 'SELECTED',
        locale: 'en',
        entitySuuid: 'menu1',
        count: 1,
        timestamp: ts('2024-01-01T12:00').toSeconds() * 1000
      }
    }
  ], (err, seq) => {
    console.log('seq', seq)
    t.notOk(err, 'write events to db')
    const v = db.gpav3_menu_by_year
    v.since(x=>{
      console.log('v.since',x)
    })
    pull(
      v.read({
        keys: true,
        values: true
      }),
      pull.through(console.log),
      pull.collect( (err, items)=>{
        t.notOk(err, 'read menu_by_year')
        t.deepEqual(items, [
          { key: '2023', value: { 'de:menu1': 1, 'es:menu1': 1 } },
          { key: '2024', value: { 'en:menu1': 1} }
        ])
        t.end()
      })
    )
  })
})

test('zone by month-weekday', t=>{
  const log = Log()
  log.filename = join(tmp.dirSync({unsafeCleanup: true}).name, 'xxx')
  let db = Flume(log)
  addViews(db, {tz})
   
  db.append([
    {
      type: 'zone',
      data: {
        verb: 'ENTERED',
        entitySuuid: 'hall',
        count: 1,
        timestamp: ts('2023-04-21').toSeconds() * 1000
      }
    }, {
      type: 'zone',
      data: {
        verb: 'ENTERED',
        entitySuuid: 'hall',
        count: 2,
        timestamp: ts('2023-04-28').toSeconds() * 1000
      }
    }
  ], (err, seq) => {
    console.log('seq', seq)
    t.notOk(err, 'write events to db')
    const v = db['gpav3_zone_by_month-weekday']
    v.since(x=>{
      console.log('v.since',x)
    })
    pull(
      v.read({
        keys: true,
        values: true
      }),
      pull.through(console.log),
      pull.collect( (err, items)=>{
        t.notOk(err, 'read view')
        t.deepEqual(items, [
          { key: '2023-04', value: {'5-Fri': { 'hall': 3 } } },
        ])
        t.end()
      })
    )
  })
})

