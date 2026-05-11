// 格式化返回字段
function rsp ({ ctx, ret = 0, info = "ok", message = "成功", data = {} } = {}) {
  const rspBody = {
    ret,
    info,
    message,
    data,
  };
  if (ctx) ctx.body = rspBody;
  return rspBody;
}

// 格式化返回字段分页
function rspPage ({ ctx, ret = 0, info = "ok", message = "成功", data = {}, currentPage = 1, total = 0, pageSize = 10 } = {}) {
  const rspBody = {
    ret,
    info,
    message,
    data,
    currentPage,
    total,
    pageSize,
  };
  if (ctx) ctx.body = rspBody;
  return rspBody;
}

// OSS 上传
function ossRsp (a) {
  if (a.asset_id) {
    return {
      assetId: a.asset_id,
      ossLink: a.asset_oss_link,
      // assetLink: a.asset_link,
      showLink: a.asset_show_link,
      target: a.asset_target,
      fileSize: a.asset_size,
      fileType: a.asset_type,
      fileName: a.asset_file_name,
      createAt: a.asset_create_time,
    };
  }
  return a;
}

module.exports = {
  rsp,
  rspPage,
  ossRsp,
};
