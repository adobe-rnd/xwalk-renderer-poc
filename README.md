# Crosswalk Renderer PoC

This project is a Proof of Concept (POC) demonstrating the implementation of an AEM Crosswalk Renderer as a [Cloudflare Worker](https://workers.cloudflare.com/).

## Goals

The primary goal of this POC is to explore the feasibility of decoupling the Crosswalk rendering logic from the traditional, long AEM instance release cycle. By deploying the renderer as a Cloudflare Worker, we aim to achieve greater deployment independence, enabling updates multiple times a day instead of the typical 6-week AEM release cadence.

## Related Projects

- **[sites-content-api-poc](<https://github.com/adobe-rnd/sites-content-api-poc>)**: This related POC models the AEM Content API as a Cloudflare Worker, acting as a proxy or façade in front of the AEM instance.


This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler dev` to start the XWalk Renderer Service locally on port 8786
5. Run `wrangler dev` in a different terminal to start the Content API Service locally on port 8787
5. You will need a local development token to access the AEMaaCS instance. You can retrieve one via https://my.cloudmanager.adobe.com/
6. in your `fstab.yaml` (github project) you need to define the mountpoint as follows, with the UUID being the jcr uuid of your /content/{siteName}:
   
   ```
   mountpoints:
     /:
         url: "https://xwalk-renderer-poc.adobeaem.workers.dev/xwalkpages/p<programId>_e<envId>_<UUID of your /content/{siteName}>/main"
         type: "markup"   
   ```
7. You can then use this Crosswalk Renderer API Service locally by specifying programId, envId and the token. ProgramId & envId need to be set in the url as well as in the header part:

    ```
    curl -X 'GET' \
    'http://localhost:8786/xwalkpages/p130360_e1272151_1534567d-9937-4e40-85ff-369a8ed45367/main/index.html' \
    -H 'Accept: application/json' \
    -H 'Authorization: Bearer <token>'
    ```

8. When you want to deploy, it to Cloudflare, simply run `wrangler deploy` to publish the API to Cloudflare Workers.

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8786/` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.
