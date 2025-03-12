/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://dokasah.web.id',
  generateRobotsTxt: true,
  exclude: ['/dashboard', '/login', '/filemanager'], // Halaman yang tidak perlu diindeks
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/dashboard', '/login', '/filemanager'] }
    ],
  },
};
