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

  it("example?encode-path", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "123", $abc: 123 };
    const call = (r: any) => r.example.$test.$get(params);
    // Assert
    const expected = `http://localhost/cdn/api/example/${encodeURIComponent('"123"')}?abc=123`;
    await assertFetch(root, call, "GET", expected);
  });

  it("example?encode-query", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "123", $abc: 123 };
    const call = (r: any) => r.example.$get(params);
    // Assert
    const expected = `http://localhost/cdn/api/example?test=${encodeURIComponent('"123"')}&abc=123`;
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

  it("PUT example?deep", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: undefined, test: "-123", abc: -123, deep: { json: "123", even: { deeper: "-123" } } };
    const call = (r: any) => r.example.$put(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=&abc=undefined";
    const body = { test: "-123", abc: -123, deep: { json: "123", even: { deeper: "-123" } } };
    await assertFetch(root, call, "PUT", expected, body);
  });

  it("PATCH example?test=&abc=123", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $test: "", $abc: 123, test: "-123", a: true, b: false, c: undefined, d: null };
    const call = (r: any) => r.example.$patch(params);
    // Assert
    const expected = "http://localhost/cdn/api/example?test=&abc=123";
    const body = { test: "-123", a: true, b: false, c: undefined, d: null };
    await assertFetch(root, call, "PATCH", expected, body);
  });

  it("OPTIONS example", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $a: true, $test: ["v1", null], $abc: { deep: "?" } };
    const call = (r: any) => r.example.$options(params);
    // Assert
    const expected = `http://localhost/cdn/api/example?a=true&test=${encodeURIComponent('["v1",null]')}&abc=${encodeURIComponent('{"deep":"?"}')}`;
    await assertFetch(root, call, "OPTIONS", expected);
  });

  it("Stringify auto converts undefined to null", async () => {
    // Setup
    global.location = { origin: "http://localhost" } as any;
    const root = "/cdn/api";
    const params = { $a: [1, undefined] };
    const call = (r: any) => r.example.$get(params);
    // Assert
    const expected = `http://localhost/cdn/api/example?a=${encodeURIComponent("[1,null]")}`;
    await assertFetch(root, call, "GET", expected);
  });
});
