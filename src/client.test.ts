import { describe, it, expect, vi } from "vitest";
import { SendenClient } from "./index";

async function assertFetch(root: string, call: (r: any) => Promise<any>, method: string, url: string, body: any = null) {
  // Setup

  let args = [] as any[];
  let response = { unimportent: "response" };
  let fetch = vi.fn();

  fetch.mockImplementation(function () {
    args = Array.from(arguments);
    return { text: async () => JSON.stringify(response) };
  });

  // Action

  const client = new SendenClient();
  client.fetch = fetch;
  await call(client.build<any>(root));

  // Assert
  expect(fetch).toBeCalledTimes(1);
  expect(args[0].method).toEqual(method);
  expect(args[0].url).toEqual(url);
  expect(await new Response(args[0].body || "null").json()).toEqual(body);
  expect(Array.from(args[0].headers.entries())).toEqual([["content-type", "application/json"]]);
}

describe("Test Client Fetch Requests", () => {
  it("example?test=&abc=123", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: 123 };
    const call = (r: any) => r.example.$get(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=&abc=123";
    await assertFetch(root, call, "GET", expected);
  });

  it("example.com/", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "https://example.com";
    const params = {};
    const call = (r: any) => r.$get(params);
    // Assert
    const expected = "https://example.com/";
    await assertFetch(root, call, "GET", expected);
  });

  it("example/123?test=", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: 123 };
    const call = (r: any) => r.example.$abc.$get(params);
    // Assert
    const expected = "http://localhost/cdn/api/example/123?test=";
    await assertFetch(root, call, "GET", expected);
  });

  it("example?test=%2522123%2522&abc=123", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "123", $abc: 123 };
    const call = (r: any) => r.example.$get(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=%2522123%2522&abc=123";
    await assertFetch(root, call, "GET", expected);
  });

  it("DELETE example?test=&abc=123", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: 123 };
    const call = (r: any) => r.example.$delete(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=&abc=123";
    await assertFetch(root, call, "DELETE", expected);
  });

  it("POST example?test=&abc=123", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: 123, test: "-123", abc: -123 };
    const call = (r: any) => r.example.$post(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=&abc=123";
    const body = { test: "-123", abc: -123 };
    await assertFetch(root, call, "POST", expected, body);
  });
});
