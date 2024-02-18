import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Tiptap Editor",
  description:
    "Essentials to Quickly Integrate TipTap Editor into your Nuxt App",

  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: "local",
    },

    nav: [
      { text: "Docs", link: "/docs/what-is" },
      { text: "Examples", link: "/examples/" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "What is Nuxt Tiptap Editor", link: "/docs/what-is" },
          { text: "Quick Setup", link: "/docs/quick-setup" },
          { text: "Extensions", link: "/docs/extensions" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Basic", link: "/examples/basic" },
          { text: "Code Block Lowlight", link: "/examples/lowlight" },
          { text: "Placeholder", link: "/examples/placeholder" },
          { text: "Pre-filled Content", link: "/examples/prefilled-content" },
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
