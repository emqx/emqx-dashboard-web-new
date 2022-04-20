import { transformUnitArrayToStr, transformStrToUnitArray } from '@/common/utils'
import { Listener } from '@/types/listener'
import { cloneDeep, omit } from 'lodash'
import { ListenerType, ListenerTypeForGateway } from '@/types/enum'

export default (): {
  completeGatewayListenerTypeList: ListenerTypeForGateway[]
  listenerTypeList: ListenerType[]
  ID_SEPARATOR: string
  gatewayTypesWhichCanEnableProxyProtocol: Array<ListenerTypeForGateway | ListenerType>
  gatewayTypesWhichHasTCPConfig: Array<ListenerTypeForGateway | ListenerType>
  gatewayTypesWhichHasUDPConfig: Array<ListenerTypeForGateway | ListenerType>
  gatewayTypesWhichHasSSLConfig: Array<ListenerTypeForGateway | ListenerType>
  createRawListener: () => Listener
  getListenerNameNTypeById: (id: string) => {
    type: string
    name: string
  }
  createListenerId: (listener: Listener, gatewayName?: string | undefined) => string
  hasTCPConfig: (type: ListenerType | ListenerTypeForGateway) => boolean
  hasUDPConfig: (type: ListenerType | ListenerTypeForGateway) => boolean
  hasSSLConfig: (type: ListenerType | ListenerTypeForGateway) => boolean
  hasWSConfig: (type: ListenerType) => boolean
  normalizeStructure: (record: Listener) => any
  deNormalizeStructure: (record: Listener, gatewayName: string) => Listener
  /**
   * independent is diff from below gateway
   */
  handleListenerDataWhenItIsIndependent: (listener: Listener) => Listener
} => {
  const ID_SEPARATOR = ':'

  const completeGatewayListenerTypeList = [
    ListenerTypeForGateway.TCP,
    ListenerTypeForGateway.SSL,
    ListenerTypeForGateway.UDP,
    ListenerTypeForGateway.DTLS,
  ]

  const listenerTypeList = [
    ListenerType.QUIC,
    ListenerType.TCP,
    ListenerType.SSL,
    ListenerType.WS,
    ListenerType.WSS,
  ]

  /* 
    |                | SSL  | DTLS | UDP  | TCP  |
    | -------------- | ---- | ---- | ---- | ---- |
    | SSL            | ✓    |      |      |      |
    | TCP            | ✓    |      |      | ✓    |
    | UDP            |      | ✓    | ✓    |      |
    | DTLS(like SSL) |      | ✓    |      |      |
    | Proxy Protocol | ✓    |      |      | ✓    |

    |                | QUIC | TCP  | SSL  | WS   | WSS  |
    | -------------- | ---- | ---- | ---- | ---- | ---- |
    | TCP            |      | ✓    | ✓    | ✓    | ✓    |
    | SSL            |      |      | ✓    |      | ✓    |
    | UDP            | ✓    |      |      |      |      |
    | WS             |      |      |      | ✓    | ✓    |
    | Proxy Protocol |      | ✓    | ✓    | ✓    | ✓    |
  */
  const gatewayTypesWhichCanEnableProxyProtocol = [
    ListenerTypeForGateway.SSL,
    ListenerTypeForGateway.TCP,
    ListenerType.TCP,
    ListenerType.SSL,
    ListenerType.WS,
    ListenerType.WSS,
  ]

  const gatewayTypesWhichHasTCPConfig = [
    ListenerTypeForGateway.SSL,
    ListenerTypeForGateway.TCP,
    ListenerType.TCP,
    ListenerType.SSL,
    ListenerType.WS,
    ListenerType.WSS,
  ]

  const gatewayTypesWhichHasUDPConfig = [
    ListenerTypeForGateway.DTLS,
    ListenerTypeForGateway.UDP,
    ListenerType.QUIC,
  ]

  const gatewayTypesWhichHasSSLConfig = [
    ListenerTypeForGateway.SSL,
    ListenerType.SSL,
    ListenerType.WSS,
  ]

  const gatewayTypesWhichHasWSConfig = [ListenerType.WS, ListenerType.WSS]

  const createRawListener = (): Listener => ({
    type: ListenerType.TCP,
    id: '',
    name: '',
    bind: '',
    acceptors: 16,
    max_connections: 102400,
    max_conn_rate: 1000,
    mountpoint: '',
    proxy_protocol: false,
    proxy_protocol_timeout: [15, 's'],
    tcp: {
      nodelay: false,
      reuseaddr: true,
      send_timeout_close: true,
      active_n: 100,
      buffer: [4, 'KB'],
      send_timeout: [15, 's'],
    },
    udp: {
      active_n: 100,
      buffer: [4, 'KB'],
      recbuf: [2, 'KB'],
      sndbuf: [2, 'KB'],
      reuseaddr: true,
    },
    /**
     * DTLS version information of the listener whose type is DTLS
     */
    dtls: {
      versions: ['dtls1.2', 'dtlsv1'],
    },
    /**
     * SSL version information
     */
    ssl: {
      versions: ['tlsv1.3', 'tlsv1.2', 'tlsv1.1', 'tlsv1'],
    },
    /**
     * the type is DTLS & SSL don't know any information other than the certificate
     */
    xtls: {
      verify: 'verify_none',
      fail_if_no_peer_cert: false,
      depth: 10,
      password: '',
    },
    /**
     * certificate placeholder (seems useless,TODO: delete it)
     */
    certSpecial: {
      cacertfile: 'Begins with ----BEGIN CERTIFICATE----',
      certfile: 'Begins with ----BEGIN CERTIFICATE----',
      keyfile: 'Begins with ----BEGIN PRIVATE KEY----',
    },
    websocket: {
      mqtt_path: '',
    },
  })

  const listenerIdReg = new RegExp(`^(?<type>${listenerTypeList.join('|')}):(?<name>.+)`)
  const getListenerNameNTypeById = (id: string): { type: string; name: string } => {
    const matchResult = id.match(listenerIdReg)
    if (!matchResult) {
      return {
        type: '' as ListenerType,
        name: '',
      }
    }
    const { name, type } = matchResult.groups || {}
    return { name, type }
  }

  /**
   * independent is diff from below gateway
   */
  const handleListenerDataWhenItIsIndependent = (listener: Listener): Listener => {
    let ret = listener
    if ('max_conn_rate' in ret) {
      ret = omit(ret, 'max_conn_rate')
    }
    if (/^\d+$/.test(ret.bind)) {
      ret.bind = parseInt(ret.bind)
    }
    return ret
  }

  const hasTCPConfig = (type: ListenerType | ListenerTypeForGateway) =>
    gatewayTypesWhichHasTCPConfig.includes(type)
  const hasUDPConfig = (type: ListenerType | ListenerTypeForGateway) =>
    gatewayTypesWhichHasUDPConfig.includes(type)
  const hasSSLConfig = (type: ListenerType | ListenerTypeForGateway) =>
    gatewayTypesWhichHasSSLConfig.includes(type)
  const hasWSConfig = (type: ListenerType) => gatewayTypesWhichHasWSConfig.includes(type)

  const normalizeStructure = (record: Listener) => {
    const { type = ListenerType.TCP } = record
    const result: Listener = {}

    Object.keys(record).forEach((v) => {
      switch (v) {
        case 'proxy_protocol_timeout':
        case 'proxy_protocol':
          if (type === ListenerType.TCP || type === ListenerType.SSL) {
            result[v] = record[v]
          }
          break
        case 'acceptors':
          if (type !== ListenerTypeForGateway.UDP) {
            result[v] = record[v]
          }
          break

        default:
          if (typeof record[v] !== 'object' || record[v] === null) {
            result[v] = record[v]
          }
      }
    })

    if (record[type]) {
      result[type] = { ...record[type] }
    }
    if (hasTCPConfig(type) && record.tcp) {
      result.tcp = { ...record.tcp }
    }
    if (hasUDPConfig(type) && record.udp) {
      result.udp = { ...record.udp }
    }
    if (hasSSLConfig(type)) {
      if (type === ListenerTypeForGateway.DTLS) {
        Object.assign(result[ListenerTypeForGateway.DTLS], record.xtls)
      } else {
        !result[ListenerTypeForGateway.SSL] ? (result[ListenerTypeForGateway.SSL] = {}) : void 0
        Object.assign(result[ListenerTypeForGateway.SSL], record.xtls)
      }
    }
    if (hasWSConfig(type)) {
      result.websocket = { ...record.websocket }
    }
    return transformUnitArrayToStr(result)
  }

  const createListenerId = (listener: Listener, gatewayName?: string): string => {
    const { type, name } = listener
    return `${gatewayName ? gatewayName + ID_SEPARATOR : ''}${type}${ID_SEPARATOR}${name}`
  }

  const deNormalizeStructure = (record: Listener, gatewayName: string) => {
    const { type = ListenerType.TCP } = record

    const expandKey = [
      'tcp.buffer',
      'tcp.send_timeout',
      'proxy_protocol_timeout',
      'udp.buffer',
      'udp.recbuf',
      'udp.sndbuf',
    ]

    const result: Listener = transformStrToUnitArray(cloneDeep(record), expandKey)
    const defaultListener = createRawListener()
    if (type === ListenerType.SSL || type === ListenerTypeForGateway.DTLS) {
      result.xtls = { ...record[type] }
      result.certSpecial = { ...defaultListener.certSpecial }
      Object.keys(result.xtls).forEach((v) => {
        if (v in defaultListener.xtls) {
          delete result[type][v]
        } else {
          delete result.xtls[v]
        }
      })
    }

    if (!record.name) {
      result.name = record?.id?.split(ID_SEPARATOR)[2] || ''
    }
    if (!record.id) {
      result.id = [gatewayName, record.type, record.name].join(ID_SEPARATOR)
    }

    return result
  }

  return {
    completeGatewayListenerTypeList,
    listenerTypeList,
    ID_SEPARATOR,
    gatewayTypesWhichCanEnableProxyProtocol,
    gatewayTypesWhichHasTCPConfig,
    gatewayTypesWhichHasUDPConfig,
    gatewayTypesWhichHasSSLConfig,
    createRawListener,
    getListenerNameNTypeById,
    createListenerId,
    hasTCPConfig,
    hasUDPConfig,
    hasSSLConfig,
    hasWSConfig,
    normalizeStructure,
    deNormalizeStructure,
    handleListenerDataWhenItIsIndependent,
  }
}
