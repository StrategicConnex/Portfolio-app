export type NodeDefinition = {
  /** Graph identity — used for edges/related matching. Do not translate. */
  label: string
  /** Translation key for the visible label. */
  labelKey: string
  pos: [number, number, number]
  color: string
  particleCount: number
  /** Graph-level sub-labels — kept for hover logic; visible text comes from subKeys. */
  subs: string[]
  /** Translation keys for the visible sub-labels. */
  subKeys: string[]
  related: string[]
}

export const nodes: NodeDefinition[] = [
  {
    label: 'Convergencia IT/OT',
    labelKey: 'arch.mindmap.node.convergence',
    pos: [0, 0, 0],
    color: '#C5A46D',
    particleCount: 300,
    subs: ['Modelo Purdue', 'Visión integrada'],
    subKeys: ['arch.mindmap.convergence.sub1', 'arch.mindmap.convergence.sub2'],
    related: ['SCADA', 'Firewalls Industriales', 'SIEM', 'Virtualización'],
  },
  {
    label: 'SCADA',
    labelKey: 'arch.mindmap.node.scada',
    pos: [-2, -2.6, 0],
    color: '#1E90FF',
    particleCount: 170,
    subs: ['Control de planta', 'DCS/PLC'],
    subKeys: ['arch.mindmap.scada.sub1', 'arch.mindmap.scada.sub2'],
    related: ['Modbus', 'DNP3', 'Firewalls Industriales', 'Virtualización'],
  },
  {
    label: 'Modbus',
    labelKey: 'arch.mindmap.node.modbus',
    pos: [-4.5, -4.1, 0],
    color: '#F97316',
    particleCount: 120,
    subs: ['Protocolo OT legacy'],
    subKeys: ['arch.mindmap.modbus.sub1'],
    related: ['SCADA', 'DNP3'],
  },
  {
    label: 'DNP3',
    labelKey: 'arch.mindmap.node.dnp3',
    pos: [-1.5, -4.1, 0],
    color: '#F97316',
    particleCount: 120,
    subs: ['Telemetría segura'],
    subKeys: ['arch.mindmap.dnp3.sub1'],
    related: ['SCADA'],
  },
  {
    label: 'Firewalls Industriales',
    labelKey: 'arch.mindmap.node.industrial_fw',
    pos: [2, -2.6, 0],
    color: '#06B6D4',
    particleCount: 140,
    subs: ['Segmentación OT/IT', 'Inspección profunda'],
    subKeys: ['arch.mindmap.industrial_fw.sub1', 'arch.mindmap.industrial_fw.sub2'],
    related: ['SCADA', 'Virtualización', 'SIEM'],
  },
  {
    label: 'Virtualización',
    labelKey: 'arch.mindmap.node.virtualization',
    pos: [-2.8, 0, 0],
    color: '#8B5CF6',
    particleCount: 150,
    subs: ['VMware', 'Hypervisores'],
    subKeys: ['arch.mindmap.virtualization.sub1', 'arch.mindmap.virtualization.sub2'],
    related: ['Firewalls Industriales', 'Redes Cisco', 'SIEM'],
  },
  {
    label: 'Redes Cisco',
    labelKey: 'arch.mindmap.node.cisco',
    pos: [2.8, 0, 0],
    color: '#8B5CF6',
    particleCount: 150,
    subs: ['Switches L2/L3', 'SD-WAN'],
    subKeys: ['arch.mindmap.cisco.sub1', 'arch.mindmap.cisco.sub2'],
    related: ['Virtualización', 'NIST', 'SIEM'],
  },
  {
    label: 'SIEM',
    labelKey: 'arch.mindmap.node.siem',
    pos: [-2, 2.6, 0],
    color: '#EF4444',
    particleCount: 170,
    subs: ['Detección y corrección', 'Correlación de eventos'],
    subKeys: ['arch.mindmap.siem.sub1', 'arch.mindmap.siem.sub2'],
    related: ['NIST', 'ISO 27001', 'Firewalls Industriales'],
  },
  {
    label: 'NIST',
    labelKey: 'arch.mindmap.node.nist',
    pos: [0, 4.1, 0],
    color: '#10B981',
    particleCount: 140,
    subs: ['CSF', 'Riesgo y gobernanza'],
    subKeys: ['arch.mindmap.nist.sub1', 'arch.mindmap.nist.sub2'],
    related: ['SIEM', 'ISO 27001'],
  },
  {
    label: 'ISO 27001',
    labelKey: 'arch.mindmap.node.iso',
    pos: [2, 2.6, 0],
    color: '#10B981',
    particleCount: 140,
    subs: ['Gestión de seguridad', 'Cumplimiento'],
    subKeys: ['arch.mindmap.iso.sub1', 'arch.mindmap.iso.sub2'],
    related: ['SIEM', 'NIST'],
  },
]

export const edges = [
  ['Convergencia IT/OT', 'SCADA'],
  ['SCADA', 'Modbus'],
  ['SCADA', 'DNP3'],
  ['SCADA', 'Firewalls Industriales'],
  ['Firewalls Industriales', 'Virtualización'],
  ['Firewalls Industriales', 'SIEM'],
  ['Virtualización', 'Redes Cisco'],
  ['Virtualización', 'SIEM'],
  ['Redes Cisco', 'NIST'],
  ['SIEM', 'NIST'],
  ['SIEM', 'ISO 27001'],
  ['NIST', 'ISO 27001'],
]
