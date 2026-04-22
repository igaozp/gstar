export default defineEventHandler(() => {
  return {
    ok: true,
    data: {
      name: 'gstar API',
      version: '0.1.0',
      docs: {
        readme: '/README.md',
      },
      endpoints: [
        { method: 'GET', path: '/api/health', description: 'Service health and sync progress' },
        { method: 'GET', path: '/api/config', description: 'Current runtime config and persisted overrides' },
        { method: 'PUT', path: '/api/config', description: 'Update persisted runtime config' },
        { method: 'GET', path: '/api/stars', description: 'List starred repositories' },
        { method: 'GET', path: '/api/stars/:id', description: 'Get repository details' },
        { method: 'POST', path: '/api/stars/sync', description: 'Trigger full or incremental sync' },
        { method: 'POST', path: '/api/search', description: 'Search repositories by keyword, vector, or hybrid strategy' },
      ],
    },
  }
})
