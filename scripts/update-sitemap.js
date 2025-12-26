#!/usr/bin/env node
/**
 * Update sitemap.xml with current date
 * Run as part of build process to keep lastmod fresh
 */

const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

try {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  
  // Replace all lastmod dates with today
  sitemap = sitemap.replace(
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  );
  
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`✅ Updated sitemap.xml with lastmod: ${today}`);
} catch (error) {
  console.error('❌ Failed to update sitemap:', error.message);
  process.exit(1);
}
