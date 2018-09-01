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
  EuiButtonIcon,
  EuiConfirmModal,
  EuiOverlayMask,
  EUI_MODAL_CONFIRM_BUTTON,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelect,
} from '@elastic/eui';
import axios from 'axios';
axios.defaults.headers.post['kbn-xsrf'] = 'reporting';

export class ConfirmModal extends Component {
  constructor(props) {
    super(props);
    const indicesObj = this.props.indicesObj;
    const id = indicesObj.indexName.substring(
      0,
      indicesObj.indexName.indexOf('*')
    );
    this.state = {
      _id: id,
      isDestroyModalVisible: false,
      isModalVisible: false,
      ttl: indicesObj.ttl,
      typeValue: indicesObj.type,
      errors: [],
      isInvalid: true,
    };

    this.closeDestroyModal = this.closeDestroyModal.bind(this);
    this.showDestroyModal = this.showDestroyModal.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);


    this.onChange = this.onChange.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.showModal = this.showModal.bind(this);
    this.submit = this.submit.bind(this);
  }
  closeDestroyModal() {
    this.setState({ isDestroyModalVisible: false });
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
          title: 'Edit ttl settings success!',
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
              Could not edit ttl settings!
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

  async deleteDocument() {
    const response = await axios.post('../api/cleaner/delete', { id: this.state._id });
    if(response.status === 200 || response.statusText === 'OK') {
      this.setState({ isDestroyModalVisible: false });
      this.props.showToast({
        title: 'Delete ttl settings success!',
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
            Could not Delete ttl setttings!
          </p>
        ),
      });
      console.error(response);
    }
  }

  showDestroyModal() {
    this.setState({ isDestroyModalVisible: true });
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
            defaultValue={this.state.ttl}
            onChange={this.onTTLChange}
          />
        </EuiFormRow>
      </EuiForm>
    );


    let destroyModal;
    if (this.state.isDestroyModalVisible) {
      destroyModal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title="Do this destructive thing"
            onCancel={this.closeDestroyModal}
            onConfirm={this.deleteDocument}
            cancelButtonText="No, don't do it"
            confirmButtonText="Yes, do it"
            buttonColor="danger"
            defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
          >
            <p>You&rsquo;re want to delete this index ttl .</p>
            <p>Are you sure you want to do this?</p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    if (this.state.isModalVisible) {
      destroyModal = (
        <EuiOverlayMask>
          <EuiModal onClose={this.closeModal} style={{ width: '800px' }}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Edit</EuiModalHeaderTitle>
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
          size="s"
          onClick={this.showModal}
          iconType="pencil"
          aria-label="Edit"
        />
              &nbsp;&nbsp;&nbsp;&nbsp;
        <EuiButtonIcon
          size="s"
          onClick={this.showDestroyModal}
          iconType="trash"
          aria-label="Delete"
          color="danger"
        />
        {destroyModal}
      </div>
    );
  }
}
