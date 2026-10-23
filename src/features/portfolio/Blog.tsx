'use client'

import { motion } from 'framer-motion'
import SectionHeader from '@/components/ui/SectionHeader'
import { BLOG_POSTS, BlogPost } from '@/data/blog'
import { useLanguage } from '@/context/LanguageContext'
import { Tag } from 'lucide-react'

const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => {
  const { t } = useLanguage()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="glass scanline-container rounded-2xl p-6 h-full flex flex-col border border-[var(--surface-border)] hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(30,144,255,0.1)] group-hover:-translate-y-1">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 uppercase tracking-wider">
            {post.category}
          </span>
          <div className="flex-1 h-[1px] bg-[var(--surface-fill)]" />
          <span className="text-[10px] font-mono tracking-wider text-amber-500/80">{t('blog.status.draft')}</span>
        </div>

        <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors leading-tight" style={{ color: 'var(--text-primary)' }}>
          {t(post.titleKey)}
        </h3>

        <p className="text-sm text-[var(--text-muted)] mb-6 flex-1 line-clamp-3 leading-relaxed">
          {t(post.excerptKey)}
        </p>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-[var(--surface-border)]">
          <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
            <Tag size={12} className="text-blue-500/60" />
            <span className="text-[11px] font-medium">{t(post.tagsKeys[0])}</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">
            {t('blog.status.pending')}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Blog() {
  const { t } = useLanguage()

  return (
    <section id="blog" className="py-24 sm:py-32" style={{ background: 'var(--bg2)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <SectionHeader 
              label={t('blog.label')} 
              title={t('blog.title')} 
              highlight={t('blog.highlight')} 
              center={false}
            />
            <p className="text-[var(--text-muted)] mt-4 text-sm sm:text-base leading-relaxed">
              {t('blog.description')}
            </p>
          </div>
          <span
            className="px-6 py-3 rounded-xl bg-[var(--surface-fill)] border border-[var(--border-interactive)] text-[11px] font-bold uppercase tracking-[2px] flex items-center gap-3 w-fit"
            style={{ color: 'var(--text-subtle)' }}
          >
            {t('blog.status.pending')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
