const OSS = require("ali-oss");

// 上传文件 < 2M
async function ossPut ({ region, accessKeyId, accessKeySecret, bucket, source, target = "", fileName } = {}) {
  let client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
  try {
    // object-name可以自定义为文件名（例如file.txt）或目录（例如abc/test/file.txt）的形式，实现将文件上传至当前Bucket或Bucket下的指定目录。
    let result = await client.put(`${target}${fileName}`, source);
    if (result.res.status === 200) {
      return result.url;
    }
  } catch (e) {
    console.error("oss put:", e);
    return false;
  }
  return false;
}

// 分片上传 > 2M https://help.aliyun.com/document_detail/111268.html?spm=a2c4g.11186623.6.1098.14435d88D0koKc
async function ossMultipartUpload ({ region, accessKeyId, accessKeySecret, bucket, source, target = "", fileName } = {}) {
  let client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
  try {
    // object-name可以定义为文件名（例如file.txt）或目录（例如abc/test/file.txt）的形式，实现将文件上传至Bucket根目录或Bucket下的指定目录。
    const result = await client.multipartUpload(`${target}${fileName}`, source);
    if (result.res.status === 200 && Array.isArray(result.res.requestUrls)) {
      return result.res.requestUrls[0];
    }
  } catch (e) {
    // 捕获超时异常。
    if (e.code === "ConnectionTimeoutError") {
      console.error("oss timeout:", e);
    }
    return false;
  }
  return false;
}

module.exports = {
  ossPut,
  ossMultipartUpload,
};
