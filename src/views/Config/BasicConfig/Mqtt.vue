<template>
  <div class="mqtt app-wrapper">
    <el-card>
      <schema-form
        path="/configs/zones"
        type="mqtt"
        :form="configs"
        :btn-loading="saveLoading"
        @save="handleSave"
      >
      </schema-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import SchemaForm from '@/components/SchemaForm'
import { getDefaultZoneConfigs, updateDefaultZoneConfigs } from '@/api/config'
import { Zone } from '../../../types/config'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'Mqtt',
  components: {
    SchemaForm,
  },
  setup() {
    const configs = ref({})
    const saveLoading = ref(false)
    const { t } = useI18n()
    const loadData = async () => {
      const res = await getDefaultZoneConfigs()
      if (res) {
        configs.value = res
      }
    }
    const reloading = () => {
      loadData()
    }
    const handleSave = async (val: Zone) => {
      saveLoading.value = true
      const data = {
        ...val,
      }
      try {
        await updateDefaultZoneConfigs(data)
        ElMessage.success(t('Base.updateSuccess'))
        reloading()
      } catch (error) {
        // ignore error
      } finally {
        saveLoading.value = false
      }
    }
    loadData()
    return {
      configs,
      saveLoading,
      handleSave,
    }
  },
})
</script>

<style lang="scss"></style>
