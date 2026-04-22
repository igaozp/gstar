export default defineEventHandler(() => {
  return {
    ok: true,
    data: {
      name: 'gstar',
      service: 'backend',
      version: '0.1.0',
      message: 'Backend is running. Use /api for REST endpoints.',
      entrypoints: {
        api: '/api',
        health: '/api/health',
        config: '/api/config',
        stars: '/api/stars',
      },
    },
  }
})
