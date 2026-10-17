// The whole site is prerendered to static files. Trailing slashes make every page an
// index.html, which GitHub Pages (and any static host) serves without rewrites.
export const prerender = true;
export const trailingSlash = 'always';
