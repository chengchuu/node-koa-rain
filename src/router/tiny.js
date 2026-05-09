const Router = require('koa-router');
const tiny = new Router();
const { queryOriLinkByKey } = require('./../service/tiny');

// Visit
tiny.get('/:key', async ctx => {
  const { key: tiny_key } = ctx.params;
  const {
    data: { ori_link },
  } = await queryOriLinkByKey(ctx, { tiny_key });
  // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/302
  ctx.status = 302;
  ctx.redirect(ori_link);
});

module.exports = tiny;
