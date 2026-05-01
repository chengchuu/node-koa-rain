const Koa = require('koa');
const cors = require('koa2-cors');
const Router = require('koa-router');
const koaBody = require('koa-body');
const path = require('path');
const childProcess = require('child_process');
const { isFriday, getHours } = require('date-fns');
const { exec } = childProcess;
const server = require('./router/server');
const tiny = require('./router/tiny');
const mkdir = require('./utils/mkdir');
const NODE_ENV = process.env.NODE_ENV; // development production
let schedule = require('node-schedule');
const { sReportErrorInfo } = require('./service/log');
const { authMiddleware } = require('./entities/jwt/index');
// 实例
const app = new Koa();
const router = new Router();
// 跨域
// app.use(cors());
// 创建temp
mkdir.mkdirs('temp', err => {
  console.log('err', err); // 错误的话，直接打印如果地址跟
});
app.use(authMiddleware);
// 上传文件
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, './temp/'), // temp
      keepExtensions: true,
      maxFileSize: 200 * 1024 * 1024, // 设置上传文件大小最大限制，200M
    },
  })
);
app.context.linkMap = new Map();
let j = schedule.scheduleJob('*/60 * * * *', () => {
  app.context.linkMap = new Map();
});
// 装载所有路由并且分类
router.use('/server', server.routes(), server.allowedMethods());
router.use('/t', tiny.routes(), tiny.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());
// 错误监控
app.on('error', async (err, ctx) => {
  console.error('Server Error------------------: ', err);
  sReportErrorInfo({ ctx, logType: 'server_error', err, url: '', alias: 'pigKey' });
});
// 监听端口
app.listen(3224);
