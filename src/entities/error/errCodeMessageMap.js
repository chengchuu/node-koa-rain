const errCodeMessageMap = new Map([
  [ "err_uid_params_error", "UID 参数错误" ],
  [ "err_not_find", "UID 不存在" ],
  // 腾讯云 公共错误码
  [ "UnsupportedOperation", "操作不支持。" ],
  [ "ResourceInUse", "资源被占用。" ],
  [ "InternalError", "内部错误。" ],
  [ "RequestLimitExceeded", "请求的次数超过了频率限制。" ],
  [ "AuthFailure.SecretIdNotFound", "不存在。" ],
  [ "LimitExceeded", "超过配额限制。" ],
  [ "NoSuchVersion", "接口版本不存在。" ],
  [ "ResourceNotFound", "资源不存在。" ],
  [ "AuthFailure.SignatureFailure", "签名错误。" ],
  [ "AuthFailure.SignatureExpire", "签名过期。" ],
  [ "UnsupportedRegion", "接口不支持所传地域。" ],
  [ "UnauthorizedOperation", "未授权操作。" ],
  [ "InvalidParameter", "参数错误。" ],
  [ "ResourceUnavailable", "资源不可用。" ],
  [ "AuthFailure.MFAFailure", "MFA 错误。" ],
  [ "AuthFailure.UnauthorizedOperation", "请求未授权。请参考 CAM 文档对鉴权的说明。" ],
  [ "AuthFailure.InvalidSecretId", "密钥非法（不是云 API 密钥类型）。" ],
  [ "AuthFailure.TokenFailure", "token 错误。" ],
  [ "DryRunOperation", "DryRun 操作，代表请求将会是成功的，只是多传了 DryRun 参数。" ],
  [ "FailedOperation", "操作失败。" ],
  [ "UnknownParameter", "未知参数错误。" ],
  [ "UnsupportedProtocol", "HTTP(S)请求协议错误，只支持 GET 和 POST 请求。" ],
  [ "InvalidParameterValue", "参数取值错误。" ],
  [ "InvalidAction", "接口不存在。" ],
  [ "MissingParameter", "缺少参数错误。" ],
  [ "ResourceInsufficient", "资源不足。" ],
].map(([ a, b ]) => {
  a = a.toLowerCase();
  return [ a, b ];
}));

module.exports = errCodeMessageMap;
