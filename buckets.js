//jshint -W033
//jshint -W018
//jshint  esversion: 11
const {DateTime} = require('luxon')

module.exports = function(tz) {

  function deltaT(deltaT) {
    return function(item, item0) {
      const [ts0] = item0
      const [ts] = item
      return ts - ts0 <= deltaT
    }
  }

  function sameYear() {
    return dt_deco( (dt, dt0) => {
      return dt.year == dt0.year
    })
  }

  function sameMonth() {
    return dt_deco( (dt, dt0) => {
      if (dt.year !== dt0.year) return false
      if (dt.month !== dt0.month) return false
      return true
    })
  }

  function sameDay() {
    return dt_deco( (dt, dt0) => {
      if (dt.year !== dt0.year) return false
      if (dt.month !== dt0.month) return false
      if (dt.day !== dt0.day) return false
      return true
    })
  }

  function sameHour() {
    return dt_deco( (dt, dt0) => {
      if (dt.year !== dt0.year) return false
      if (dt.month !== dt0.month) return false
      if (dt.day !== dt0.day) return false
      if (dt.hour !== dt0.hour) return false
      return true
    })
  }

  function sameMonthAndHour() {
    return dt_deco( (dt, dt0) => {
      if (dt.year !== dt0.year) return false
      if (dt.month !== dt0.month) return false
      if (dt.hour !== dt0.hour) return false
      return true
    })
  }
    
  return {
    deltaT,
    sameYear,
    sameMonth,
    sameDay,
    sameHour,
    sameMonthAndHour
  }

  function dt_deco(f) {
    let cache = [-1]
    return function(item, item0) {
      const [ts0] = item0
      const [ts] = item
      
      let dt0
      if (ts0 == cache[0]) {
        dt0 = cache[1]
      } else {
        dt0 = datetime(ts0)
        cache = [ts0, dt0]
      }
      const dt = datetime(ts)
      return f(dt, dt0)
    }
  }
  function datetime(seconds) {
    return DateTime.fromSeconds(seconds).setZone(tz)
  }
}

