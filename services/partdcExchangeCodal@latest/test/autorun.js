let {spawn} = require('child_process');
let moment = require('moment-jalaali');
let {consoleLog} = require('../utility');
/**
 * @description اجرای تست
 */
function run() {
  consoleLog('Start process');
  let exec = spawn('node', ['separatingInfoFromStatements.js']);
  let lastUpdate = new Date().getTime();
  let checkInterval = setInterval(() => {
    if (new Date().getTime() - lastUpdate > 303 * 1000) {
      msg.log(`Kill process~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>${moment().format('jYYYY/jMM/jDD HH:mm:ss')}`);
      clearInterval(checkInterval);
      exec.kill();
    }
  }, 60 * 1000);

  exec.stdout.on('data', (data) => {

    if (data.toString() !== 'data saved!\n') {
      return;
    }

    lastUpdate = new Date().getTime();
  });

  exec.stderr.on('data', (data) => {

    consoleLog('error:', data.toString());
  });

  exec.on('close', (code) => {
    consoleLog(`child process exited with code ${code}`);

    setTimeout(() => {
      run();
    }, 100);
  });
}

run();