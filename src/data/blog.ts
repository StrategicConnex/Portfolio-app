export interface BlogPost {
  id: string;
  titleKey: string;
  excerptKey: string;
  date: string;
  readTimeKey: string;
  category: string;
  content?: string;
  tagsKeys: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'iec-62443-vaca-muerta',
    titleKey: 'blog.post1.title',
    excerptKey: 'blog.post1.excerpt',
    date: '15 Abr 2024',
    readTimeKey: 'blog.post1.readTime',
    category: 'IEC 62443',
    tagsKeys: ['blog.post1.tag']
  },
  {
    id: 'siem-it-ot-convergencia',
    titleKey: 'blog.post2.title',
    excerptKey: 'blog.post2.excerpt',
    date: '02 Mar 2024',
    readTimeKey: 'blog.post2.readTime',
    category: 'OT Security',
    tagsKeys: ['blog.post2.tag']
  },
  {
    id: 'nist-csf-critical-infrastructure',
    titleKey: 'blog.post3.title',
    excerptKey: 'blog.post3.excerpt',
    date: '20 Feb 2024',
    readTimeKey: 'blog.post3.readTime',
    category: 'NIST',
    tagsKeys: ['blog.post3.tag']
  }
];
