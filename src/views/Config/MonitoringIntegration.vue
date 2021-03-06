<template>
  <div class="monitoring-integration app-wrapper">
    <el-card class="config-card" v-loading="isDataLoading">
      <el-form label-position="top" class="schema-form">
        <el-row>
          <el-col :span="12">
            <el-form-item :label="tl('monitoringPlatformFormItemLabel')" class="radio-form-item">
              <el-radio-group class="platform-radio-group" v-model="selectedPlatform">
                <el-row :gutter="28">
                  <el-col v-for="item in platformOpts" :key="item.label" :span="12">
                    <el-radio class="platform-radio-radio" :label="item.label" border>
                      <img class="img-platform" height="52" :src="item.img" :alt="item.label" />
                      <span class="platform-name"> {{ item.label }} </span>
                    </el-radio>
                  </el-col>
                </el-row>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="selectedPlatform === PROMETHEUS">
          <el-col :span="16" class="custom-col">
            <el-form-item :label="t('Base.isEnabled')">
              <p class="item-desc">{{ tl('prometheusEnableDesc') }}</p>
              <el-switch v-model="prometheusFormData.enable" />
            </el-form-item>
          </el-col>
          <el-col :span="16" class="custom-col">
            <el-form-item label="Pushgateway Server">
              <p class="item-desc">{{ tl('prometheusServerDesc') }}</p>
              <el-input v-model="prometheusFormData.push_gateway_server" />
            </el-form-item>
          </el-col>
          <el-col :span="16" class="custom-col">
            <el-form-item :label="tl('dataReportingInterval')">
              <p class="item-desc">{{ tl('dataReportingInterval') }}</p>
              <TimeInputWithUnitSelectVue v-model="prometheusFormData.interval" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-else>
          <el-col :span="16" class="custom-col">
            <el-form-item :label="t('Base.isEnabled')">
              <p class="item-desc">{{ tl('statsDEnableDesc') }}</p>
              <el-switch v-model="statsDFormData.enable" />
            </el-form-item>
          </el-col>
          <el-col :span="16" class="custom-col">
            <el-form-item :label="t('Base.server')">
              <p class="item-desc">{{ tl('statsDServerDesc') }}</p>
              <el-input v-model="statsDFormData.server" />
            </el-form-item>
          </el-col>
          <el-col :span="16" class="custom-col">
            <el-form-item :label="tl('dataReportingInterval')">
              <p class="item-desc">{{ tl('dataReportingInterval') }}</p>
              <TimeInputWithUnitSelectVue v-model="statsDFormData.flush_time_interval" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="ft">
          <el-button type="primary" :loading="isSubmitting" @click="submit">
            {{ $t('Base.update') }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getPrometheus, getStatsD, setPrometheus, setStatsD } from '@/api/common'
import promImg from '@/assets/img/prom.png'
import statsDImg from '@/assets/img/statsd.png'
import TimeInputWithUnitSelectVue from '@/components/TimeInputWithUnitSelect.vue'
import useI18nTl from '@/hooks/useI18nTl'
import { Prometheus, StatsD } from '@/types/dashboard'
import { ElMessage } from 'element-plus'
import { ref, Ref } from 'vue'

const PROMETHEUS = 'Prometheus'
const STATS_D = 'StatsD'

const { tl, t } = useI18nTl('MonitoringIntegration')

const platformOpts = [
  {
    label: PROMETHEUS,
    value: PROMETHEUS,
    img: promImg,
  },
  {
    label: STATS_D,
    value: STATS_D,
    img: statsDImg,
  },
]

const selectedPlatform = ref(platformOpts[0].value)
const prometheusFormData: Ref<Prometheus> = ref({
  enable: false,
  interval: '15s',
  push_gateway_server: '',
})
const statsDFormData: Ref<StatsD> = ref({
  enable: false,
  flush_time_interval: '10s',
  sample_time_interval: '10s',
  server: '',
})

const isDataLoading = ref(false)
const loadIntegration = async function () {
  isDataLoading.value = true
  let [prometheusRes, statsRes] = await Promise.allSettled([getPrometheus(), getStatsD()])
  if (prometheusRes?.status == 'fulfilled') {
    prometheusFormData.value = prometheusRes.value
  }
  if (statsRes?.status == 'fulfilled') {
    statsDFormData.value = statsRes.value
  }
  isDataLoading.value = false
}
const isSubmitting = ref(false)

const updatePrometheus = async function () {
  try {
    isSubmitting.value = true
    await setPrometheus(prometheusFormData.value)
    ElMessage.success(t('Base.updateSuccess'))
  } catch (error) {
    loadIntegration()
  } finally {
    isSubmitting.value = false
  }
}

const updateStatsD = async function () {
  try {
    isSubmitting.value = true
    await setStatsD(statsDFormData.value)
    ElMessage.success(t('Base.updateSuccess'))
  } catch (error) {
    loadIntegration()
  } finally {
    isSubmitting.value = false
  }
}

const submit = async () => {
  if (selectedPlatform.value === PROMETHEUS) {
    await updatePrometheus()
  } else {
    await updateStatsD()
  }
}

loadIntegration()
</script>

<style lang="scss">
.monitoring-integration {
  .schema-form {
    padding-bottom: 20px;
  }
  .radio-form-item {
    width: 100%;
    padding: 0 12px;
  }
  .platform-radio-group {
    width: 100%;
    .el-row {
      width: 80%;
    }
  }
  .platform-radio-radio {
    width: 100%;
    height: auto;
    .el-radio__input {
      display: none;
    }
    .el-radio__label {
      display: flex;
      align-items: center;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .img-platform {
      margin-right: 8px;
    }
    .platform-name {
      overflow: hidden;
      word-break: break-all;
      text-overflow: ellipsis;
    }
  }
  .ft {
    padding: 12px 12px + 12px + 4px;
  }
}
</style>
