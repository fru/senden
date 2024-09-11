import { describe, it, expect, vi } from "vitest";
import { createRouteBuiler, RouteConsumer, SendenClient } from "./index";
import { z } from "zod";

global.location = { origin: "http://localhost" } as any;

function createFetchResponse(data: any) {
  return { text: () => new Promise((resolve) => resolve(JSON.stringify(data))) };
}

const builder = createRouteBuiler<{}>();

describe("Utility | Main", () => {
  it("Calls fetch", async () => {
    const fetch = vi.fn();
    fetch.mockResolvedValue(createFetchResponse({}));

    const api = {
      example: {
        // GET ${root}/example
        $get: builder
          .input(z.object({ $test: z.string(), $abc: z.number() }))
          .output(z.object({ test: z.string() }))
          .query(async ({ $abc }: { $abc: number }) => {
            return { test: "test", abc: $abc, test2: "test2" }; //
          }),

        // POST ${root}/example/$test
        $test: {
          $post: builder
            .input(z.object({ $inp1: z.string().min(3), $abc: z.number() }))
            .output(z.object({ test: z.string() }))
            .mutation(async ({ $inp1 }: { $inp1: string }) => {
              return { test: "test:  " + $inp1 + "  ", test2: "test2" };
            }),

          $get: builder.query(async (_) => {
            return { test: "test" };
          }),
        },
      },
    };
    type Api = RouteConsumer<typeof api>;
    const client = new SendenClient();
    const cdn = client.build<Api>("/cdn/api");
    client.fetch = fetch;

    await cdn.example.$get({ $test: "", $abc: 123 });
    expect(fetch).toBeCalledTimes(1);
  });
});
