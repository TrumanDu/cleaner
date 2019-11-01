/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const cleanerIndex = '.cleaner';

function sleep(time) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      // 返回 ‘ok’
      resolve(true);
    }, time);
  });
}



function deleteIndexs(index, server) {
  const cluster = server.plugins.elasticsearch.getCluster('data');
  cluster.callWithInternalUser('indices.delete', {
    index: index,
  }).then(function (error, response) {
    if (error != null) {
      server.log(['error', 'cleaner'], 'delete [' + index + '] index has error.', error);
    }

    if (response.acknowledged) {
      server.log(['info', 'cleaner'], 'delete [' + index + '] index success .');
    } else {
      server.log(['error', 'cleaner'], 'delete [' + index + '] index unsuccessful .', response);
    }
  });
}

function cleanerJob(server) {
  return new Promise(async function (resolve) {
    //console.log('start to execute cleanerJob..' + new Date());
    try {
      const cluster = server.plugins.elasticsearch.getCluster('data');
      cluster.callWithInternalUser('count', {
          index: cleanerIndex
        }).then((result) => {
          if (result.count === 0) {
            resolve(true);
            return;
          } else {
            cluster.callWithInternalUser('search', {
                index: cleanerIndex,
                size: count
            }).then((res) => {
              res.hits.hits.forEach(element => {
                let id = element._id;
                id = id + '*';
                //暂时仅支持h/d
                //h:hour
                //d:day
                const ttlSetting = element._source.ttl;
                if (typeof (ttlSetting) === 'undefined' || ttlSetting == null || ttlSetting.length === 0) {
                  server.log(['error', 'cleaner'], 'not set  ttl. ');
                  return;
                }
                const unit = ttlSetting.substring(ttlSetting.length - 1, ttlSetting.length);
                let ttl = 0;
                if ('d' === unit) {
                  ttl = Number.parseInt(ttlSetting.substring(0, ttlSetting.length - 1)) * 24 * 60 * 60 * 1000;
                } else if ('h' === unit) {
                  ttl = Number.parseInt(ttlSetting.substring(0, ttlSetting.length - 1)) * 60 * 60 * 1000;
                } else {
                  server.log(['error', 'cleaner'], 'ttl setting  incorrectly. like 1d,or 1h');
                  return;
                }
 
                cluster.callWithInternalUser('indices.get', {
                    index: id,
                }).then((response)=>{
                  if (JSON.stringify(response) !== '{}') {
                    for (const key in response) {
                      if (response.hasOwnProperty(
                        key
                      )) {
                        const date = Number.parseInt(response[key].settings.index.creation_date);
                        const curentDate = Date.parse(new Date());
                        if (curentDate >= date + ttl) {
                          //删除过期index
                          deleteIndexs(key, server);
                        }
                      }
                    }
                  }
                });
              });
              resolve(true);
            });
          }
        });

    } catch (error) {
      console.error('cleanerJob exec error.', error);
      resolve(false);
    }
  });
}


export async function  scheduleJob(times, server) {
  let i = 0;
  while (true) {
    await sleep(1000 * times);
    //仅仅为了一小时（或者超过一小时的就按配置策略）打印一条在运行日志
    if(times > 3600 || i % (3600 / times) === 0) {
      server.log(['info', 'cleaner'], 'cleanerJob exec normal. ');
    }
    i++;
    try {
      await cleanerJob(server);
    } catch (error) {
      console.error('cleanerJob exec error.', error);
    }
  }
}


/**
 *
 * @param {*} times(second)
 * @param server
 */
export async function run(times, server) {

  //如果不存在cleanerIndex则创建
  const cluster = server.plugins.elasticsearch.getCluster('data');
  const response = await cluster.callWithInternalUser('indices.exists', {
    index: cleanerIndex
  });
  if (!response) {
    const createResponse = await cluster.callWithInternalUser('indices.create', {
      index: cleanerIndex
    });
    if(createResponse) {
      server.log(['info', 'cleaner'], 'create [' + cleanerIndex +  '] index success .');
      scheduleJob(times, server);
    }else{
      server.log(['info', 'cleaner'], 'create [' + cleanerIndex +  '] index fail .', createResponse);
    }
  }else{
    scheduleJob(times, server);
  }

}
