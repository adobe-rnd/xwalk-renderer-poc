import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { PageSchema, ProblemDetailsSchema } from '../schemas';
import { getContentApiContext } from 'utils/ctx';
import { fetchPageContentByPageIdHtml, fetchPagesByUrlJson, handleErrors } from 'utils/contentapi-fetch';
import { Bindings } from 'types';
import { Context } from 'hono';

export class PageFetchById extends OpenAPIRoute {
  schema = {
    tags: ['Page'],
    summary: 'Get a Page by the XWalkPage ID',
    request: {
      params: z.object({
        xwalkPageId: Str({ description: 'XwalkPage identifier in the format of programId:envId:siteId. Example: 130360:1272151:1534567d-9937-4e40-85ff-369a8ed45367' }),
        branch: Str({ description: 'branch name e.g. main' }),
        path: Str({ description: 'path to the page e.g. foobar/index.html' }),
      }),
    },
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: PageSchema,
          },
        },
      },
      '404': {
        description: 'Page not found',
        content: { 'application/json': { schema: ProblemDetailsSchema } },
      },
      "502": {
        description: "Bad Gateway - There was an issue with the AEM service",
        content: { "application/json": { schema: ProblemDetailsSchema } },
      }
    },
  };

  async handle(c: Context<{ Bindings: Bindings }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    console.log('data', data);
    const { xwalkPageId } = data.params;
    
    // xwalkPageId example: 130360:1272151:1534567d-9937-4e40-85ff-369a8ed45367
    const [programId, envId, _] = xwalkPageId.split(':');
    console.log('programId', programId);
    console.log('envId', envId);

    // TODO: The /pages/byUrl endpoint sits in a bucket, it would be better, if the Content API was globally reachable e.g. via https://api.adobeaemcloud.com/adobe/pages/byUrl 
    const ctx = getContentApiContext(c.env.ENVIRONMENT, c.env, programId, envId);
    try {
      const url = c.req.url;
      
      const page = await fetchPagesByUrlJson(ctx, url);
      if (!page) {
        return new Response(
          JSON.stringify({
            title: 'Not Found',
            status: 404,
            detail: `Page with XWalkPage ID ${xwalkPageId} not found.`,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const pageContentHtml = await fetchPageContentByPageIdHtml(ctx, page.id);
      console.log('pageContentHtml', pageContentHtml);

      return pageContentHtml;

    } catch (error) {
      return handleErrors(error);
    }
  }
  
}

// Dummy function to generate HTML response
async function generateHtmlResponse(page: any): Promise<Response> {
  const pageContent = JSON.stringify(page, null, 2); // Pretty print the JSON
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Page Content</title>
</head>
<body>
  <h1>Page Data</h1>
  <pre><code>${pageContent}</code></pre>
</body>
</html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

