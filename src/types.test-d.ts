import { expectTypeOf } from "vitest";

test("my types work properly", () => {
  expectTypeOf(function () {}).toBeFunction();
});
