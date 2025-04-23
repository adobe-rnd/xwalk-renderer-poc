import { fromHono } from "chanfana";
import { Hono } from "hono";
import { PageFetchById } from "./endpoints/pageFetchById";
import { Bindings } from "types";

const app = new Hono<{ Bindings: Bindings }>()

const openapi = fromHono(app, {
	docs_url: "/",
});

// Path example: /xwalkpages/p130360_1272151_1534567d-9937-4e40-85ff-369a8ed45367/main/foobar/index.html
//      programId------------^
//      envId ----------------------^
//      siteId --------------------------------^
//      branch -----------------------------------------------------------------^
//      path (foobar/index.html) --------------------------------------------------------^
openapi.get("/xwalkpages/:xwalkPageId/:branch/", PageFetchById);
openapi.get("/xwalkpages/:xwalkPageId/:branch/:path", PageFetchById);

export default app;
