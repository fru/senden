import type { Func, M } from "../src/types.d.ts";
// @ts-ignore peer dependency
import { z } from "zod";

// --- QUERY ---

export function query<O>(f: (() => O) & M): Result<O>;
export function query<I, O>(f: OpClient<I, O> & M, input: NoInfer<I>): Result<O>;

export function query<O>(f: Func & M, input?: any): Result<O> {
  const { path, method, root } = f;
  const queryKey = [...path, method, input, root];
  const args = arguments;
  const queryFn = () => {
    if (args.length === 1) return f();
    return f(input);
  };
  return { queryKey, queryFn };
}

type Result<O> = { queryKey: any[]; queryFn: () => O };
type OpClient<I, O> = (input: I) => Promise<O>;

// --- ROUTE TYPES ---

export function createRouteBuiler<Context>() {
  return internalCreateRouteBuiler<Context>(undefined, undefined);
}

function internalCreateRouteBuiler<Context>(cumulateI?: z.ZodTypeAny, cumulateO?: z.ZodTypeAny) {
  const builder: Builder<Context> = {
    input: (i) => {
      let newI = cumulateI ? z.intersection(i, cumulateI) : i;
      return internalCreateRouteBuiler(newI, cumulateO);
    },
    output: (o) => {
      let newO = cumulateO ? z.intersection(o, cumulateO) : o;
      return internalCreateRouteBuiler(cumulateI, newO);
    },
    query: (f) => checked(f),
    mutation: (f) => checked(f),
  };

  const checked = <F extends Func>(f: F) => {
    return (async (input: any, ...args: any) => {
      if (cumulateI) input = await cumulateI.parseAsync(input);
      const result = await f(input, ...args);
      if (cumulateO) return cumulateO.parseAsync(result);
      return result;
    }) as F;
  };

  return builder;
}

type Builder<Context, I extends {} = {}, O extends {} = {}> = {
  input: <INew extends z.AnyZodObject>(i: INew) => Builder<Context, I & z.infer<INew>, O>;
  output: <ONew extends z.AnyZodObject>(i: ONew) => Builder<Context, I, O & z.infer<ONew>>;
  query: <IAct extends {}, OAct extends {}>(f: OpServer<Context, IAct, I, OAct, O>) => typeof f;
  mutation: <IAct extends {}, OAct extends {}>(f: OpServer<Context, IAct, I, OAct, O>) => typeof f;
};

type Narrow<T, TAct> = {} extends T ? TAct : T;
type Out<T> = T | Promise<T>;
type OpServer<Context, IAct, I, OAct, O> = (input: Narrow<I, IAct>, ctx: Context) => Out<Narrow<O, OAct>>;
