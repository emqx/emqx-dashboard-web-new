import { defineComponent, Ref } from 'vue'
import useSchemaForm from '@/hooks/Config/useSchemaForm'
import { Properties } from '@/types/schemaForm'
import TimeInputWithUnitSelect from '@/components/TimeInputWithUnitSelect.vue'
import InputWithUnit from '@/components/InputWithUnit.vue'

const SchemaForm = defineComponent({
  components: {
    TimeInputWithUnitSelect,
    InputWithUnit,
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
          return <div>This is array</div>
        case 'ip_port':
          return <div>This is ip_port</div>
        default:
          break
      }
    }

    const getColFormItem = (property: Properties[string]) => (
      <el-col span={16}>
        <el-form-item label={property.label}>
          <p>{property.description}</p>
          {setControl(property)}
        </el-form-item>
      </el-col>
    )

    const renderLayout = (contents: JSX.Element[]) => (
      <el-form label-position="top">
        <el-row>{contents}</el-row>
      </el-form>
    )

    const getComponents = (properties: Properties) => {
      const elements: JSX.Element[] = []
      const setComponents = (properties: Properties) => {
        Object.keys(properties).forEach((key) => {
          const property = properties[key]
          if (property.properties) {
            setComponents(property.properties)
          } else {
            const elFormItem = getColFormItem(property)
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
    return () => renderSchemaForm(components.value)
  },
})

export default SchemaForm
