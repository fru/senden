// --- SHARED ---

type RouteMethod<T> = (input: any, context: T) => any;

// Allowed methods to be used in the route definition
type RouteMethods<T> = {
  $get?: RouteMethod<T>;
  $post?: RouteMethod<T>;
  $put?: RouteMethod<T>;
  $patch?: RouteMethod<T>;
  $delete?: RouteMethod<T>;
  $options?: RouteMethod<T>;
};

// Nested object containing the route definitions
type RouteDefinitions<T> = { [segment: string]: RouteDefinition<T> };
// Workaround: Without the union part, we get e.g.: $get is incompatible with index signature
// This reads as: (route definitions and route methods) or just the optional route methods
export type RouteDefinition<T> = (RouteDefinitions<T> & RouteMethods<T>) | RouteMethods<T>;

// --- CONSUMER ---

// Convert function type to remove all but one parameter
type ConvSimple<F> = F extends () => infer O ? () => Server<O> : ConvRemove<F>;
type ConvRemove<F> = F extends (i: infer I, ...args: any) => infer O ? (input: Clean<I>) => Server<O> : never;
type Clean<I> = {} extends I ? void : I; // Empty object is treated as void

// On the server we await all promises, but then the response is a promise
type Server<O> = Promise<Awaited<O>>;

// Any function
export type Func = (...args: any) => any;
export type Obj = { [key: string]: any };

// Meta properties added to the request functions for logging, key generation, etc.
export interface M {
  path: string[];
  method: string;
  root: string;
}

// Recursively convert all routes to the consumer types
export type RouteConsumer<T> = { [K in keyof T]: T[K] extends Func ? ConvSimple<T[K]> & M : RouteConsumer<T[K]> };
