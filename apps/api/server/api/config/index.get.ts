export default defineEventHandler(() => {
  return {
    ok: true,
    data: {
      ...getPublicAppConfig(),
      overrides: getSanitizedAppConfigOverrides(),
    },
  }
})
