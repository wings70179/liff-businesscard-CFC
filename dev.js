const { build } = require('./build')
const { getBaseurl } = require('./utils')
const { promises: fsPromises } = require('fs')
const finalhandler = require('finalhandler')
const http = require('http') // 1. 把 https 改成 http
const livereload = require('livereload')
const log = require('debug')('app:watch')
const path = require('path')
const serveStatic = require('serve-static')
const watch = require('node-watch')

// 這個函數現在不重要了，但保留它以免其他地方報錯
async function readMkcert () {
  return null 
}

async function main () {
  const publicDir = path.resolve(__dirname, 'dist')
  const baseurl = getBaseurl().replace('https://', 'http://') // 2. 強制把網址換成 http
  await build()
  log(`build finish. Visit: ${baseurl}`)

  const livereloadServer = livereload.createServer({
    delay: 1000,
    port: 3000,
    // 3. 這裡關鍵：把 https.createServer 改成 http.createServer，並移除 readMkcert()
    server: http.createServer(async (req, res) => {
      serveStatic(publicDir, {
        index: ['index.html', 'index.htm'],
      })(req, res, finalhandler(req, res))
    }),
  })

  watch(['./component', './i18n', './layout', './src'], { recursive: true, delay: 1000 }, async (e, name) => {
    const match = name.match(/^src[\\/](.+)\.pug$/)
    await build()
    if (!match) log(`"${name}" changed.`)
    else log(`${baseurl}${match[1].replace(/\\/g, '/')}.html`)
    livereloadServer.refresh('')
  })
}

main()