<template>
  <el-form>
    <el-form-item
      v-for="key in Object.keys(record)"
      :key="key"
      :class="{ 'code-sql': key === 'payload', payload: key === 'payload' }"
      v-bind="{ label: key, prop: `${key}` }"
    >
      <el-input v-if="key !== 'payload'" v-model="record[key]" />
      <template v-else>
        <div class="monaco-container" :style="{ height: `${payloadEditorHeight}px` }">
          <Monaco
            :id="createRandomString()"
            v-model="record.payload"
            class="payload"
            :lang="payloadType"
          />
        </div>
        <div class="payload-type">
          <el-radio-group v-model="payloadType">
            <el-radio :label="PayloadType.JSON">JSON</el-radio>
            <el-radio :label="PayloadType.Plaintext">Plaintext</el-radio>
          </el-radio-group>
        </div>
        <StretchHeight v-model="payloadEditorHeight" class="payload" />
      </template>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TestSQLContextForm',
})
</script>

<script setup lang="ts">
import { ref, defineProps, defineEmits, PropType, watch, reactive } from 'vue'
import Monaco from '@/components/Monaco.vue'
import StretchHeight from './StretchHeight.vue'
import { createRandomString } from '@/common/tools'

enum PayloadType {
  JSON = 'json',
  Plaintext = 'plaintext',
}

const props = defineProps({
  modelValue: {
    type: Object as PropType<Record<string, string>>,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const payloadType = ref(PayloadType.JSON)
const payloadEditorHeight = ref(200)

const record = reactive(props.modelValue)

watch(record, (val) => {
  emit('update:modelValue', val)
})
</script>

<style lang="scss" scoped>
.el-form-item {
  margin-top: 12px;
}
.payload-type {
  box-sizing: border-box;
  width: 100%;
  padding: 2px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-top: none;
  text-align: right;
  line-height: 1;
  .el-radio__label {
    font-size: 13px;
  }
}
</style>
