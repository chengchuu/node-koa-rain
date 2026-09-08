const logger = require("../../entities/logger");
const OSS = require("ali-oss");

async function ossPut ({ region, accessKeyId, accessKeySecret, bucket, source, target = "", fileName } = {}) {
  let client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
  try {
    // The object name may include a directory prefix within the bucket.
    let result = await client.put(`${target}${fileName}`, source);
    if (result.res.status === 200) {
      return result.url;
    }
  } catch (e) {
    logger.error({ err: e }, "[upload] oss put failed");
    return false;
  }
  return false;
}

async function ossMultipartUpload ({ region, accessKeyId, accessKeySecret, bucket, source, target = "", fileName } = {}) {
  let client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
  try {
    // The object name may include a directory prefix within the bucket.
    const result = await client.multipartUpload(`${target}${fileName}`, source);
    if (result.res.status === 200 && Array.isArray(result.res.requestUrls)) {
      return result.res.requestUrls[0];
    }
  } catch (e) {

    if (e.code === "ConnectionTimeoutError") {
      logger.error({ err: e }, "[upload] multipart upload failed");
    }
    return false;
  }
  return false;
}

module.exports = {
  ossPut,
  ossMultipartUpload,
};
