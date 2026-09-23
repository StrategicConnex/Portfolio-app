import type { TranslationModule } from './index'

const es = {
  'recursos.label': 'Recursos',
  'recursos.title': 'Biblioteca',
  'recursos.highlight': 'IT/OT',

  'recursos.intro': 'Guías, plantillas y estándares listos para usar en tus proyectos industriales.',

  'recursos.group.guias': 'Guías técnicas',
  'recursos.group.templates': 'Plantillas y matrices',
  'recursos.group.estandares': 'Estándares resumidos',
  'recursos.group.project': 'Documentos del proyecto',

  'recursos.cat.all': 'Todos',
  'recursos.cat.vol1': 'Vol. I · IT',
  'recursos.cat.vol2': 'Vol. II · OT',
  'recursos.cat.vol3': 'Vol. III · Integración',
  'recursos.cat.vol4': 'Vol. IV · Ciberseguridad',
  'recursos.cat.vol5': 'Vol. V · Tendencias',
  'recursos.cat.standards': 'Estándares',
  'recursos.cat.project': 'Proyecto',

  'recursos.filter_label': 'Filtrar recursos por categoría',
  'recursos.panel_label': 'Recursos de categoría',
  'recursos.gallery_title': 'Archivos descargables',
  'recursos.download': 'Descargar',
  'recursos.empty': 'No hay recursos en esta categoría.',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'recursos.label': 'Resources',
  'recursos.title': 'IT/OT',
  'recursos.highlight': 'Library',

  'recursos.intro': 'Guides, templates and standards ready to use in your industrial projects.',

  'recursos.group.guias': 'Technical guides',
  'recursos.group.templates': 'Templates & matrices',
  'recursos.group.estandares': 'Standards summaries',
  'recursos.group.project': 'Project documents',

  'recursos.cat.all': 'All',
  'recursos.cat.vol1': 'Vol. I · IT',
  'recursos.cat.vol2': 'Vol. II · OT',
  'recursos.cat.vol3': 'Vol. III · Integration',
  'recursos.cat.vol4': 'Vol. IV · Cybersecurity',
  'recursos.cat.vol5': 'Vol. V · Trends',
  'recursos.cat.standards': 'Standards',
  'recursos.cat.project': 'Project',

  'recursos.filter_label': 'Filter resources by category',
  'recursos.panel_label': 'Category resources',
  'recursos.gallery_title': 'Downloadable files',
  'recursos.download': 'Download',
  'recursos.empty': 'No resources in this category.',
} satisfies TranslationModule['en']

export const recursos = { es, en }
