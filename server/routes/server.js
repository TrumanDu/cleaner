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
const elasticsearch = require('elasticsearch');
const cleanerIndex = '.cleaner';
const cleanerType = 'ttl';

export default function (server) {
  const config = server.config();

  const client = new elasticsearch.Client({
    host: config.get('elasticsearch.url'),
    requestTimeout: 120000
    //log: 'trace'
  });
  server.route({
    path: '/api/cleaner/_stats',
    method: 'GET',
    handler(req, reply) {
      client.indices.stats({
        human: true,
        fields: ['docs', 'store']
      }, function (err, response) {
        reply(
          response
        );
      });
    }
  });

  server.route({
    path: '/api/cleaner/list',
    method: 'GET',
    handler(req, reply) {
      client.count({
        index: cleanerIndex
      }, function (error, response) {
        client.search({
          index: cleanerIndex,
          size: response.count
        }, function (err, response) {
          reply(
            response
          );
        });
      });

    }
  });

  server.route({
    path: '/api/cleaner/index',
    method: 'POST',
    handler(req, reply) {
      const documentData = req.payload;
      client.index({
        index: cleanerIndex,
        type: cleanerType,
        id: documentData.id,
        refresh: 'wait_for',
        body: {
          // put the partial document under the `doc` key
          type: documentData.type,
          ttl: documentData.ttl
        }
      }, function (err, response) {
        reply(
          response
        );
      });
    }
  });

  server.route({
    path: '/api/cleaner/delete',
    method: 'POST',
    handler(req, reply) {
      client.delete({
        index: cleanerIndex,
        type: cleanerType,
        refresh: 'wait_for',
        id: req.payload.id
      }, function (err, response) {
        reply(
          response
        );
      });
    }
  });
}