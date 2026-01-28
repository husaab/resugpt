import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/editor/', '/cover-letter-editor/', '/resumes', '/cover-letters', '/settings', '/google-signin'],
    },
    sitemap: 'https://resugpt.com/sitemap.xml',
  }
}
