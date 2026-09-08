const fs = require("fs");
const path = require("path");

exports.mkdirs = (pathname, callback) => {

  pathname = path.isAbsolute(pathname) ? pathname : path.join(__dirname, pathname);

  pathname = path.relative(__dirname, pathname);
  // Split paths using the platform separator.
  const floders = pathname.split(path.sep);
  let pre = "";
  return new Promise((resolve, reject) => {
    floders.forEach(floder => {
      try {

        const _stat = fs.statSync(path.join(__dirname, "../../../", pre, floder));
        const hasMkdir = _stat && _stat.isDirectory();
        if (hasMkdir) {
          callback && callback(pre);
        }
      } catch (err) {

        try {
          // Create parent directories synchronously before their children.
          fs.mkdirSync(path.join(__dirname, "../../../", pre, floder));
          callback && callback(pre);
        } catch (error) {
          callback && callback(error);
        }
      }
      pre = path.join(pre, floder);
      return "";
    });
    resolve(pre);
  });
};
