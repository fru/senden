import { expectTypeOf } from "vitest";
import { createRouteBuiler, RouteConsumer } from "./index";
import { z } from "zod";

const builder = createRouteBuiler<{}>();

test("Server type to RouteConsumer<>", () => {
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
  expectTypeOf<Api>().toEqualTypeOf<Api>();
});
