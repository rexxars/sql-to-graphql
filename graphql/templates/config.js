'use strict'
module.exports = opts => {
  const typeDefJS = `module.exports = {
  client: '${opts.backend}',
  useNullAsDefault: true,
  connection: {
  ${opts.backend === 'sqlite'
    ? `      filename: '${opts['db-filename']}'`
    : `host: '${opts.host.replace(/\\/g, '\\\\')}',
  port: '${opts.port}',
  user: '${opts.user}',
  password: '${opts.password}',
  database: '${opts.db}'
`}
  }
}`

  return typeDefJS
}
