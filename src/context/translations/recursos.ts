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
  'recursos.search_label': 'Buscar en la biblioteca',
  'recursos.search_placeholder': 'Buscar: IEC 62443, Modbus, firewall…',
  'recursos.panel_label': 'Recursos de categoría',
  'recursos.gallery_title': 'Archivos descargables',
  'recursos.download': 'Descargar',
  'recursos.describe': 'Describir con IA',
  'recursos.empty': 'No hay recursos en esta categoría.',

  'recursos.explore': 'Explorar la biblioteca',
  'recursos.hub_label': 'Biblioteca',
  'recursos.hub_title': 'Biblioteca IT/OT',
  'recursos.hub_highlight': 'Libro',
  'recursos.hub_intro': 'Cinco volúmenes de guías, plantillas y estándares listos para descargar. Cada volumen reúne la documentación operativa de una etapa del proyecto IT/OT.',
  'recursos.page.docs': 'documentos',
  'recursos.page.files': 'Documentos de este volumen',
  'recursos.page.chapters': 'Índice de contenido',
  'recursos.page.back_library': 'Volver a la biblioteca',
  'recursos.page.other_volumes': 'Otros volúmenes',
  'recursos.page.guides': 'Guías',
  'recursos.page.templates': 'Plantillas y matrices',
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
  'recursos.search_label': 'Search the library',
  'recursos.search_placeholder': 'Search: IEC 62443, Modbus, firewall…',
  'recursos.panel_label': 'Category resources',
  'recursos.gallery_title': 'Downloadable files',
  'recursos.download': 'Download',
  'recursos.describe': 'Describe with AI',
  'recursos.empty': 'No resources in this category.',

  'recursos.explore': 'Explore the library',
  'recursos.hub_label': 'Library',
  'recursos.hub_title': 'IT/OT Library',
  'recursos.hub_highlight': 'Book',
  'recursos.hub_intro': 'Five volumes of guides, templates and standards ready to download. Each volume gathers the operational documentation of one stage of the IT/OT project.',
  'recursos.page.docs': 'documents',
  'recursos.page.files': 'Documents in this volume',
  'recursos.page.chapters': 'Table of contents',
  'recursos.page.back_library': 'Back to the library',
  'recursos.page.other_volumes': 'Other volumes',
  'recursos.page.guides': 'Guides',
  'recursos.page.templates': 'Templates & matrices',
} satisfies TranslationModule['en']

export const recursos = { es, en }
