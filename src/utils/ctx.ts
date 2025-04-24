import { Bindings } from "types";



export interface ContentApiContext {
  pagesEndpointUrl: string;
  headers: Headers;
  authToken: string;
}

export function getContentApiContext(env: Bindings, programId: string, envId: string): ContentApiContext {
  let pagesEndpointUrl = null;
  const headers: Headers = new Headers();
  if (env.WORKER_ENV === 'local') {
    const endpointPagesPath = '/adobe/pages';
    pagesEndpointUrl = `http://localhost:8787${endpointPagesPath}`;
    headers['X-ADOBE-ROUTING'] = `program=${programId},environment=${envId}`;
  } else {
    const endpointPagesPath = '/adobe/experimental/aspm-expires-20251231/pages';
    pagesEndpointUrl = `https://author-p${programId}-e${envId}.adobeaemcloud.com${endpointPagesPath}`;
  }
  console.log("Headers content:");
  for (const [key, value] of headers.entries()) {
    console.log(`${key}: ${value}`);
  }
  return {
    pagesEndpointUrl: pagesEndpointUrl,
    headers: headers,
    authToken: env.AEM_AUTH_TOKEN,
  };
}
