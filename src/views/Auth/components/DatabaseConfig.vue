<template>
  <div class="database-config config">
    <!-- Connect -->
    <el-form
      ref="formCom"
      class="create-form"
      label-position="top"
      :model="databaseConfig"
      :rules="rules"
    >
      <div class="config-sub-block">
        <div class="part-header">{{ $t('Auth.connect') }}</div>
        <el-row :gutter="20">
          <el-col v-if="isRedis" :span="12">
            <el-form-item :label="$t('Auth.redisType')" prop="redis_type" required>
              <el-select v-model="databaseConfig.redis_type">
                <el-option value="single" :label="$t('Auth.single')" />
                <el-option value="sentinel" label="Sentinel" />
                <el-option value="cluster" label="Cluster" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="isMongoDB" :span="12">
            <el-form-item :label="$t('Auth.mongoType')" required prop="mongo_type">
              <el-select
                v-model="databaseConfig.mongo_type"
                @change="clearValidateAfterSomeFieldChanged"
              >
                <el-option value="single" :label="$t('Auth.single')" />
                <el-option value="rs" label="Replica Set" />
                <el-option value="sharded" label="Sharding" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="isServers" :span="12">
            <el-form-item :label="$t('Auth.servers')" required prop="servers">
              <el-input v-model="databaseConfig.servers" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col v-else :span="12">
            <el-form-item :label="$t('Auth.server')" required prop="server">
              <el-input v-model="databaseConfig.server" />
            </el-form-item>
          </el-col>
          <el-col v-if="isMongoDB && databaseConfig.mongo_type === MongoType.Rs" :span="12">
            <el-form-item label="Replica Set Name" required prop="replica_set_name">
              <el-input v-model="databaseConfig.replica_set_name" />
            </el-form-item>
          </el-col>
          <!-- Redis -->
          <el-col v-if="isRedis && databaseConfig.redis_type === 'sentinel'" :span="12">
            <el-form-item :label="$t('Auth.sentinel')" prop="sentinel" required>
              <el-input v-model="databaseConfig.sentinel" />
            </el-form-item>
          </el-col>
          <!-- Basic -->
          <el-col :span="12">
            <el-form-item :label="$t('Auth.database')" required prop="database">
              <el-input v-model="databaseConfig.database" />
            </el-form-item>
          </el-col>
          <el-col v-if="isMongoDB" :span="12">
            <el-form-item label="Collection" required prop="collection">
              <el-input v-model="databaseConfig.collection" />
            </el-form-item>
          </el-col>
          <el-col v-if="!isRedis" :span="12">
            <el-form-item :label="$t('Base.userName')">
              <el-input v-model="databaseConfig.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('Base.password')">
              <el-input
                v-model="databaseConfig.password"
                type="password"
                autocomplete="new-password"
              />
            </el-form-item>
          </el-col>
          <template v-if="isMongoDB && databaseConfig.mongo_type === 'rs'">
            <el-col :span="12">
              <el-form-item :label="$t('Auth.readMode')">
                <el-select v-model="databaseConfig.r_mode">
                  <el-option value="master" label="master" />
                  <el-option value="slave_ok" label="slave_ok" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="databaseConfig.mongo_type === 'rs'" :span="12">
              <el-form-item :label="$t('Auth.writeMode')">
                <el-select v-model="databaseConfig.w_mode">
                  <el-option value="safe" label="safe" />
                  <el-option value="unsafe" label="unsafe" />
                </el-select>
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="24">
            <!-- TLS -->
            <CommonTLSConfig class="TLS-config" v-model="databaseConfig.ssl" :is-edit="isEdit" />
          </el-col>
        </el-row>
      </div>

      <!-- Connect Config -->
      <div class="config-sub-block">
        <div class="part-header">{{ $t('Auth.connectConfig') }}</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Pool size">
              <el-input v-model.number="databaseConfig.pool_size" />
            </el-form-item>
          </el-col>
          <el-col v-if="!isMongoDB" :span="12">
            <el-form-item :label="$t('Auth.reconnect')">
              <BooleanSelect
                v-model="databaseConfig.auto_reconnect"
                true-label="True"
                false-label="False"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="isMongoDB" :span="12">
            <el-form-item :label="$t('Auth.connectTimeout')">
              <time-input-with-unit-select v-model="databaseConfig.topology.connect_timeout_ms" />
            </el-form-item>
          </el-col>
          <el-col v-if="authType === 'authn' && isMySQL" :span="12">
            <el-form-item :label="$t('Auth.queryTimeout')">
              <time-input-with-unit-select v-model="databaseConfig.query_timeout" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Auth Config -->
      <div class="config-sub-block">
        <div class="part-header">
          <span>
            {{ authType === 'authn' ? $t('Auth.authnConfig') : $t('Auth.authzConfig') }}
          </span>
          <el-button class="help-btn" size="small" @click="toggleNeedHelp">
            {{ $t('Base.help') }}
          </el-button>
        </div>
        <el-row :gutter="20">
          <template v-if="authType === 'authn'">
            <el-col v-if="isMongoDB" :span="12">
              <el-form-item :label="$t('Auth.passwordHashField')">
                <el-input
                  v-model="databaseConfig.password_hash_field"
                  placeholder="password_hash"
                />
              </el-form-item>
            </el-col>
            <PasswordHashAlgorithmFormItems v-model="databaseConfig" @change="handleSaltChanged" />
            <el-col v-if="isMongoDB && isEnableSalt" :span="12">
              <el-form-item :label="$t('Auth.saltField')">
                <el-input v-model="databaseConfig.salt_field" placeholder="salt" />
              </el-form-item>
            </el-col>

            <el-col v-if="isMongoDB" :span="12">
              <el-form-item :label="$t('Auth.superuserField')">
                <el-input
                  v-model="databaseConfig.is_superuser_field"
                  :placeholder="$t('Auth.isSuperuser')"
                />
              </el-form-item>
            </el-col>
          </template>
          <!-- MySQL & PgSQL -->
          <el-col :span="24" v-if="isMySQL || isPgSQL">
            <el-form-item label="SQL" required prop="query">
              <div class="viewer-container" ref="monacoContainer">
                <monaco id="adatabase-query" v-model="databaseConfig.query" lang="sql" />
              </div>
              <el-button class="bottom-btn" size="small" @click="setDefaultContent('query')">
                {{ $t('Auth.setDefault') }}
              </el-button>
            </el-form-item>
          </el-col>
          <!-- Mongodb -->
          <el-col :span="24" v-else-if="isMongoDB">
            <el-form-item :label="$t('Auth.filter')">
              <div class="viewer-container" ref="monacoContainer">
                <monaco id="adatabase-query" v-model="databaseConfig.filter" lang="json" />
              </div>
              <el-button class="bottom-btn" size="small" @click="setDefaultContent('filter')">
                {{ $t('Auth.setDefault') }}
              </el-button>
            </el-form-item>
          </el-col>
          <!-- Redis -->
          <el-col :span="24" v-else-if="isRedis">
            <el-form-item :label="$t('Auth.cmd')" required prop="cmd">
              <el-input v-model="databaseConfig.cmd" type="textarea" :rows="6" />
              <el-button class="bottom-btn" size="small" @click="setDefaultContent('cmd')">
                {{ $t('Auth.setDefault') }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-collapse-transition>
            <el-col v-if="needHelp" :span="24">
              <HelpBlock :auth-type="authType" :database-type="database" />
            </el-col>
          </el-collapse-transition>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts">
import { PASSWORD_HASH_TYPES_WHICH_NEED_SALT_POSITION } from '@/common/constants'
import { waitAMoment } from '@/common/tools'
import BooleanSelect from '@/components/BooleanSelect.vue'
import Monaco from '@/components/Monaco.vue'
import TimeInputWithUnitSelect from '@/components/TimeInputWithUnitSelect.vue'
import CommonTLSConfig from '@/components/TLSConfig/CommonTLSConfig.vue'
import useDatabaseConfig from '@/hooks/Auth/useDatabaseConfig'
import useDatabaseConfigForm from '@/hooks/Auth/useDatabaseConfigForm'
import { MongoType, SaltPosition } from '@/types/enum'
import { computed, defineComponent, ref } from 'vue'
import HelpBlock from './HelpBlock.vue'
import PasswordHashAlgorithmFormItems from './PasswordHashAlgorithmFormItems.vue'

export default defineComponent({
  name: 'DatabaseConfig',
  components: {
    CommonTLSConfig,
    TimeInputWithUnitSelect,
    PasswordHashAlgorithmFormItems,
    BooleanSelect,
    Monaco,
    HelpBlock,
  },

  props: {
    database: {
      required: true,
      type: String,
    },
    modelValue: {
      required: true,
      type: Object,
    },
    authType: {
      required: true,
      type: String,
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, ctx) {
    const { defaultSQL, withSaltDefaultSQL, databaseConfig, defaultContent } = useDatabaseConfig(
      props,
      ctx,
    )
    const {
      formCom,
      rules,
      isMongoDB,
      isRedis,
      isMySQL,
      isPgSQL,
      isServers,
      validate,
      clearValidate,
    } = useDatabaseConfigForm(props, databaseConfig)
    const needHelp = ref(false)
    const setDefaultContent = (dataKey: string) => {
      if (isMySQL.value || isPgSQL.value) {
        databaseConfig[dataKey] =
          databaseConfig.password_hash_algorithm.salt_position !== SaltPosition.Disable
            ? withSaltDefaultSQL
            : defaultSQL
      } else {
        databaseConfig[dataKey] = defaultContent.value
      }
    }

    const btnCopyHelp = ref()
    const toggleNeedHelp = async () => {
      needHelp.value = !needHelp.value
      if (needHelp.value) {
        await waitAMoment(350)
        btnCopyHelp.value?.$el?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    const isEnableSalt = computed(() => {
      const { name, salt_position } = databaseConfig.password_hash_algorithm
      const needSelectSalt = name && PASSWORD_HASH_TYPES_WHICH_NEED_SALT_POSITION.includes(name)
      return needSelectSalt && salt_position !== SaltPosition.Disable
    })

    const handleSaltChanged = () => {
      if (!(isMySQL.value || isPgSQL.value)) {
        return
      }
      if (!isEnableSalt.value && databaseConfig.query === withSaltDefaultSQL) {
        databaseConfig.query = defaultSQL
      } else if (isEnableSalt.value && databaseConfig.query === defaultSQL) {
        databaseConfig.query = withSaltDefaultSQL
      }
    }

    const clearValidateAfterSomeFieldChanged = async () => {
      await waitAMoment(32)
      clearValidate()
    }

    return {
      formCom,
      rules,
      isMongoDB,
      isRedis,
      isMySQL,
      isPgSQL,
      isServers,
      needHelp,
      databaseConfig,
      isEnableSalt,
      btnCopyHelp,
      MongoType,
      clearValidateAfterSomeFieldChanged,
      validate,
      setDefaultContent,
      toggleNeedHelp,
      handleSaltChanged,
    }
  },
})
</script>

<style lang="scss">
@import '../style/authConfig.scss';
</style>
