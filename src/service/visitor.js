const logger = require("../entities/logger");

const axios = require("axios");
const { clone } = require("lodash");
const { rsp } = require("../entities/response");
const { queryVisitors } = require("../model/visitor");

function getLatestVisitors () {
  return queryVisitors();
}

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
      logger.error({ err: err }, "[visitor] proxy get failed");
    });
}

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
      logger.error({ err: err }, "[visitor] proxy put failed");
    });
}

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
      return res.data;
    })
    .catch(err => {
      logger.error({ err: err }, "[visitor] proxy request failed");
    });
}

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
