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

export default function (server) {

  server.route({
    path: '/api/cleaner/_stats',
    method: 'GET',
    handler: async (_req)=>{

      const params = {
        human: true,
        level: 'indices',
        metric: ['docs', 'store']
      };
      const response = await server.plugins.elasticsearch.getCluster('data').callWithRequest(_req, 'indices.stats', params);
      return response;
    }
  });

  server.route({
    path: '/api/cleaner/list',
    method: 'GET',
    handler: async (_req)=>{

      const params = {
        index: cleanerIndex
      };
      const count = await server.plugins.elasticsearch.getCluster('data').callWithRequest(_req, 'count', params);
      const searchParams = {
        index: cleanerIndex,
        size: count
      };
      const response = await server.plugins.elasticsearch.getCluster('data').callWithRequest(_req, 'search', searchParams);
      return response;
    }
  });


  server.route({
    path: '/api/cleaner/index',
    method: 'POST',
    handler: async (_req)=>{
      const documentData = req.payload;
      const params = {
        index: cleanerIndex,
        id: documentData.id,
        refresh: 'wait_for',
        body: {
          type: documentData.type,
        }
      };
      
      const response = await server.plugins.elasticsearch.getCluster('data').callWithRequest(_req, 'index', params);
      return response;
    }
  });

  server.route({
    path: '/api/cleaner/delete',
    method: 'POST',
    handler: async (_req)=>{
      const params = {
        index: cleanerIndex,
        refresh: 'wait_for',
        id: req.payload.id
      };
      
      const response = await server.plugins.elasticsearch.getCluster('data').callWithRequest(_req, 'delete', params);
      return response;
    }
  });

}