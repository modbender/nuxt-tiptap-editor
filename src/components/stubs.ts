function renderStubMessage(name: string, extName: string, extDoc?: string) {
  throw createError({
    fatal: true,
    statusCode: 500,
    statusMessage: `
    ${name} is provided by external extension ${extName}. 
    Find instructions to install in ${extDoc}.
    `,
  })
}

export const Placeholder = {
  setup: () =>
    renderStubMessage(
      'Placeholder',
      '@tiptap/extension-placeholder',
      'https://tiptap.dev/api/extensions/placeholder',
    ),
}
