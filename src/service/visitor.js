// 访客
const axios = require("axios");
const { clone } = require("lodash");
const { rsp } = require("../entities/response");
const { queryVisitors } = require("../model/visitor");

/**
 * @method getLatestVisitors
 * @desc 获取最近的访客信息
 */
function getLatestVisitors () {
  return queryVisitors();
}

/**
 * @method sAgentGet
 * @desc 代理 GET 请求
 */
async function sAgentGet (ctx) {
  const { url, key = "" } = ctx.query;
  if (key) {
    return require(`../model/metro/10/${key}.json`);
  }
  return axios
    .get(url)
    .then(res => {
      return res.data;
    })
    .catch(err => {
      console.error("err", err);
    });
}

/**
 * @method sAgentPut
 * @desc 代理 PUT 请求
 */
async function sAgentPut (ctx) {
  const { url, body, key = "" } = ctx.request.body;
  if (key) {
    return require(`../model/metro/10/${key}.json`);
  }
  return axios
    .put(url, body)
    .then(res => {
      return res.data;
    })
    .catch(err => {
      console.error("err", err);
    });
}

/**
 * @method sAgentAny
 * @desc 代理任意请求
 */
async function sAgentAny (ctx) {
  const { url, method, params, data, headers } = ctx.request.body;
  const { mockKey } = params;
  if (mockKey) {
    return require(`../model/metro/10/${mockKey}.json`);
  }
  return axios({
    url,
    method,
    params,
    data,
    headers,
  })
    .then(res => {
      console.log("res", res);
      return res.data;
    })
    .catch(err => {
      console.error("err", err);
    });
}

/**
 * @method sShowRequestInfo
 * @desc 查看请求详情
 */
async function sShowRequestInfo (ctx) {
  const pureReq = clone(ctx.request);
  return rsp({ data: pureReq });
}

module.exports = {
  getLatestVisitors,
  sAgentGet,
  sAgentPut,
  sAgentAny,
  sShowRequestInfo,
};
