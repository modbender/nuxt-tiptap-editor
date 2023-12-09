function renderStubMessage(name: string) {
  throw createError({
    fatal: true,
    statusCode: 500,
    statusMessage: `${name} is provided by extension. Check your console to install it`,
  });
}

export const lowlight = {
  setup: () => renderStubMessage("lowlight"),
};

export const CodeBlockLowlight = {
  setup: () => renderStubMessage("CodeBlockLowlight"),
};
