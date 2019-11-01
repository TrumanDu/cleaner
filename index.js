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

import serverRoute from './server/routes/server';
import * as scheduleModuel from './server/scheduleJob';


export default function (kibana) {
  return new kibana.Plugin({
    name: 'cleaner',
    uiExports: {

      app: {
        title: 'Cleaner',
        description: 'An awesome Kibana plugin for setting elasticsearch index ttl',
        icon: 'plugins/cleaner/icon.svg',
        main: 'plugins/cleaner/app'
      },
      injectDefaultVars: function (server) {
        const config = server.config();
        const pattern = config.get('cleaner.mergePattern');
        return {
          mergePattern: pattern,
        };
      }
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        scheduleTime: Joi.number().default(60),
        mergePattern: Joi.string().default('[^a-z]+$'),
      }).default();
    },


    init(server, options) {
      // Add server routes and initialize the plugin here
      serverRoute(server, options);
      let scheduleTime;
      try {
        scheduleTime = server.config().get('cleaner.scheduleTime');

      } catch (error) {
        scheduleTime = 60;
        server.log(['info', 'cleaner'], 'default scheduleTime 60 second');
      }
      scheduleModuel.run(scheduleTime, server);
    }
  });
}
