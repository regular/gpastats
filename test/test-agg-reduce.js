//jshint -W033
//jshint -W018
//jshint  esversion: 11
const test = require('tape')
const pull = require('pull-stream')
const agg = require('../aggregate')
const Reduce = require('../reduce')

test('combine entries based on timestamp', t=>{
  pull(
    pull.values([
      [0, 'foo', 100],
      [1, 'bar', 20],
      [5, 'foo', 110],
      [11, 'bar', 1],
      [12, 'foo', 2]
    ]),
    agg(agg.deltaT(10), Reduce()),
    pull.collect( (err, values)=>{
      t.equal(err, null)
      t.deepEqual(values, [
        [ [0, 'foo', 210], [0, 'bar', 20] ],
        [ [11, 'bar', 1], [11, 'foo', 2] ]
      ])
      t.end()
    })
  )
})
