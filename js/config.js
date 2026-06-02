const host = window.location.hostname;

const API_URLS = {
  productionFront: 'elda-gestion.pages.dev',
  productionApi: 'https://elda-gestion.onrender.com',

  stagingFront: 'elda-gestion-staging.pages.dev',
  stagingApi: 'https://elda-gestion-staging.onrender.com',

  localFronts: ['localhost', '127.0.0.1'],
  localApi: 'http://localhost:3000'
};

function resolveApiBaseUrl() {
  // 1) Local: localhost, 127.0.0.1 o si abrimos el HTML directamente como file://
  if (!host || window.location.protocol === 'file:' || API_URLS.localFronts.includes(host)) {
    return API_URLS.localApi;
  }

  // 2) Staging (exact match o subdominio que contenga "staging")
  if (host === API_URLS.stagingFront || host.includes('staging')) {
    return API_URLS.stagingApi;
  }

  // 3) Producción (default)
  return API_URLS.productionApi;
}

export const API_BASE_URL = resolveApiBaseUrl();