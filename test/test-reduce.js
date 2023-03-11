//jshint -W033
//jshint -W018
//jshint  esversion: 11
const test = require('tape')
const pull = require('pull-stream')
const Reduce = require('../reduce')

test('creates sums of counts of equal entries', t=>{
  t.plan(1)
  const values = [ 
    [ 10, 'foo', 2 ],
    [ 11, 'bar', 10 ],
    [ 12, 'foo', 100 ]
  ]

  const reduce = Reduce()
  t.deepEqual(reduce(values), [
    [ 10, 'foo', 102 ],
    [ 10, 'bar', 10 ]
  ])
})
