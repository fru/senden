// Library

function sender<T>(_opts: { url: string }) {
  return {
    get: <I, O>(handler: (i: I, store: T) => O) => {
      return {
        $get: handler,
      };
    },
  };
}

type RouteConsumer<T> = { [K in keyof T]: T[K] extends AnyFunc ? RouteTypes<T[K]> : RouteConsumer<T[K]> };
type AnyFunc = (...args: any) => any;
type Func0<F extends AnyFunc> = () => RouteResult<F>;
type Func1<F extends AnyFunc, Arg> = (arg: Arg) => RouteResult<F>;
type RouteResult<F extends AnyFunc> = Promise<Awaited<ReturnType<F>>>;
type RouteTypes<F extends AnyFunc> = F extends (arg1: infer Arg, ...args: any) => any ? Func1<F, Arg> : Func0<F>;

function instantiateConsumer<T>(): T {
  return undefined as T;
}

// Server Global:

interface Context {
  req: Request;
  ctx: any;
  env: any;
}

let route = sender<Context>({ url: "/" });

// Server Routes:

const routes = {
  test: {
    entity: {
      ...route.get((i: number) => {
        return { test: "test" + i };
      }),
    },
  },
};

type Api = RouteConsumer<typeof routes>;

// make async and remove last parameter

export async function worker() {
  const api = instantiateConsumer<Api>();
  const result = await api.test.entity.$get(123);
  return result;
}
