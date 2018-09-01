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
import React, { Component } from 'react';

import {
  EuiButton,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSelect,
} from '@elastic/eui';
import axios from 'axios';
axios.defaults.headers.post['kbn-xsrf'] = 'reporting';
export class Modal extends Component {
  constructor(props) {
    super(props);
    const indicesObj = this.props.indicesObj;
    const _id = indicesObj.indexName.substring(
      0,
      indicesObj.indexName.indexOf('*')
    );
    this.state = {
      isModalVisible: false,
      _id: _id,
      typeValue: 0,
      ttl: '',
      isInvalid: true,
      errors: [],
    };
    this.onChange = this.onChange.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.showModal = this.showModal.bind(this);
    this.submit = this.submit.bind(this);
  }

  onChange = e => {
    this.setState({
      typeValue: e.target.value,
    });
  };

  onTTLChange = e => {
    this.setState({
      ttl: e.target.value,
    });
  };

  closeModal() {
    this.setState({ isModalVisible: false });
  }

  async submit() {
    if (this.state.ttl === '') {
      this.setState({ errors: ['Please input ttl value,like: 1d or 24h!'] });
    } else {
			 // 使用 axios 更新数据
      const resopnse = await axios.post('../api/cleaner/index', {
        id: this.state._id,
        ttl: this.state.ttl,
        type: this.state.typeValue,
      });
      if(resopnse.status === 200 || resopnse.statusText === 'OK') {
        this.setState({ isModalVisible: false });
        this.props.showToast({
          title: 'Add ttl settings success!',
          color: 'success',
          id: Date.parse(new Date()),
        });
        this.props.queryCleanerIndices();
      }else{
        this.props.showToast({
          title: 'Oops, there was an error',
          color: 'danger',
          iconType: 'help',
          id: Date.parse(new Date()),
          text: (
            <p>
              Could not add ttl!
            </p>
          ),
        });
        console.error(resopnse);
      }
    }
  }

  showModal() {
    this.setState({ isModalVisible: true });
  }

  render() {
    const formSample = (
      <EuiForm error={this.state.errors}>
        <EuiFormRow label="Index Prefix">
          <EuiFieldText name="indexPrefix" value={this.state._id} disabled />
        </EuiFormRow>
        <EuiFormRow label="Type">
          <EuiSelect
            options={[
              { value: 0, text: 'Delete By Index' },
            ]}
            defaultValue={this.state.typeValue}
            onChange={this.onChange}
          />
        </EuiFormRow>
        <EuiFormRow
          label="TTL"
          error={this.state.errors}
          isInvalid={this.state.isInvalid}
        >
          <EuiFieldText
            name="ttl"
            placeholder="1d or 24h"
            isInvalid={this.state.isInvalid}
            onChange={this.onTTLChange}
          />
        </EuiFormRow>
      </EuiForm>
    );

    let modal;

    if (this.state.isModalVisible) {
      modal = (
        <EuiOverlayMask>
          <EuiModal onClose={this.closeModal} style={{ width: '800px' }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Add</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>{formSample}</EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={this.closeModal}>Cancel</EuiButtonEmpty>

              <EuiButton onClick={this.submit} fill>
                Save
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      );
    }

    return (
      <div>
        <EuiButtonIcon
          size="l"
          onClick={this.showModal}
          iconType="indexOpen"
          aria-label="Add"
        />
        {modal}
      </div>
    );
  }
}
