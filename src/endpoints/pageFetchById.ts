import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { PageSchema, ProblemDetailsSchema } from '../schemas';
import { getContentApiContext } from 'utils/ctx';
import { fetchPageContentByPageIdHtml, fetchPagesByUrlJson, handleErrors } from 'utils/contentapi-fetch';
import { Bindings } from 'types';

export class PageFetchById extends OpenAPIRoute {
  schema = {
    tags: ['Page'],
    summary: 'Get a Page by the XWalkPage ID',
    request: {
      params: z.object({
        xwalkPageId: Str({ description: 'XwalkPage identifier in the format of p<programId>--e<envId>--siteId. Example: p130360--e1272151--1534567d-9937-4e40-85ff-369a8ed45367' }),
        branch: Str({ description: 'branch name e.g. main' }),
        path: Str({ description: 'path to the page e.g. foobar/index.html' }).optional(),
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

  async handle(c: { env: Bindings, req: Request }) {
    //console.log('req', c.req);
    const data = await this.getValidatedData<typeof this.schema>();
    console.log('data', data);
    const { xwalkPageId } = data.params;
    
    // xwalkPageId example: p130360--e1272151--1534567d-9937-4e40-85ff-369a8ed45367
    const parts = xwalkPageId.split('--');
    if (parts.length !== 3) {
      // Consider returning a more specific error response, e.g., 400 Bad Request
      return new Response(
        JSON.stringify({
          title: 'Invalid XWalkPage ID format',
          status: 400,
          detail: `Expected format p<programId>--e<envId>--siteId, but received ${xwalkPageId}.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    

    const [programIdStr, envIdStr, _] = parts;

    if (!programIdStr.startsWith('p') || !envIdStr.startsWith('e')) {
        return new Response(
          JSON.stringify({
            title: 'Invalid XWalkPage ID format',
            status: 400,
            detail: `Program ID should start with 'p' and Environment ID with 'e'. Received: ${xwalkPageId}`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

    const programId = programIdStr.substring(1);
    const envId = envIdStr.substring(1);

    console.log('Parsed programId:', programId);
    console.log('Parsed envId:', envId);

    // TODO: The /pages/byUrl endpoint sits in a bucket, it would be better, if the Content API was globally reachable e.g. via https://api.adobeaemcloud.com/adobe/pages/byUrl
    const ctx = getContentApiContext(c.env, programId, envId);
    try {
      let url = c.req.url;

      if (url.endsWith('/')) {
        url = url + 'index';
      }
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

      return new Response(pageContentHtml, { headers: { 'Content-Type': 'text/html' } });

    } catch (error) {
      return handleErrors(error);
    }
  }
}
