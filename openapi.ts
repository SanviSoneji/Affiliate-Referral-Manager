const bearer = [{ bearerAuth: [] }];
const json = (schema: object) => ({ content: { "application/json": { schema } } });
const idParam = { name: "id", in: "path", required: true, schema: { type: "integer" } };
const codeParam = { name: "code", in: "path", required: true, schema: { type: "string" } };

export const openapi = {
  openapi: "3.0.3",
  info: { title: "Referral & Affiliate Tracker API", version: "1.0.0", description: "Create referral campaigns, share tracked links, and measure clicks, signups and rewards." },
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/api/auth/register": { post: { tags: ["Auth"], summary: "Register a user", requestBody: json({ type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string" }, password: { type: "string", minLength: 8 } } }), responses: { 201: { description: "Created, returns JWT" }, 409: { description: "Email already registered" } } } },
    "/api/auth/login": { post: { tags: ["Auth"], summary: "Log in", requestBody: json({ type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } }), responses: { 200: { description: "Returns JWT" }, 401: { description: "Invalid credentials" } } } },
    "/api/campaigns": {
      get: { tags: ["Campaigns"], summary: "List campaigns with dashboard summary", security: bearer, responses: { 200: { description: "Campaigns and totals" } } },
      post: { tags: ["Campaigns"], summary: "Create a campaign", security: bearer, requestBody: json({ type: "object", required: ["name", "rewardAmount"], properties: { name: { type: "string" }, description: { type: "string" }, rewardAmount: { type: "number" } } }), responses: { 201: { description: "Created" } } },
    },
    "/api/campaigns/{id}": {
      get: { tags: ["Campaigns"], summary: "Campaign detail with links and recent signups", security: bearer, parameters: [idParam], responses: { 200: { description: "OK" }, 404: { description: "Not found" } } },
      patch: { tags: ["Campaigns"], summary: "Activate or pause a campaign", security: bearer, parameters: [idParam], requestBody: json({ type: "object", required: ["status"], properties: { status: { type: "string", enum: ["active", "paused"] } } }), responses: { 200: { description: "Updated" } } },
    },
    "/api/campaigns/{id}/links": { post: { tags: ["Links"], summary: "Generate a unique referral link", security: bearer, parameters: [idParam], requestBody: json({ type: "object", properties: { label: { type: "string" } } }), responses: { 201: { description: "Created" } } } },
    "/r/{code}": { get: { tags: ["Public"], summary: "Track a click and redirect to the signup page", parameters: [codeParam], responses: { 302: { description: "Redirect" }, 404: { description: "Unknown or paused link" } } } },
    "/api/public/ref/{code}": { get: { tags: ["Public"], summary: "Look up the campaign for a referral code", parameters: [codeParam], responses: { 200: { description: "OK" }, 404: { description: "Not found" } } } },
    "/api/public/signup": { post: { tags: ["Public"], summary: "Record a signup (conversion) and credit the reward", requestBody: json({ type: "object", required: ["code", "name", "email"], properties: { code: { type: "string" }, name: { type: "string" }, email: { type: "string" } } }), responses: { 201: { description: "Recorded" }, 409: { description: "Duplicate signup" } } } },
  },
};
