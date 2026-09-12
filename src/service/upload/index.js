const logger = require("../../entities/logger");

const fs = require("fs");
const path = require("path");
const { rsp, ossRsp } = require("../../entities/response");
const { newAsset, getAsset, removeAsset } = require("../../model/asset");
const { mGetOSSConfs, mNewOSSConf, mNewGetOSSConfs, mAddOSSConf } = require("../../model/oss");

const { sGetUid } = require("../user");
const { err } = require("../../entities/err");
const { isNumber } = require("mazey");
const { format } = require("date-fns");
const mkdir = require("../../utils/mkdir");
const { assetsBaseUrl } = require("../../config/index");
const GTTS = require("gtts");
const say = require("../../utils/say");

async function upload(ctx) {
  // Use the user payload already decoded by authentication middleware.
  const jwtToken = ctx.state.user;
  const file = ctx.request.files.file;
  const afferentTarget = (ctx.request.body && ctx.request.body.target) || ctx.query.target || ctx.request.target;
  if (!file.type) {
    return rsp({
      message: "请上传图片",
      data: {},
    });
  }
  let fileStr = file.type.split("/");
  let typeStr = "";
  if (fileStr && fileStr.length === 2) {
    typeStr = fileStr[1].split(".");
    typeStr = typeStr[typeStr.length - 1];
  }
  let lastFileStr = fileStr[0] + "/" + typeStr;
  let fileUrl = afferentTarget ? `${afferentTarget}` : `assets/${lastFileStr}`;
  await mkdir.mkdirs(fileUrl, err => {
    if (err instanceof Error) logger.error({ err }, "[upload] directory creation failed");
  });
  const target = afferentTarget || "assets";
  let uid = Number(ctx.query.uid) || 0;
  // Fall back to fingerprint-based user lookup.
  if (!uid) {
    try {
      ({
        data: { uid = 0 },
      } = await sGetUid(ctx));
    } catch (err) {
      logger.error({ err: err }, "[upload] upload failed");
    }
  }
  const tFilePath = file ? file.path : "";

  const reader = fs.createReadStream(tFilePath);
  const { size: fileSize, type: fileType } = file;
  let fileName = file.name || "upload";
  let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\]<>《》/?~!@#￥……&*()——|{}【】‘;:”“'。,、? ]");
  if (pattern.test(fileName)) {

    let rs = "";
    for (let i = 0; i < fileName.length; i++) {
      rs += fileName.substr(i, 1).replace(pattern, "");
    }
    fileName = rs;
  }
  fileName = fileName.replace(/[\u4e00-\u9fa5]/g, a => {
    return "i";
  }); // Replace each CJK character with i before adding the generated filename suffix.
  let fileArray = fileName.split(".");
  fileName = fileArray[0] + "-" + format(Date.now(), "yyyyMMdd") + "-" + Math.round(Math.random() * 1e9) + "." + fileArray[fileArray.length - 1];
  let downloadFileUrl = afferentTarget ? `../../../../${afferentTarget}` : `../../../../assets/${lastFileStr}/`;
  const filePath = path.join(__dirname, downloadFileUrl) + `${fileName}`;

  const upStream = fs.createWriteStream(filePath);
  // This promise represents the prepared response, not stream completion.
  let ok;
  const status = new Promise(resolve => {
    ok = resolve;
  }, error => {
    logger.error({ err: error }, "[upload] upload failed");
  });
  let cdnDomain = process.env.NODE_ENV === "development" ? "https://localhost:3224/" : `${assetsBaseUrl}/`;
  let ossResult = "";

  const assetLink = "";
  const showLink = `${cdnDomain}${target}/${lastFileStr}/${fileName}`;

  await newAsset({
    asset_oss_id: 0,
    asset_link: assetLink,
    asset_oss_link: ossResult,
    asset_show_link: showLink,
    asset_target: target,
    asset_type: fileType,
    asset_size: fileSize,
    asset_operator_id: uid,
    asset_file_name: fileName,
    user_id: jwtToken.data.user_id,
  });
  ok(
    rsp({
      data: ossRsp({

        ossLink: ossResult,
        showLink,
        target,
        fileSize,
        fileType,
        fileName,
        createAt: new Date(),
      }),
    }),
  );

  reader.pipe(upStream);
  return status;
}

async function getAssets({ ctx, asset_operator_id }) {
  const jwtToken = ctx.state.user || { data: {} };
  const limit = Boolean(ctx.query.limit) && Number(ctx.query.limit);
  const assets = await getAsset({ asset_oss_id: Number(ctx.query.oss_id), user_id: jwtToken.data.user_id, limit });
  if (!assets) {
    return err({ message: "未找到静态资源" });
  }
  const ret = assets.map(ossRsp);
  return rsp({ data: { assets: ret } });
}

async function sRemoveAsset(ctx) {
  const { asset_id } = ctx.request.body;
  const removeAssetResult = await removeAsset({ asset_id });
  let ret;
  if (Array.isArray(removeAssetResult) && isNumber(removeAssetResult[0]) && removeAssetResult[0] > 0) {
    ret = rsp({ data: { asset_id } });
  } else {
    ret = err();
  }
  return ret;
}

async function sGetOSSConfs(ctx) {
  const uidRes = await sGetUid(ctx);

  const {
    data: { uid },
  } = uidRes;
  const access_token = ctx.query.access_token || "";
  const ossConfs = (await mGetOSSConfs({ oss_user_id: uid, access_token })).map(({ oss_id, oss_name }) => ({ ossId: oss_id, ossName: oss_name }));
  return rsp({ data: { ossConfs } });
}

async function sNewGetOSSConfs({ token }) {
  if (!token) {
    return err({ message: "缺少 Token" });
  }
  const NewGetOSSConfsRes = await mNewGetOSSConfs({ token });
  if (NewGetOSSConfsRes.ret !== 0) {
    return NewGetOSSConfsRes;
  }
  const {
    data: { OSSConfs: newOSSConfs },
  } = NewGetOSSConfsRes;
  if (!newOSSConfs.length) {
    return err({ message: "无 OSS 配置" });
  }
  const ossConfs = newOSSConfs.map(({ oss_id, oss_name }) => ({ ossId: oss_id, ossName: oss_name }));
  return rsp({ data: { ossConfs } });
}

async function sNewOSSConf(ctx) {
  const uidRes = await sGetUid(ctx);
  const {
    data: { uid },
  } = uidRes;
  const newConfRes = await mNewOSSConf({ oss_user_id: uid, ...ctx.query });
  if (!newConfRes) {
    return err({ info: "err_save_oss_conf" });
  }
  return rsp();
}

async function sAddOSSConf({ ossName, region, accessKeyId, accessKeySecret, bucket, cdnDomain, userName }) {
  if (!ossName) {
    return err({ message: "缺少名字" });
  }
  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    return err({ message: "缺少 OSS 参数" });
  }
  if (!userName) {
    return err({ message: "非正常路径创建" });
  }
  const AddOSSConfRes = await mAddOSSConf({ ossName, region, accessKeyId, accessKeySecret, bucket, cdnDomain, userName });
  if (AddOSSConfRes.ret === 0) {
    return AddOSSConfRes;
  }
  return err({ info: "err_save_oss_conf" });
}
async function sSynthesize(ctx, { content }) {
  const radioFolderPath = "../../../../video/";
  const fileName = `${format(Date.now(), "yyyyMMdd") + "-" + Math.round(Math.random() * 1e9)}.mp3`;
  const filePath = path.join(__dirname, radioFolderPath) + `${fileName}`;
  let cdnDomain = process.env.NODE_ENV === "development" ? "https://localhost:3224/" : `${assetsBaseUrl}/`;
  const target = ctx.query.target || "video";
  const showLink = `${cdnDomain}${target}/${fileName}`;

  try {
    say.export(content, "Microsoft Huihui Desktop", 1, filePath);
    return rsp({ data: showLink });
  } catch (error) {
    return err({ info: error });
  }
}
async function sSynthesize2(ctx, { content }) {

  const radioFolderPath = "../../../../radio/";
  const fileName = `${Date.now()}.mp3`;
  const filePath = path.join(__dirname, radioFolderPath) + `${fileName}`;
  const speech = new GTTS(content, "zh");
  const res = speech.save(filePath, error => {
    if (error) {
      return err({ info: error.message });
    } else {
      logger.info("[upload] speech file stored");
      return rsp({ data: fileName });
    }
  });
}

module.exports = {
  upload,
  getAssets,
  sGetOSSConfs,
  sNewOSSConf,
  sRemoveAsset,
  sNewGetOSSConfs,
  sAddOSSConf,
  sSynthesize,
  sSynthesize2,
};
