const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const log4js = require('./utils/log4js')
const util = require('./utils/util')
const users = require('./routes/users')
const menu = require('./routes/menu')
const role = require('./routes/role')
const dept = require('./routes/dept')
const leave = require('./routes/leave')
// const jwt = require('jsonwebtoken');
const kaojwt = require('koa-jwt');

require('./config/db')
// error handler
onerror(app)
// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  await next().catch(err => {
    if (err.status === 401) {
      ctx.status = 200;
      ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR)
    } else {
      throw err
    }
  })
})

// secret： jwt的秘钥  unless：登录接口不需要验证
app.use(kaojwt({ secret: 'zz' }).unless({ path: [/^\/user\/login/] }))
// routes
app.use(users.routes(), users.allowedMethods())
app.use(menu.routes(), menu.allowedMethods())
app.use(role.routes(), role.allowedMethods())
app.use(dept.routes(), dept.allowedMethods())
app.use(leave.routes(), leave.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(err)
});

module.exports = app
