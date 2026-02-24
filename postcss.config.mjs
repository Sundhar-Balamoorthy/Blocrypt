/** @type {import('postcss-load-config').Config} */
// Use the dedicated PostCSS plugin for Tailwind v4+.
// If you hit native binding errors, remove `node_modules` and lockfile
// then reinstall (see README or the steps in the workspace).
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

export default config
