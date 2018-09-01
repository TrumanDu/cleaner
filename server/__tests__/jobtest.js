function sleep(time) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      // 返回 ‘ok’
      resolve(true);
    }, time);
  });
}


function cleanerJob() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      console.log('start to execute cleanerJob..' + new Date());
      // 返回 ‘ok’
      resolve(true);
    }, 5000);
  });
}


/**
 *
 * @param {*} times(second)
 */
async function scheduleJob(times) {
  while (true) {
    await cleanerJob();
    await sleep(1000 * times);
  }
}

scheduleJob(10);
