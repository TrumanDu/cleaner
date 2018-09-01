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
import React, {
  Component,
  Fragment
} from 'react';
import {
  EuiInMemoryTable,
  EuiHealth,
  EuiSpacer,
  EuiSwitch,
  EuiFlexGroup,
  EuiGlobalToastList,
} from '@elastic/eui';
import axios from 'axios';
import { Modal } from './modal';
import { ConfirmModal } from './confirmModal';
class IndicesObj {
  constructor(indexName, totalSize, isTTL, ttl, type) {
    this.indexName = indexName;
    this.key = indexName;
    this.totalSize = totalSize;
    this.isTTL = isTTL;
    this.ttl = ttl;
    this.type = type;
  }
}
let debounceTimeoutId;
let requestTimeoutId;
export default class Table extends Component {
  constructor(props) {
    super(props);
    this.queryCleanerIndices = this.queryCleanerIndices.bind(this);
    this.showToast = this.showToast.bind(this);
    this.removeToast = this.removeToast.bind(this);
    this.state = {
      merge: true,
      filters: false,
      isLoading: true,
      toasts: [],
      queryParam: null,
    };
  }
  /**
   * 构建页面展示所需要格式数据
   * @param {*} orignData
   */
  reBuildOriginData(orignData, cleaner) {
    const newOrignData = new Array();
    const cleanerMap = new Map();
    cleaner.forEach(function (item) {
      cleanerMap.set(item._id, item);
    });
    for (const key in orignData) {
      if (orignData.hasOwnProperty(key)) {
        const element = orignData[key];
        let isTTL = false;
        if(cleanerMap.has(key)) {
          isTTL = true;
        }
        const obj = new IndicesObj(key, element.total.store.size_in_bytes, isTTL,
          isTTL ? cleanerMap.get(key)._source.ttl : null, isTTL ? cleanerMap.get(key)._source.type : null);
        newOrignData.push(obj);
      }
    }
    return newOrignData;
  }

  /**
   * 合并index，并计算大小
   * @param {*} tempData
   */
  mergetIndexName(tempData, cleaner, pattern) {
    const cleanerMap = new Map();
    cleaner.forEach(function (item) {
      cleanerMap.set(item._id, item);
    });

    const resultDataArray = new Array();
    const map = new Map();
    const regx = new RegExp(pattern);
    for (const key in tempData) {
      if (tempData.hasOwnProperty(key)) {
        const result = regx.exec(key);
        let prefix = '';
        if (result != null && result.index > 0) {
          prefix = key.substring(0, result.index);
        } else {
          prefix = key;
        }
        if (map.has(prefix)) {
          const temp = map.get(prefix);
          temp.push(tempData[key]);
          map.set(prefix, temp);
        } else {
          const temp = new Array();
          temp.push(tempData[key]);
          map.set(prefix, temp);
        }
      }
    }
    map.forEach(function (value, key) {
      let size = 0;
      for (const data of value) {
        const indexSize = data.total.store.size_in_bytes;
        size = size + indexSize;
      }
      let isTTL = false;
      if(cleanerMap.has(key)) {
        isTTL = true;
      }
      const obj = new IndicesObj(key + '*(' + value.length + ')', size, isTTL,
        isTTL ? cleanerMap.get(key)._source.ttl : null, isTTL ? cleanerMap.get(key)._source.type : null);
      resultDataArray.push(obj);
    });
    return resultDataArray;
  }

  async queryCleanerIndices() {
    this.setState({
      isLoading: true,
    });
    // 使用 axios 获取数据
    const { data } = await axios('../api/cleaner/_stats');
    const list = await axios('../api/cleaner/list');
    const indices = data.indices;
    const cleaner = list.data.hits.hits;
    let store = [];
    if (this.state.merge) {
      store = this.mergetIndexName(indices, cleaner, this.props.mergePattern);
    } else {
      store = this.reBuildOriginData(indices, cleaner);
    }
    //处理queryParam需要过滤的数据
    if(this.state.queryParam != null) {
      const indicesObjs = store.filter(indicesObj => {
        const normalizedName = `${indicesObj.indexName}`.toLowerCase();
        const normalizedQuery = this.state.queryParam.toLowerCase();
        return normalizedName.indexOf(normalizedQuery) !== -1;
      });
      this.setState({
        store: indicesObjs,
        indices: indices,
        cleaner: cleaner,
        isLoading: false,
      });
    }else{
      this.setState({
        store: store,
        indices: indices,
        cleaner: cleaner,
        isLoading: false,
      });
    }

  }

  componentDidMount() {
    this.queryCleanerIndices();
  }


  mergeFilter(_this) {
    let store = [];
    if (!_this.state.merge) {
      store = _this.mergetIndexName(this.state.indices, this.state.cleaner, this.props.mergePattern);
    } else {
      store = _this.reBuildOriginData(this.state.indices, this.state.cleaner);
    }
    _this.setState({
      store: store,
      merge: !_this.state.merge,
    });
  }
  showToast(toast) {
    this.setState({ toasts: this.state.toasts.concat(toast), });
  }

  removeToast = (removedToast) => {
    this.setState(prevState => ({
      toasts: prevState.toasts.filter(toast => toast.id !== removedToast.id),
    }));
  };

  renderToolsRight() {
    return [
      (<EuiSwitch
        label="Merge"
        key="MergeEuiSwitch"
        checked={
          this.state.merge
        }
        onChange={()=>this.mergeFilter(this)}
      />)];
  }
  onQueryChange = ({ query }) => {
    clearTimeout(debounceTimeoutId);
    clearTimeout(requestTimeoutId);

    debounceTimeoutId = setTimeout(() => {
      this.setState({
        isLoading: true,
      });

      requestTimeoutId = setTimeout(() => {
        let store = [];
        if (this.state.merge) {
          store = this.mergetIndexName(this.state.indices, this.state.cleaner, this.props.mergePattern);
        } else {
          store = this.reBuildOriginData(this.state.indices, this.state.cleaner);
        }
        const indicesObjs = store.filter(indicesObj => {
          const normalizedName = `${indicesObj.indexName}`.toLowerCase();
          const normalizedQuery = query.text.toLowerCase();
          return normalizedName.indexOf(normalizedQuery) !== -1;
        });

        this.setState({
          isLoading: false,
          store: indicesObjs,
          queryParam: query.text,
        });
      }, 500);
    }, 150);
  };
  render() {
    const columns = [{
      field: 'indexName',
      name: 'Index Name',
      sortable: true,
      truncateText: true,
    }, {
      field: 'totalSize',
      name: 'Total Size',
      sortable: true,
      render: (size) => {
        const kb = 1024;
        const mb = 1024 * 1024;
        const gb = 1024 * 1024 * 1024;
        if (size > gb) {
          size = (size / gb).toFixed(2) + ' gb';
        } else if (size > mb) {
          size = (size / mb).toFixed(2) + ' mb';
        } else {
          size = (size / kb).toFixed(2) + ' kb';
        }
        return size;
      },
    }, {
      field: 'isTTL',
      name: 'TTL status',
      dataType: 'boolean',
      render: (online) => {
        const color = online ? 'success' : 'danger';
        const label = online ? 'true' : 'false';
        return (
          <EuiHealth color={color}> {
            label
          }
          </EuiHealth>);
      },
      sortable: true
    }, {
      name: 'Actions',
      field: 'isTTL',
      render: (isTTL, indicesObj) => {
        if(this.state.merge) {
          if(isTTL) {
            return (
              <div>
                <ConfirmModal indicesObj={indicesObj} queryCleanerIndices={this.queryCleanerIndices} showToast={this.showToast}/>
              </div>);
          }else{
            return (
              < Modal indicesObj={indicesObj} queryCleanerIndices={this.queryCleanerIndices} showToast={this.showToast}/>
            );
          }
        }
      }
    }];

    const sorting = {
      sort: {
        field: 'totalSize',
        direction: 'desc',
      }
    };
    const search = {
      onChange: this.onQueryChange,
      box: {
        incremental: true,
        schema: true
      },
      toolsRight: this.renderToolsRight()
    };

    const page = (
      <Fragment>
        <EuiFlexGroup/>
        <EuiSpacer size="l" / >
        <EuiInMemoryTable
          items={
            this.state.store
          }
          loading={this.state.isLoading}
          columns={
            columns
          }
          search={
            search
          }
          pagination={
            true
          }
          sorting={
            sorting
          }
        />
      </Fragment>
    );


    return (
      <div>
        { page }
        <EuiGlobalToastList
          toasts={this.state.toasts}
          dismissToast={this.removeToast}
          toastLifeTimeMs={5000}
        />
      </div>);
  }
}
