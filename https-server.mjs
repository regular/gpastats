import AutoEncrypt from '@small-tech/auto-encrypt'

export const create = function(config, handler, cb) {

  const server = AutoEncrypt.https.createServer(config, handler) 

  server.listen({
    port: 443,
  }, cb)

  return server
}

// TODO: close server

