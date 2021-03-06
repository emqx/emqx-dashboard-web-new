import { computed, defineComponent, ref, watch } from 'vue'
import useSchemaForm from '@/hooks/Config/useSchemaForm'
import { Properties } from '@/types/schemaForm'
import TimeInputWithUnitSelect from './TimeInputWithUnitSelect.vue'
import InputWithUnit from './InputWithUnit.vue'
import ArrayEditor from './ArrayEditor.vue'
import Oneof from './Oneof.vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { Setting } from '@element-plus/icons-vue'
import '@/style/schemaForm.scss'
import { useStore } from 'vuex'
import { SESSION_FIELDS } from '@/common/constants'

interface FormItemMeta {
  col: number
  levelName?: string
}

const SchemaForm = defineComponent({
  name: 'SchemaForm',
  components: {
    TimeInputWithUnitSelect,
    InputWithUnit,
    ArrayEditor,
    Oneof,
    Setting,
  },
  props: {
    path: {
      type: String,
      required: true,
    },
    form: {
      required: true,
    },
    btnLoading: {
      type: Boolean,
      default: false,
    },
    canRemoveConfig: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      required: false,
      default: '',
    },
  },
  setup(props, ctx) {
    const configForm = ref<{ [key: string]: any }>({})
    const { components, flattenConfigs, unflattenConfigs } = useSchemaForm(props.path)
    const { t } = useI18n()
    const groups = computed(() => {
      const properties = _.cloneDeep(components.value)
      let _groups: string[] = []
      let hasBasicInfo = false
      Object.keys(properties).forEach((key) => {
        const prop = properties[key]
        if (prop.properties) {
          _groups.push(prop.label)
        } else {
          hasBasicInfo = true
        }
      })
      if (hasBasicInfo) {
        _groups = [t('BasicConfig.basic'), ..._groups]
      }
      return _groups
    })
    const currentGroup = ref(groups.value[0] || t('BasicConfig.basic'))
    watch(
      () => props.form,
      (value) => {
        configForm.value = _.cloneDeep(flattenConfigs(value))
      },
    )
    const store = useStore()
    const replaceVarPath = (path: string) => {
      let _path = path
      if (/\$\w+/g.test(_path)) {
        // FIXME: default string value is only temporary.
        // Replace the variable characters in the path with real words, e.g. file_handle.$name -> file_handle.default
        _path = _path.replace(/\$\w+/g, 'default')
      }
      return _path
    }
    const resetValue = (property: Properties[string]) => {
      if (!property.path) return
      if (property.default !== undefined && property.default !== null) {
        configForm.value[property.path] = property.default
      }
    }
    const removeValue = (property: Properties[string]) => {
      if (!property.path) return
      Reflect.deleteProperty(configForm.value, property.path)
    }
    const switchComponent = (property: Properties[string]): JSX.Element | undefined => {
      if (!property.path) return
      property.path = replaceVarPath(property.path)
      const { path } = property
      const stringInput = (
        <el-input
          disabled={property.readOnly}
          placeholder={property.default?.toString()}
          v-model={configForm.value[path]}
          clearable
        ></el-input>
      )
      switch (property.type) {
        case 'string':
          return stringInput
        case 'number':
          return (
            <el-input-number
              controls-position="right"
              disabled={property.readOnly}
              v-model={configForm.value[path]}
              placeholder={property.default?.toString()}
              min={0}
            ></el-input-number>
          )
        case 'enum':
          return (
            <el-select
              disabled={property.readOnly}
              placeholder={property.default?.toString()}
              v-model={configForm.value[path]}
              clearable
            >
              {property.symbols?.map((opt) => (
                <el-option value={opt} label={opt}></el-option>
              ))}
            </el-select>
          )
        case 'boolean':
          return (
            <el-switch disabled={property.readOnly} v-model={configForm.value[path]}></el-switch>
          )
        case 'array':
          if (['number', 'string'].includes(property.items.type)) {
            return (
              <array-editor
                v-model={configForm.value[path]}
                disabled={property.readOnly}
                type={property.items.type}
                default={property.default}
              ></array-editor>
            )
          }
          return <div></div>
        case 'duration':
          return (
            <time-input-with-unit-select
              disabled={property.readOnly}
              v-model={configForm.value[path]}
            ></time-input-with-unit-select>
          )
        case 'byteSize':
          return (
            <input-with-unit
              disabled={property.readOnly}
              v-model={configForm.value[path]}
              units={['MB', 'GB', 'KB']}
            ></input-with-unit>
          )
        case 'percent':
          return (
            <input-with-unit
              disabled={property.readOnly}
              v-model={configForm.value[path]}
              units={['%']}
            ></input-with-unit>
          )
        case 'comma_separated_string':
          return stringInput
        case 'oneof':
          return (
            <oneof
              v-model={configForm.value[path]}
              items={property.oneOf}
              disabled={property.readOnly}
            ></oneof>
          )
        default:
          return stringInput
      }
    }
    const setControl = (property: Properties[string]) => {
      if (property.oneOf && !property.type) {
        property.type = 'oneof'
      }
      if (!property.type) return
      return switchComponent(property)
    }

    const getColFormItem = (property: Properties[string], { col, levelName }: FormItemMeta) => {
      const handleCommand = (command: string) => {
        if (command === 'reset') {
          resetValue(property)
        } else if (command === 'remove') {
          removeValue(property)
        }
      }
      const slots = {
        dropdown: () => (
          <el-dropdown-menu>
            <el-dropdown-item
              command="reset"
              disabled={property.default === undefined || property.readOnly}
            >
              {t('Base.reset')}
            </el-dropdown-item>
            {props.canRemoveConfig ? (
              <el-dropdown-item command="remove">{t('Base.remove')}</el-dropdown-item>
            ) : null}
          </el-dropdown-menu>
        ),
      }
      const colItem = (
        <el-col span={col}>
          {['mqtt', 'session'].includes(props.type) ? null : (
            <el-dropdown
              class="schema-col-setting"
              trigger="click"
              v-slots={slots}
              onCommand={handleCommand}
            >
              <a class="setting-btn">
                <el-icon>
                  <Setting />
                </el-icon>
              </a>
            </el-dropdown>
          )}
          <el-tooltip
            disabled={!property.readOnly}
            popper-class="read-only-tooltip"
            content={t('BasicConfig.readOnlyTip')}
            placement="right"
            effect="dark"
          >
            <el-form-item label={property.label} prop={property.path}>
              <p class="item-desc" v-html={property.description}></p>
              {setControl(property)}
            </el-form-item>
          </el-tooltip>
        </el-col>
      )
      // Cluster form add Invite Node component
      if (props.type === 'cluster' && property.path === 'discovery_strategy') {
        const isManualCluster = configForm.value[property.path] === 'manual'
        if (isManualCluster) {
          return (
            <>
              {colItem}
              <el-col span={col}>{ctx.slots['invite-node']?.()}</el-col>
            </>
          )
        }
      }
      if (levelName) {
        return (
          <>
            <el-col span={16}>
              <div class="group-title">{levelName}</div>
            </el-col>
            {colItem}
          </>
        )
      }
      return colItem
    }

    const save = () => {
      const value = unflattenConfigs(configForm.value)
      ctx.emit('save', value)
    }

    const renderLayout = (contents: JSX.Element[]) => {
      const btnStyles = {
        left: store.state.leftBarCollapse ? '104px' : '224px',
      }
      const groupTabs = groups.value.map((group: string) => (
        <el-tab-pane label={group} name={group} />
      ))
      let tabs: JSX.Element | null = (
        <el-tabs type="card" v-model={currentGroup.value} class="group-tabs">
          {groupTabs}
        </el-tabs>
      )
      // FIXME: for MQTT page
      if (['mqtt', 'session'].includes(props.type)) {
        tabs = null
        currentGroup.value = 'mqtt'
      }
      if (props.type === 'log' && currentGroup.value === t('BasicConfig.basic')) {
        currentGroup.value = 'Console Handler'
      }
      return (
        <>
          {tabs}
          <el-form label-position="top">
            <el-row>
              {contents}
              <el-col span={24} class="btn-col" style={btnStyles}>
                <el-button type="primary" loading={props.btnLoading} onClick={save}>
                  {t('Base.save')}
                </el-button>
              </el-col>
            </el-row>
          </el-form>
        </>
      )
    }

    // Get the components to render form by Propoerties
    const getComponents = (properties: Properties, meta: FormItemMeta) => {
      let [levelName, oldLevelName] = [meta.levelName || '', '']
      const elements: JSX.Element[] = []
      let _properties: Properties = {}
      // Filter the current Group properties
      for (const key in properties) {
        const propItem = properties[key]
        if (currentGroup.value === propItem.label && propItem.properties) {
          _properties = propItem?.properties
          break
        }
        if (!propItem.properties) {
          _properties[key] = propItem
        }
      }
      const setComponents = (properties: Properties) => {
        Object.keys(properties).forEach((key) => {
          if (props.type === 'mqtt') {
            if (SESSION_FIELDS.includes(key)) {
              return
            }
          }
          if (props.type === 'session') {
            if (!SESSION_FIELDS.includes(key)) {
              return
            }
          }
          const property = properties[key]
          if (property.properties) {
            const { label, properties } = property
            levelName = label
            setComponents(properties)
          } else {
            let elFormItem = <></>
            if (levelName !== oldLevelName) {
              oldLevelName = levelName
              elFormItem = getColFormItem(property, { levelName, col: meta.col })
            } else if (levelName === oldLevelName) {
              elFormItem = getColFormItem(property, { col: meta.col })
            }
            elements.push(elFormItem)
          }
        })
        return elements
      }
      return setComponents(_properties)
    }
    const renderSchemaForm = (properties: Properties) => {
      const schemaForm = renderLayout(getComponents(properties, { col: 16 }))
      return schemaForm
    }
    return () => <div class="schema-form">{renderSchemaForm(components.value)}</div>
  },
})

export default SchemaForm
