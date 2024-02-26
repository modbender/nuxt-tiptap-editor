import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Tiptap Editor",
  description:
    "Essentials to Quickly Integrate TipTap Editor into your Nuxt App",

  cleanUrls: true,
  lastUpdated: true,

  head: [
    [
      "script",
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-Z1D6HCTHXL",
      },
    ],
    [
      "script",
      {},
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-Z1D6HCTHXL');",
    ],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: "local",
    },

    nav: [
      { text: "Docs", link: "/docs/what-is" },
      { text: "Examples", link: "/examples/basic" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "What is Nuxt Tiptap Editor", link: "/docs/what-is" },
          { text: "Quick Setup", link: "/docs/quick-setup" },
          { text: "Extensions", link: "/docs/extensions" },
          { text: "Development", link: "/docs/development" },
          { text: "Contribution", link: "/docs/contribution" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Basic", link: "/examples/basic" },
          { text: "Pre-fill Content", link: "/examples/prefill-content" },
          { text: "Code Block Lowlight", link: "/examples/lowlight" },
          { text: "Placeholder", link: "/examples/placeholder" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/modbender/nuxt-tiptap-editor",
      },
    ],
  },
});
