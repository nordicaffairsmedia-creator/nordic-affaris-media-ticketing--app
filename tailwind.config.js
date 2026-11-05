/** Design tokens copied from the "Nocturne Royale" design (Stitch export). */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
  "colors": {
    "on-secondary-fixed": "#241a00",
    "on-tertiary-fixed": "#00174b",
    "surface-container-high": "#1d2a3e",
    "surface-container": "#132033",
    "on-error-container": "#ffdad6",
    "error": "#ffb4ab",
    "on-primary-container": "#554300",
    "error-container": "#93000a",
    "primary-fixed": "#ffe088",
    "on-secondary-fixed-variant": "#584400",
    "primary-container": "#d4af37",
    "tertiary": "#bfcdff",
    "on-surface-variant": "#d0c5af",
    "surface": "#061426",
    "surface-container-lowest": "#020e21",
    "inverse-primary": "#735c00",
    "primary": "#f2ca50",
    "surface-container-highest": "#28354a",
    "surface-bright": "#2d3a4e",
    "on-error": "#690005",
    "on-secondary": "#3d2f00",
    "secondary": "#e7c35a",
    "outline": "#99907c",
    "on-primary-fixed": "#241a00",
    "on-background": "#d6e3fe",
    "secondary-fixed-dim": "#e7c35a",
    "tertiary-container": "#97b0ff",
    "on-surface": "#d6e3fe",
    "surface-variant": "#28354a",
    "on-secondary-container": "#fff3dc",
    "secondary-fixed": "#ffe08b",
    "surface-tint": "#e9c349",
    "surface-container-low": "#0e1c2f",
    "on-primary": "#3c2f00",
    "surface-dim": "#061426",
    "tertiary-fixed": "#dbe1ff",
    "background": "#061426",
    "inverse-on-surface": "#243145",
    "on-tertiary-container": "#003ca4",
    "on-tertiary": "#002a78",
    "inverse-surface": "#d6e3fe",
    "on-tertiary-fixed-variant": "#003ea8",
    "outline-variant": "#4d4635",
    "tertiary-fixed-dim": "#b4c5ff",
    "primary-fixed-dim": "#e9c349",
    "on-primary-fixed-variant": "#574500",
    "secondary-container": "#896c00"
  },
  "borderRadius": {
    "DEFAULT": "0.25rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "full": "9999px"
  },
  "spacing": {
    "margin-desktop": "3rem",
    "gutter": "1rem",
    "space-md": "1rem",
    "space-lg": "1.5rem",
    "margin-tablet": "2rem",
    "space-sm": "0.5rem",
    "space-xl": "2.5rem",
    "space-xs": "0.25rem",
    "margin": "1rem",
    "gutter-desktop": "2rem",
    "gutter-tablet": "1.5rem"
  },
  "fontFamily": {
    "headline-xl-mobile": [
      "Playfair Display"
    ],
    "body-sm": [
      "Plus Jakarta Sans"
    ],
    "label-sm": [
      "Plus Jakarta Sans"
    ],
    "headline-sm": [
      "Playfair Display"
    ],
    "headline-lg-mobile": [
      "Playfair Display"
    ],
    "headline-md": [
      "Playfair Display"
    ],
    "body-lg": [
      "Plus Jakarta Sans"
    ],
    "body-md": [
      "Plus Jakarta Sans"
    ],
    "headline-xl": [
      "Playfair Display"
    ],
    "label-lg": [
      "Plus Jakarta Sans"
    ],
    "headline-lg": [
      "Playfair Display"
    ],
    "label-md": [
      "Plus Jakarta Sans"
    ]
  },
  "fontSize": {
    "headline-xl-mobile": [
      "30px",
      {
        "lineHeight": "38px",
        "letterSpacing": "-0.01em",
        "fontWeight": "600"
      }
    ],
    "body-sm": [
      "12px",
      {
        "lineHeight": "18px",
        "fontWeight": "400"
      }
    ],
    "label-sm": [
      "10px",
      {
        "lineHeight": "14px",
        "letterSpacing": "0.08em",
        "fontWeight": "700"
      }
    ],
    "headline-sm": [
      "18px",
      {
        "lineHeight": "24px",
        "fontWeight": "500"
      }
    ],
    "headline-lg-mobile": [
      "24px",
      {
        "lineHeight": "32px",
        "fontWeight": "600"
      }
    ],
    "headline-md": [
      "22px",
      {
        "lineHeight": "28px",
        "fontWeight": "500"
      }
    ],
    "body-lg": [
      "16px",
      {
        "lineHeight": "26px",
        "fontWeight": "400"
      }
    ],
    "body-md": [
      "14px",
      {
        "lineHeight": "22px",
        "fontWeight": "400"
      }
    ],
    "headline-xl": [
      "40px",
      {
        "lineHeight": "48px",
        "letterSpacing": "-0.02em",
        "fontWeight": "600"
      }
    ],
    "label-lg": [
      "14px",
      {
        "lineHeight": "20px",
        "letterSpacing": "0.02em",
        "fontWeight": "600"
      }
    ],
    "headline-lg": [
      "32px",
      {
        "lineHeight": "40px",
        "letterSpacing": "-0.01em",
        "fontWeight": "600"
      }
    ],
    "label-md": [
      "12px",
      {
        "lineHeight": "16px",
        "letterSpacing": "0.05em",
        "fontWeight": "600"
      }
    ]
  }
} },
  plugins: [],
}
