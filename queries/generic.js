//jshint -W033
//jshint  esversion: 11
const FlumeLevel = require('flumeview-level')
const {DateTime} = require('luxon')
const multicb = require('multicb')
const {parse} = require('url')
const qs = require('querystring')

const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')

const aggregate = require('../aggregate')
const reduce = require('../reduce')

const viewName = 'gpa_index'

module.exports = function(db, routes, conf) {
  const {sameYear, sameMonth, sameDay, sameHour} = require('../buckets')(conf.tz)

  db.use(viewName, FlumeLevel(6, (item, seq) => {
    const {data, type} = item
    if (type == '__since') return []
    let {timestamp, verb, count} = data
    timestamp /= 1000 // ms to seconds
    count = count || 1

    function e(name, value) {
      return [name, timestamp, value, count, seq]
    }

    switch(type) {
      case 'contentUsage':
        if (verb !== 'SELECTED') return []
        return [
          e('content', `${na(data.locale)}:${na(data.entitySuuid)}`)
        ]
      case 'menuSection': 
      case 'menuSectionItem':
        if (verb !== 'SELECTED') return []
        return [
          e('menu', `${na(data.locale)}:${na(data.entitySuuid)}`)
        ]
      case 'zone':
        if (verb !== 'ENTERED') return []
        return [
          e('zone', na(data.entitySuuid))
        ]
      case 'appInfo':
        return [
          e('platform', na(data.platform)),
          e('appVersion', na(data.appVersion)),
          e('osVersion', na(data.osVersion)),
          e('device', na(data.device)),
          e('systemLocale', na(data.systemLocale))
        ]
      default: 
        return []
    }
  }))

  routes.add('/generic', (req, res)=>{
    const {pathname, query} = parse(req.url)
    const [_, __, idx] = pathname.split('/')
    console.error('reading index', idx, 'query', query)
    const params = qs.parse(query)
    const sum = params.sum
   
    const sumf = {
      byYear:  {  agg: sameYear,
                  format: dt=> `${dt.year}`},
      byMonth: {  agg: sameMonth,
                  format: dt=> `${dt.year}\t${dt.month}`},
      byDay:   {  agg: sameDay,
                  format: dt=> `${dt.year}\t${dt.month}\t${dt.day}`},
      byHour:  {  agg: sameHour,
                  format: dt=> `${dt.year}\t${dt.month}\t${dt.day}\t${dt.hour}'`}
    }

    const {agg, format} = (sumf[sum] || sumf.byMonth)

    db.suuids.get( (err, suuids) =>{
      if (err) return res.end(err.message)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')

      const source = pull(
        db[viewName].read({
          gt: [idx, null],
          lt: [idx, undefined],
          keys: true,
          values: false,
          seqs: false
        }),
        pull.map(item=>item.slice(1, item.length - 1)),
        aggregate(agg(), reduce( (x,y) => x[1] == y[1])),
        //aggregate(aggregate.deltaT(60 * 15), reduce()),
        pull.flatten(),
        
        pull.map(item=>{
          const [timestamp, ...data] = item
          
          const dt = DateTime
            .fromSeconds(timestamp)
            .setZone(conf.tz)
          
          let d = data.join('\t')
          d = d.replace(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/, id=>{
            return (suuids[id] || {}).pname || id
          })
          return `${format(dt)}\t${d}\r\n`
        })
      
      )
      toStream.source(source).pipe(res)
    })
  })
}

//-- util

function na(value) {
  return value || 'n/a'
}


const types = {
  appInfo: {
    index: 'appVersion platform osVersion device systemLocale'.split(' '),
  },
  zone: {
    filter: ({verb})=> verb == 'ENTERED',
    props: ['entitySuuid']
  },
  menuSection: {
    filter: ({verb})=> verb == 'SELECTED',
    name: 'menu',
    props: 'locale entitySuuid'.split(' '),
  },
  menuSectionItem: {
    filter: ({verb})=> verb == 'SELECTED',
    name: 'menu',
    props: 'locale entitySuuid'.split(' '),
  },
  contentUsage: {
    filter: ({verb})=> verb == 'SELECTED',
    props: 'locale entitySuuid'.split(' ')
  },

  session: {
    filter: ({verb})=> verb == 'STARTED', // TODO
    index: ['locale'],
  },
  weblink: {
    props: 'verb locale entitySuuid'.split(' ')
  }
}
