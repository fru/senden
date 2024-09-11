import { describe, it, expect, vi } from "vitest";
import { SendenClient } from "./index";

global.location = { origin: "http://localhost" } as any;

function mockFetch(response: any) {
  const result = {
    args: [] as any[],
    fetch: vi.fn(),
  };

  result.fetch.mockImplementation(function () {
    result.args = Array.from(arguments);
    return { text: async () => JSON.stringify(response) };
  });

  return result;
}

describe("Utility | Main", () => {
  it("Calls fetch", async () => {
    // Setup
    const mock = mockFetch({});

    // Action
    const client = new SendenClient();
    const cdn = client.build<any>("/cdn/api");
    client.fetch = mock.fetch;
    await cdn.example.$get({ $test: "", $abc: 123, abcd: "12345" });

    // Assertions
    expect(mock.fetch).toBeCalledTimes(1);
    const request: Request = mock.args[0];
    expect(request.url).toEqual("http://localhost/cdn/api/example?test=&abc=123");
    expect(request.method).toEqual("GET");
    expect(request.body).toEqual(null);
    expect(Array.from(request.headers.entries())).toEqual([["content-type", "application/json"]]);
  });
});
