//jshint esversion: 11, -W033
//
module.exports = function addObjs(o1, o2) {
  const ret = Object.assign({}, o1)
  for(let [key, value] of Object.entries(o2)) {
    const n1 = o1[key] || 0
    const n2 = o2[key] || 0
    ret[key] = n1 + n2
  }
  return ret
}
