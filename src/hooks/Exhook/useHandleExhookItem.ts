import { ElMessage, ElMessageBox } from 'element-plus'
import { updateExhook, deleteExhook as requestDeleteExhook, moveExhook } from '@/api/exhook'
import { Exhook, ExhookFormForCreate } from '@/types/systemModule'
import { useI18n } from 'vue-i18n'
import { ExhookPosition } from '@/types/enum'

export default () => {
  const { t } = useI18n()

  const keysForUpdateExhook: Array<keyof ExhookFormForCreate> = [
    'auto_reconnect',
    'enable',
    'failed_action',
    'name',
    'pool_size',
    'request_timeout',
    'ssl',
    'url',
  ]

  const deleteExhook = async (name: string) => {
    try {
      await ElMessageBox.confirm(t('Base.confirmDelete'))
      await requestDeleteExhook(name)
      ElMessage.success(t('Base.deleteSuccess'))
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      return Promise.reject()
    }
  }

  const getExhookDataNecessaryDataForUpdate = (exhookData: Exhook): ExhookFormForCreate => {
    return keysForUpdateExhook.reduce((obj, currentKey) => {
      return Object.assign(obj, { [currentKey]: exhookData[currentKey] })
    }, {}) as ExhookFormForCreate
  }

  const updateExhookEnable = async (exhookData: Exhook, enable: boolean) => {
    try {
      const data = getExhookDataNecessaryDataForUpdate(exhookData)
      data.enable = enable
      await updateExhook(data)
      ElMessage.success(t(`Base.${enable ? 'enableSuccess' : 'disabledSuccess'}`))
      return Promise.resolve()
    } catch (error) {
      console.error(error)
      return Promise.reject()
    }
  }

  const moveExhookToTop = (exhookItem: Exhook) => {
    return moveExhook(exhookItem.name, { position: ExhookPosition.Top })
  }

  const moveExhookToBottom = (exhookItem: Exhook) => {
    return moveExhook(exhookItem.name, { position: ExhookPosition.Bottom })
  }

  const moveExhookBeforeAnotherExhook = (exhookItem: Exhook, anotherExhook: Exhook) => {
    return moveExhook(exhookItem.name, {
      position: ExhookPosition.Before,
      related: anotherExhook.name,
    })
  }

  const moveExhookAfterAnotherExhook = (exhookItem: Exhook, anotherExhook: Exhook) => {
    return moveExhook(exhookItem.name, {
      position: ExhookPosition.After,
      related: anotherExhook.name,
    })
  }

  return {
    deleteExhook,
    updateExhookEnable,
    moveExhookToTop,
    moveExhookToBottom,
    moveExhookBeforeAnotherExhook,
    moveExhookAfterAnotherExhook,
  }
}
