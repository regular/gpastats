//jshint -W033
//jshint -W018
//jshint  esversion: 11
const pull = require('pull-stream')
const reduce = require('./reduce')

pull(
  pull.values([
    [ 
      [ 0, 'foo', 2 ],
      [ 1, 'bar', 10 ],
      [ 5, 'foo', 100 ]
    ], [ 
      [ 11, 'bar', 1 ],
      [ 12, 'foo', 2 ] 
    ]
  ]),
  reduce(),
  pull.log()
)
