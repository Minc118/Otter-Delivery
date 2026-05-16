import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import {
  stitchBorderRadius,
  stitchBoxShadow,
  stitchColors,
  stitchFontFamily,
  stitchFontSize,
  stitchSpacing,
} from "./src/styles/design-tokens.js";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: stitchColors,
      borderRadius: stitchBorderRadius,
      spacing: stitchSpacing,
      fontFamily: stitchFontFamily,
      fontSize: stitchFontSize,
      boxShadow: stitchBoxShadow,
    },
  },
  plugins: [forms, containerQueries],
};
