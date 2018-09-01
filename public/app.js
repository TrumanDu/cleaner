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

import React from 'react';
import chrome from 'ui/chrome';
import template from './templates/cleaner.html';
import Table from './components/table.js';
import { render } from 'react-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import 'ui/autoload/styles';
import './less/main.less';

const mergePattern = chrome.getInjected('mergePattern');
chrome.setRootTemplate(template).setRootController(() => {
  // Mount the React app
  const el = document.getElementById('root');
  render(
    <div>
      <EuiPage>
        <EuiPageBody>
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle>
                  <h2>Index TTL management</h2>
                </EuiTitle>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiText>
                    <p>Cleaner is an kibana plugin app for setting index ttl.</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer/>
              <Table mergePattern={mergePattern}/>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    </div>,
    el
  );
});
