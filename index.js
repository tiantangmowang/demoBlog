const path = require('path')
const express = require('express')
const session = require('express-session')//session
const MongoStore = require('connect-mongo')(session)//将 session 存储于 mongodb，结合 express-session 使用
const flash = require('connect-flash') //页面通知的中间件，基于 session 实现
const config = require('config-lite')(__dirname) //config-lite 会根据环境变量（NODE_ENV）的不同加载 config 目录下不同的配置文件 默认 config default
const routes = require('./routes')//导入文件夹 默认寻找index文件执行
const pkg = require('./package')//配置文件
const winston = require('winston')//日志
const expressWinston = require('express-winston')//express 的 winston 日志中间件
const cookieParser = require('cookie-parser');//cookie
//const bodyParser = require('body-parser');//post

const app = express()

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 设置模板引擎为 ejs
app.set('view engine', 'ejs')
//post cookie
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))
// session 中间件
app.use(session({
  name: config.session.key, // 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true, // 强制更新 session
  saveUninitialized: false, // 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}))
// flash 中间件，用来显示通知
app.use(flash())
// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
  keepExtensions: true// 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}

// 添加模板必需的三个变量
app.use( (req, res, next)=> {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})

// 正常请求的日志
// app.use(expressWinston.logger({
//   transports: [
//     new (winston.transports.Console)({
//       json: true,
//       colorize: true
//     }),
//     new winston.transports.File({
//       filename: 'logs/success.log'
//     })
//   ]
// }))

// 路由
routes(app)

// 错误请求的日志
// app.use(expressWinston.errorLogger({
//   transports: [
//     new winston.transports.Console({
//       json: true,
//       colorize: true
//     }),
//     new winston.transports.File({
//       filename: 'logs/error.log'
//     })
//   ]
// }))

app.use( (err, req, res, next)=> {
  console.error(err)
  req.flash('error', err.message)
  res.redirect('/posts')
})

// 监听端口，启动程序
app.listen(config.port,  ()=> {
  console.log(`${pkg.name} listening on port ${config.port}`)
})
