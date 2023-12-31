import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
} satisfies Config;
