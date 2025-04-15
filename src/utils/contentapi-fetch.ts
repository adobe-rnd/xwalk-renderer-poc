import { ContentApiContext } from "./ctx";

// Define interfaces based on the OpenAPI schema
export interface AuditInfo {
	at: string; // Assuming ISO 8601 date-time string
	by: string;
}

export interface ImageReference {
	assetId: string;
}

export interface Field {
	name: string;
	value: string;
	type: string;
}

export interface VersionInfo {
	label: string;
	description: string;
	created: AuditInfo;
}

export interface Page {
	id: string;
	versionInfo?: VersionInfo;
	siteId: string;
	parentPageId?: string;
	name?: string;
	path: string;
	title: string;
	description?: string;
	templateId?: string; // readOnly
	tags?: string[];
	thumbnail?: ImageReference;
	metadata?: Field[];
	created?: AuditInfo; // readOnly
	modified?: AuditInfo; // readOnly
	published?: AuditInfo; // readOnly
	_links?: {
		self?: { href: string };
		edit?: { href: string };
	};
}

// Mapper function (simple type casting for now)
function mapJsonToPage(json: any): Page {
	// Add validation logic here if needed in the future
	return json as Page;
}

export async function fetchPagesByUrlJson(
	ctx: ContentApiContext,
	urlQuery: string
): Promise<Page> {
	const { pagesEndpointUrl, authToken, headers: ctxHeaders } = ctx;

	const headers: HeadersInit = {
		'Accept': 'application/json',
		...(ctxHeaders || {}),
	};
	if (authToken) {
		headers['Authorization'] = `Bearer ${authToken}`;
	}

	const url = new URL(`${pagesEndpointUrl}/byUrl?url=${urlQuery}`, `${pagesEndpointUrl}`);
	console.log(`Fetching from: ${url}`);
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: headers,
		});

		if (!response.ok) {
			const errorStatus = response.status;
			const errorStatusText = response.statusText;
			console.error(`Error fetching from /pages/byUrl: ${errorStatus} ${errorStatusText}`);
			let errorBody = '';
			try {
				errorBody = await response.text();
				console.error(`/pages/byUrl Error body:`, errorBody);
			} catch (e) { /* Ignore body read error */ }
			// Throw custom error with status
			throw new ContentApiFetchError(`Content API fetch failed: ${errorStatus} ${errorStatusText}. Body: ${errorBody}`, errorStatus);
		}

		const jsonResponse = await response.json();
		return mapJsonToPage(jsonResponse);

	} catch (error) {
		// Re-throw ContentApiFetchError if it's already the correct type
		if (error instanceof ContentApiFetchError) {
			throw error;
		}
		// Handle other errors (e.g., network issues, JSON parsing)
		console.error(`Failed to execute or parse /pages/byUrl:`, error);
		// Optionally, wrap other errors in a generic ContentApiFetchError or handle differently
		// For now, let's throw a generic error for non-fetch related issues
		throw new Error(`An unexpected error occurred during Content API fetch: ${error instanceof Error ? error.message : String(error)}`);
	}
}



export async function fetchPageContentByPageIdHtml(
	ctx: ContentApiContext,
	pageId: string
): Promise<string> {
	const { pagesEndpointUrl, authToken, headers: ctxHeaders } = ctx;

	const headers: HeadersInit = {
		'Accept': 'application/json',
		...(ctxHeaders || {}),
	};
	if (authToken) {
		headers['Authorization'] = `Bearer ${authToken}`;
	}

	const url = new URL(`${pagesEndpointUrl}/${pageId}/content`, pagesEndpointUrl);
	console.log(`Fetching from: ${url}`);
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: headers,
		});

		if (!response.ok) {
			const errorStatus = response.status;
			const errorStatusText = response.statusText;
			console.error(`Error fetching from /pages/${pageId}/content: ${errorStatus} ${errorStatusText}`);
			let errorBody = '';
			try {
				errorBody = await response.text();
				console.error(`/pages/${pageId}/content Error body:`, errorBody);
			} catch (e) { /* Ignore body read error */ }
			// Throw custom error with status
			throw new ContentApiFetchError(`Content API fetch failed: ${errorStatus} ${errorStatusText}. Body: ${errorBody}`, errorStatus);
		}

		const htmlResponse = await response.text();
		return htmlResponse;

	} catch (error) {
		// Re-throw ContentApiFetchError if it's already the correct type
		if (error instanceof ContentApiFetchError) {
			throw error;
		}
		// Handle other errors (e.g., network issues, JSON parsing)
		console.error(`Failed to execute or parse /pages/${pageId}/content:`, error);
		// Optionally, wrap other errors in a generic ContentApiFetchError or handle differently
		// For now, let's throw a generic error for non-fetch related issues
		throw new Error(`An unexpected error occurred during Content API fetch: ${error instanceof Error ? error.message : String(error)}`);
	}
}





export class ContentApiFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ContentApiFetchError';
    this.status = status;
  }
}

export function handleErrors(error: unknown): Response {
  console.error("Error occurred:", error);

  if (error instanceof ContentApiFetchError) {
      if (error.status === 401) {
          // Specific error for AEM 401 Unauthorized
          return new Response(
              JSON.stringify({ title: "Bad Gateway", status: 502, detail: "This service is not authorized to access Content API." }),
              { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
      } else {
           // Other Content API fetch errors (e.g., 404, 5xx)
           // Return 502 Bad Gateway as the downstream service failed
           return new Response(
              JSON.stringify({ title: "Bad Gateway", status: 502, detail: `Failed to fetch data from Content API. Status: ${error.status}.` }),
              { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
      }
  } else {
       // Generic internal server error for unexpected issues
       return new Response(
          JSON.stringify({ title: "Internal Server Error", status: 500, detail: "An unexpected error occurred." }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
  }
}
