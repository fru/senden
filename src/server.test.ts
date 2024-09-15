import { describe, it, expect, vi } from "vitest";
import { createRouteBuilder } from "./helper";
import { SendenServer } from "./server";
import { RouteDefinition } from "./types";

const simpleBuilder = createRouteBuilder<Request>();
const simpleApi: RouteDefinition<Request> = {
  $get: simpleBuilder.query(async ({ $abc }: { $abc: number }) => {
    return { test: "test", abc: $abc, test2: "test2" }; //
  }),
  $test: {
    $get: simpleBuilder.query(async ({ $abc }: { $abc: number }) => {
      return { test: "test", abc: $abc, test2: "test2" }; //
    }),
    $post: simpleBuilder.query(async ({ $abc }: { $abc: number }) => {
      return { test: "test", abc: $abc, test2: "test2" }; //
    }),
  },
};

describe("Server Check Responses", () => {
  it("example?test=&abc=123", async () => {
    const senden = new SendenServer<Request>("/cdn/api");
    // FIXME Senden Server test
    // "http://localhost/cdn/api?test=&abc=123"
    // "http://localhost/cdn/api/?test=&abc=123"
    // "http://localhost/cdn/api/test/?test=&abc=123"
    const simpleContext = new Request("http://localhost/cdn/api/test?test=&abc=123");
    const simpleResponse = await senden.buildHandler(simpleApi)(simpleContext);
    expect(simpleResponse.status).toEqual(200);
    expect(await simpleResponse.json()).toEqual({ test: "test", abc: 123, test2: "test2" });
  });
});
