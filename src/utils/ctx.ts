import { Bindings } from "types";



export interface ContentApiContext {
  pagesEndpointUrl: string;
  headers: Headers;
  authToken: string;
}

export function getContentApiContext(env: Bindings, programId: string, envId: string): ContentApiContext {
  const endpointPagesPath = '/adobe/experimental/aspm-expires-20251231/pages';
  let pagesEndpointUrl = null;
  const headers: Headers = new Headers();
  if (env.WORKER_ENV === 'local') {
    pagesEndpointUrl = `http://localhost:8787${endpointPagesPath}`;
    headers['X-CONTENT-API-PROGRAM-ID'] = programId;
    headers['X-CONTENT-API-ENV-ID'] = envId;
  } else {
    pagesEndpointUrl = `https://author-p${programId}-e${envId}.adobeaemcloud.com${endpointPagesPath}`;
  }
  console.log("Headers content:");
  for (const [key, value] of headers.entries()) {
    console.log(`${key}: ${value}`);
  }
  return {
    pagesEndpointUrl: pagesEndpointUrl,
    headers: headers,
    authToken: env.CONTENT_API_KEY,
  };
}
