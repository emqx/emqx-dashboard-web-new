<template>
  <div class="app-wrapper iot">
    <RuleFilterForm @search="searchRule" class="with-dividing-line-bottom" />
    <div class="section-header">
      <div></div>
      <div>
        <el-button type="primary" :icon="Plus" @click="$router.push({ name: 'iot-create' })">
          {{ tl('create', 'Base') }}
        </el-button>
      </div>
    </div>

    <el-table :data="ruleTable" v-loading="iotLoading">
      <el-table-column label="ID" show-overflow-tooltip>
        <template #default="{ row }">
          <router-link
            :to="{ name: 'iot-detail', params: { id: row.id } }"
            class="table-data-without-break"
          >
            {{ row.id }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column :label="tl('source')">
        <template #default="{ row }">
          <el-tooltip effect="dark" placement="top-start" popper-class="code-popper">
            <template #content>
              <CodeView lang="sql" :code="row.sql" />
            </template>
            <div class="inputs-container">
              <span class="input-item" v-for="item in row.from" :key="item">{{ item }}</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="enable" :label="$t('Base.isEnabled')">
        <template #default="{ row }">
          <el-switch v-model="row.enable" @change="startOrStopRule(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="description" :label="tl('note')"></el-table-column>
      <el-table-column :label="tl('createdAt')">
        <template #default="{ row }">
          {{ row.created_at && moment(row.created_at).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('Base.operation')">
        <template #default="{ row }">
          <el-button
            size="small"
            @click="
              $router.push({
                name: 'iot-detail',
                params: { id: row.id },
                query: { tab: 'settings' },
              })
            "
          >
            {{ $t('Base.setting') }}
          </el-button>
          <TableItemDropDown
            :row-data="row"
            @resetStatistics="resetRuleItemStatistics(row)"
            @copy="copyRuleItem(row)"
            @delete="submitDeleteRules"
          />
        </template>
      </el-table-column>
    </el-table>
    <div class="emq-table-footer">
      <commonPagination :meta-data="pageParams" @load-page="handlePageParamsChanged" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { deleteRules, getRules, resetRuleMetrics, updateRules } from '@/api/ruleengine'
import CodeView from '@/components/CodeView.vue'
import useCopyRule from '@/hooks/Rule/rule/useCopyRule'
import usePagination from '@/hooks/usePagination'
import { FilterParamsForQueryRules, RuleItem } from '@/types/rule'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage as M, ElMessageBox as MB } from 'element-plus'
import moment from 'moment'
import { onMounted, ref, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TableItemDropDown from './components/TableItemDropDown.vue'
import commonPagination from '@/components/commonPagination.vue'
import { PageParams } from '@/types/common'
import RuleFilterForm from './components/RuleFilterForm.vue'

const { t } = useI18n()
const ruleTable: Ref<Array<RuleItem>> = ref([])
const iotLoading: Ref<boolean> = ref(false)

const { page, limit, count, pageParams, resetPageNum } = usePagination()
let filterParams: FilterParamsForQueryRules = {}

const { copyRule } = useCopyRule()

const tl = (key: string, moduleName = 'RuleEngine') => t(`${moduleName}.${key}`)

const getRulesList = async () => {
  iotLoading.value = true
  try {
    const { page, limit } = pageParams.value
    const { data = [], meta = {} } = await getRules({ page, limit, ...filterParams })
    ruleTable.value = data
    count.value = meta.count
  } catch (error) {
    console.error(error)
  } finally {
    iotLoading.value = false
  }
}

const handlePageParamsChanged = (newParams: PageParams) => {
  if (newParams.limit === limit.value) {
    page.value = newParams.page
  } else {
    page.value = 1
    limit.value = newParams.limit
  }
  getRulesList()
}

const searchRule = (filterParamsData: FilterParamsForQueryRules) => {
  filterParams = filterParamsData
  page.value = 1
  getRulesList()
}

const startOrStopRule = async (row: RuleItem) => {
  try {
    await updateRules(row.id, { enable: row.enable })
    M.success(t(row.enable ? 'Base.enableSuccess' : 'Base.disabledSuccess'))
  } catch (error) {
    console.error(error)
    row.enable = !row.enable
  }
}

const resetRuleItemStatistics = async ({ id }: RuleItem) => {
  await MB.confirm(t('RuleEngine.resetMetricsConfirm', { target: tl('rule') }))
  await resetRuleMetrics(id)
  M.success(tl('resetSuccessfully'))
  getRulesList()
}

const copyRuleItem = (rule: RuleItem) => {
  copyRule(rule)
}

const submitDeleteRules = async ({ id }: RuleItem) => {
  if (!id) return
  await MB.confirm(t('Base.confirmDelete'), {
    confirmButtonText: t('Base.confirm'),
    cancelButtonText: t('Base.cancel'),
    type: 'warning',
  })
  iotLoading.value = true

  try {
    await deleteRules(id)
    M.success(t('Base.deleteSuccess'))
    iotLoading.value = false
    page.value = resetPageNum(ruleTable.value, page.value)
    getRulesList()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  getRulesList()
})
</script>

<style lang="scss" scoped>
.el-button-group {
  .el-button {
    &.el-button--default {
      border-color: var(--el-button-border-color);
      min-width: 90px;

      &.active {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        z-index: 1;
      }

      &:hover {
        color: unset;
      }
    }
  }
}
.inputs-container {
  display: flex;
  flex-direction: column;
  width: fit-content;
}
.input-item {
  &:not(:last-child)::after {
    content: ',';
  }
}

.rule-filter-form {
  margin-bottom: 16px;
}
</style>
<style lang="scss">
.code-popper.el-popper {
  padding: 0;
  .code-view {
    margin: 0;
    padding: 12px;
  }
}
</style>
