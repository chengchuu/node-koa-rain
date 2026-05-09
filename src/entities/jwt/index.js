const jwt = require('jsonwebtoken');
const { err } = require('../err');
const { rsp } = require('../response');
const config = {
  secret: '20230319123456**',
  time: 60 * 60 * 24,
};
function jwtCreate (data, time) {
  console.log('执行了嘛');
  let token = jwt.sign(data, config.secret, {
    algorithm: 'HS256',
    expiresIn: time || config.time,
  });
  return token;
}
async function authMiddleware (ctx, next) {
  // 暂时只加五个接口
  const token = ctx.headers.authorization;
  let authorList = ['/server/upload/query', '/server/game/add', '/server/score/add', '/server/upload', '/server/tag/add'];
  let requestUrl = ctx.request.url ? ctx.request.url.split('?')[0] : '';
  if (!authorList.includes(requestUrl)) {
    await next();
    return;
  }
  if (!token) {
    ctx.body = err({
      message: '用户登陆过期,请重新登陆',
    });
    return;
  }
  try {
    const decoded = jwtVerify(token);
    console.log('decoded', decoded);
    if (decoded.code !== 2) {
      ctx.body = err({
        message: '用户登陆过期,请重新登陆',
      });
      return;
    }
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    console.error(error);
    ctx.throw(500, 'Internal server error');
  }
}
function jwtVerify (token) {
  return jwt.verify(token, config.secret, function (err, jwtDecoded) {
    if (err) {
      return {
        code: 1,
        message: 'invalid',
        data: null,
      };
    } else {
      return {
        code: 2,
        message: 'valid',
        data: jwtDecoded,
      };
    }
  });
}
function jwtDecoded (token, complete = true) {
  return jwt.decode(token, {
    complete,
  });
}
module.exports = {
  jwtCreate,
  jwtVerify,
  jwtDecoded,
  authMiddleware,
};
