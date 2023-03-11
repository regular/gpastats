//jshint -W033
//jshint -W018
//jshint  esversion: 11
const {DateTime} = require('luxon')

module.exports = function(tz) {

  function deltaT(deltaT) {
    return function(ts, ts0) {
      return ts - ts0 <= deltaT
    }
  }

  function sameYear() {
    return function(ts, ts0) {
      return datetime(ts).year == datetime(ts0).year
    }
  }

  function sameMonth() {
    return function(ts, ts0) {
      const dt = datetime(ts)
      const dt0 = datetime(ts0)
      if (dt.year !== dt0.year) return false
      if (dt.month !== dt0.month) return false
      return true
    }
  }
    
  return {
    deltaT,
    sameYear,
    sameMonth
  }

  function datetime(seconds) {
    return DateTime.fromSeconds(seconds).setZone(tz)
  }
}

