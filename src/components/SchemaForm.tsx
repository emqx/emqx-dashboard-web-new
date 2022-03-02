import { defineComponent, Ref } from 'vue'
import useSchemaForm from '@/hooks/Config/useSchemaForm'
import { Properties } from '@/types/schemaForm'
import TimeInputWithUnitSelect from '@/components/TimeInputWithUnitSelect.vue'
import InputWithUnit from '@/components/InputWithUnit.vue'
import InputArray from '@/components/InputArray.vue'
import '@/style/schemaForm.scss'

const SchemaForm = defineComponent({
  name: 'SchemaForm',
  components: {
    TimeInputWithUnitSelect,
    InputWithUnit,
    InputArray,
  },
  props: {
    path: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { components }: { components: Ref<Properties> } = useSchemaForm(props.path)
    const byteSizeUnit = [
      {
        label: 'MB',
        value: 'MB',
      },
      {
        label: 'G',
        value: 'G',
      },
      {
        label: 'Kb',
        value: 'Kb',
      },
    ]
    const setControl = (property: Properties[string]) => {
      switch (property.type) {
        case 'string':
          return <el-input placeholder={property.default}></el-input>
        case 'number':
          return <el-input type="number" placeholder={property.default.toString()}></el-input>
        case 'enum':
          return (
            <el-select placeholder={property.default}>
              {property.symbols?.map((opt) => (
                <el-option value={opt} label={opt}></el-option>
              ))}
            </el-select>
          )
        case 'boolean':
          return <el-switch></el-switch>
        case 'duration':
          return <time-input-with-unit-select></time-input-with-unit-select>
        case 'byteSize':
          return <input-with-unit units={byteSizeUnit}></input-with-unit>
        case 'array':
          return <input-array></input-array>
        default:
          break
      }
    }

    const getColFormItem = (property: Properties[string], groupName?: string) => {
      const colItem = (
        <el-col span={16}>
          <el-form-item label={property.label}>
            <p class="item-desc">{property.description}</p>
            {setControl(property)}
          </el-form-item>
        </el-col>
      )
      if (groupName) {
        return (
          <>
            <el-col span={24}>
              <div class="part-header">{groupName}</div>
            </el-col>
            {colItem}
          </>
        )
      }
      return colItem
    }

    const renderLayout = (contents: JSX.Element[]) => (
      <el-form label-position="top">
        <el-row>{contents}</el-row>
      </el-form>
    )

    const getComponents = (properties: Properties) => {
      let [groupName, oldGroupName] = ['Basic', '']
      const elements: JSX.Element[] = []
      const setComponents = (properties: Properties) => {
        Object.keys(properties).forEach((key) => {
          const property = properties[key]
          if (property.properties) {
            const { label, properties } = property
            groupName = label
            setComponents(properties)
          } else {
            let elFormItem = <></>
            if (groupName !== oldGroupName) {
              oldGroupName = groupName
              elFormItem = getColFormItem(property, groupName)
            } else if (groupName === oldGroupName) {
              elFormItem = getColFormItem(property)
            }
            elements.push(elFormItem)
          }
        })
        return elements
      }
      return setComponents(properties)
    }

    const renderSchemaForm = (properties: Properties) => {
      const schemaForm = renderLayout(getComponents(properties))
      return schemaForm
    }
    return () => <div class="schema-form">{renderSchemaForm(components.value)}</div>
  },
})

export default SchemaForm
