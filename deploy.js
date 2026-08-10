const conf = {
  host: '#rabbit',
  port: 22,
  username: '#rabbit',
  password: '#rabbit',
  path: '#rabbit',
};

// 重启
async function restart () {
  const Client = require('ssh2').Client;
  const conn = new Client();
  return new Promise((resolve, reject) => {
    conn
      .on('ready', function () {
        console.log('Client :: ready');
        conn.exec(`cd ${conf.path};pwd;git pull;npm i --registry=https://registry.npmjs.org;npm run restart;`, function (err, stream) {
          if (err) throw err;
          stream
            .on('close', function (code, signal) {
              console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
              conn.end();
              resolve('restart success!');
            })
            .on('data', function (data) {
              console.log('STDOUT: ' + data);
            })
            .stderr.on('data', function (data) {
              console.log('STDERR: ' + data);
            });
        });
      })
      .connect(conf);
  });
}

// 启动任务
(async () => {
  const restartResult = await restart().catch(console.error);
  console.log(restartResult);
  if (!restartResult) process.exit();
})();
