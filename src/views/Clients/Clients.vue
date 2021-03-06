<template>
  <div class="app-wrapper clients">
    <el-form @keyup.enter="handleSearch">
      <el-row class="search-wrapper" :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="fuzzyParams.like_clientid"
            :placeholder="$t('Clients.clientId')"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="fuzzyParams.like_username"
            :placeholder="$t('Clients.username')"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="fuzzyParams.node" :placeholder="$t('Clients.node')" clearable>
            <el-option v-for="item in currentNodes" :value="item.node" :key="item.node" />
          </el-select>
        </el-col>
        <template v-if="showMoreQuery">
          <el-col :span="6">
            <el-input
              v-model="fuzzyParams.ip_address"
              :placeholder="$t('Clients.ipAddress')"
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="fuzzyParams.conn_state"
              :placeholder="$t('Clients.connectedStatus')"
              clearable
            >
              <el-option value="connected" />
              <el-option value="disconnected" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <div class="like-input">
              <el-select v-model="fuzzyParams.comparator">
                <el-option :label="$t('Clients.gte')" value="gte" />
                <el-option :label="$t('Clients.lte')" value="lte" />
              </el-select>
              <el-date-picker
                v-model="fuzzyParams.connected_at"
                type="datetime"
                :placeholder="$t('Clients.connectedAt')"
                clearable
              />
            </div>
          </el-col>
        </template>
        <el-col :span="6" class="col-oper">
          <el-button type="primary" plain :icon="Search" @click="handleSearch">
            {{ $t('Base.search') }}
          </el-button>
          <el-button type="primary" :icon="RefreshRight" @click="handleResetSerach">
            {{ $t('Base.refresh') }}
          </el-button>
          <el-icon class="show-more" @click="showMoreQuery = !showMoreQuery">
            <ArrowUp v-if="showMoreQuery" />
            <ArrowDown v-else />
          </el-icon>
        </el-col>
      </el-row>
    </el-form>

    <el-table :data="tableData" ref="clientsTable" v-loading.lock="lockTable">
      <el-table-column
        prop="clientid"
        min-width="140"
        :label="$t('Clients.clientId')"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <router-link
            :to="{
              name: 'connection-detail',
              params: { clientId: row.clientid },
            }"
            class="table-data-without-break"
          >
            {{ row.clientid }}
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="username" min-width="120" :label="$t('Clients.username')" />
      <el-table-column
        prop="connected"
        :min-width="store.state.lang === 'en' ? 140 : 90"
        :label="$t('Clients.connectedStatus')"
      >
        <template #default="{ row }">
          <CheckIcon :status="row.connected ? 'check' : 'close'" size="small" :top="1" />
          <span>{{ row.connected ? $t('Clients.connected') : $t('Clients.disconnected') }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="150" prop="ip_address" :label="$t('Clients.ipAddress')">
        <template #default="{ row }">
          {{ row.ip_address + ':' + row.port }}
        </template>
      </el-table-column>
      <el-table-column prop="keepalive" min-width="100" :label="$t('Clients.keepalive')" />
      <el-table-column prop="connected_at" min-width="140" :label="$t('Clients.connectedAt')">
        <template #default="{ row }">
          {{ moment(row.connected_at).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
      </el-table-column>
      <el-table-column prop="oper" min-width="120" :label="$t('Base.operation')">
        <template #default="{ row }">
          <el-button size="small" type="danger" plain @click="handleDisconnect(row)">
            {{ row.connected ? $t('Clients.kickOut') : $t('Clients.cleanSession') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="emq-table-footer">
      <common-pagination v-model:metaData="pageMeta" @loadPage="loadNodeClients" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'Clients',
})
</script>

<script lang="ts" setup>
import { disconnectClient, listClients } from '@/api/clients'
import { loadNodes } from '@/api/common'
import moment from 'moment'
import CommonPagination from '@/components/commonPagination.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { ArrowUp, ArrowDown, RefreshRight } from '@element-plus/icons-vue'
import CheckIcon from '@/components/CheckIcon.vue'
import { Client } from '@/types/client'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { NodeMsg } from '@/types/dashboard'

const showMoreQuery = ref(false)
const tableData = ref([])
const currentNodes = ref<NodeMsg[]>([])
const lockTable = ref(false)
const params = ref({})
const fuzzyParams = ref<Record<string, any>>({
  comparator: 'gte',
})
const pageMeta = ref({})
const store = useStore()
const { t } = useI18n()

const handleDisconnect = async (row: Client) => {
  let warningMsg = t('Clients.willDisconnectTheConnection')
  let successMsg = t('Clients.successfulDisconnection')
  if (!row.connected) {
    warningMsg = t('Clients.willCleanSession')
    successMsg = t('Clients.successfulCleanSession')
  }
  ElMessageBox.confirm(warningMsg, {
    confirmButtonText: t('Base.confirm'),
    cancelButtonText: t('Base.cancel'),
    type: 'warning',
  })
    .then(async () => {
      await disconnectClient(row.clientid)
      loadNodeClients()
      ElMessage.success(successMsg)
    })
    .catch(() => {
      // ignore
    })
}

const handleSearch = async () => {
  params.value = genQueryParams(fuzzyParams.value)
  loadNodeClients({ page: 1 })
}

const genQueryParams = (params: Record<string, any>) => {
  let newParams: Record<string, any> = {}
  const { like_clientid, like_username, ip_address, conn_state, comparator, connected_at, node } =
    params
  newParams = {
    like_clientid: like_clientid || undefined,
    like_username: like_username || undefined,
    ip_address: ip_address || undefined,
    conn_state: conn_state || undefined,
    node: node || undefined,
  }
  if (connected_at) {
    newParams[`${comparator}_connected_at`] = new Date(connected_at).toISOString()
  }
  return newParams
}

const loadNodeData = async () => {
  const data = await loadNodes()
  if (data) currentNodes.value = data
}

const handleResetSerach = async () => {
  fuzzyParams.value = {
    comparator: 'gte',
  }
  params.value = genQueryParams(fuzzyParams.value)
  loadNodeClients({ page: 1 })
}

const loadNodeClients = async (_params = {}) => {
  lockTable.value = true
  const sendParams = {
    ...params.value,
    ...pageMeta.value,
    ..._params,
  }
  Reflect.deleteProperty(sendParams, 'count')
  const res = await listClients(sendParams).catch(() => {
    lockTable.value = false
  })
  if (res) {
    const { data = [], meta = {} } = res
    tableData.value = data
    lockTable.value = false
    pageMeta.value = meta
  } else {
    tableData.value = []
    lockTable.value = false
    pageMeta.value = {}
  }
}

loadNodeData()
loadNodeClients()
</script>

<style lang="scss">
@import '~@/style/management.scss';
.search-wrapper {
  .like-input {
    > .el-select,
    > .el-date-editor {
      vertical-align: top;
      .is-focus {
        .el-input__wrapper {
          z-index: 20;
        }
      }
      .el-input__wrapper:hover {
        z-index: 20;
      }
    }
    > .el-select {
      width: 30%;
      .el-input__wrapper {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        background-color: var(--el-fill-color-light);
      }
    }
    > .el-date-editor {
      width: 70%;
      position: relative;
      left: -1px;
      .el-input__wrapper {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-left-color: transparent;
      }
    }
  }
}
</style>
