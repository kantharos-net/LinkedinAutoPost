import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/makePostContent", async ({ request }) => {
    const body = await request.json();
    const description = body?.description ?? "";
    return new HttpResponse(`Generated post for: ${description}`, { status: 200 });
  }),
  http.post("/postPost", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "mock-id", text: body?.text ?? "" });
  })
];
