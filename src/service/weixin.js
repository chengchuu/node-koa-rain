// weixin
const axios = require("axios");
const { err } = require("../entities/error");
const { rsp } = require("../entities/response");

async function sGetToken () {
  return axios
    .get("https://api.weixin.qq.com/cgi-bin/token", {
      params: {
        grant_type: "client_credential",
        appid: "#rabbit",
        secret: "#rabbit",
      },
    })
    .then(res => {
      return rsp({ data: res.data });
    });
}

async function sGetTicket () {
  const {
    data: { access_token },
  } = await sGetToken();
  if (!access_token) {
    return err({
      message: "access_token",
    });
  }
  return axios
    .get("https://api.weixin.qq.com/cgi-bin/ticket/getticket", {
      params: {
        access_token,
        type: "jsapi",
      },
    })
    .then(res => {
      return rsp({ data: res.data });
    });
}

module.exports = {
  sGetToken,
  sGetTicket,
};
