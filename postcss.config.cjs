const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "@fullhuman/postcss-purgecss": {
      content: [
        "./pages/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
      ],
      defaultExtractor: (/** @type {string} */ content) =>
        content.match(/[\w-/:]+(?<!:)/g) ?? [],
      safelist: ["html", "body"],
    },
  },
};

module.exports = config;
