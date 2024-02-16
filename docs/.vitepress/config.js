import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Tiptap Editor",
  description:
    "Essentials to Quickly Integrate TipTap Editor into your Nuxt App",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'local'
    },
    
    nav: [
      { text: "Docs", link: "/docs/" },
      { text: "Examples", link: "/examples/" },
    ],

    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Intro", link: "/docs/" },
          { text: "Setup", link: "/docs/setup/" },
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
