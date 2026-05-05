export type NodeDefinition = {
  label: string
  pos: [number, number, number]
  color: string
  particleCount: number
  subs: string[]
  related: string[]
}

export const nodes: NodeDefinition[] = [
  {
    label: 'Convergencia IT/OT',
    pos: [0, 0, 0],
    color: '#C5A46D',
    particleCount: 300,
    subs: ['Modelo Purdue', 'Visión integrada'],
    related: ['SCADA', 'Firewalls Industriales', 'SIEM', 'Virtualización'],
  },
  {
    label: 'SCADA',
    pos: [-2, -2.6, 0],
    color: '#1E90FF',
    particleCount: 170,
    subs: ['Control de planta', 'DCS/PLC'],
    related: ['Modbus', 'DNP3', 'Firewalls Industriales', 'Virtualización'],
  },
  {
    label: 'Modbus',
    pos: [-4.5, -4.1, 0],
    color: '#F97316',
    particleCount: 120,
    subs: ['Protocolo OT legacy'],
    related: ['SCADA', 'DNP3'],
  },
  {
    label: 'DNP3',
    pos: [-1.5, -4.1, 0],
    color: '#F97316',
    particleCount: 120,
    subs: ['Telemetría segura'],
    related: ['SCADA'],
  },
  {
    label: 'Firewalls Industriales',
    pos: [2, -2.6, 0],
    color: '#06B6D4',
    particleCount: 140,
    subs: ['Segmentación OT/IT', 'Inspección profunda'],
    related: ['SCADA', 'Virtualización', 'SIEM'],
  },
  {
    label: 'Virtualización',
    pos: [-2.8, 0, 0],
    color: '#8B5CF6',
    particleCount: 150,
    subs: ['VMware', 'Hypervisores'],
    related: ['Firewalls Industriales', 'Redes Cisco', 'SIEM'],
  },
  {
    label: 'Redes Cisco',
    pos: [2.8, 0, 0],
    color: '#8B5CF6',
    particleCount: 150,
    subs: ['Switches L2/L3', 'SD-WAN'],
    related: ['Virtualización', 'NIST', 'SIEM'],
  },
  {
    label: 'SIEM',
    pos: [-2, 2.6, 0],
    color: '#EF4444',
    particleCount: 170,
    subs: ['Detección y corrección', 'Correlación de eventos'],
    related: ['NIST', 'ISO 27001', 'Firewalls Industriales'],
  },
  {
    label: 'NIST',
    pos: [0, 4.1, 0],
    color: '#10B981',
    particleCount: 140,
    subs: ['CSF', 'Riesgo y gobernanza'],
    related: ['SIEM', 'ISO 27001'],
  },
  {
    label: 'ISO 27001',
    pos: [2, 2.6, 0],
    color: '#10B981',
    particleCount: 140,
    subs: ['Gestión de seguridad', 'Cumplimiento'],
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
