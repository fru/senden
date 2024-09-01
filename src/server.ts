import type { RouteDefinition } from "./types";

export class SendenServer<T extends LooseRequestContext> {
  constructor(public readonly root: string) {
    const hasDomain = root.startsWith("http") || root.startsWith("//");
    if (hasDomain) throws("Root can't hava a domain, and cannot start with // or http");
    if (!root.startsWith("/")) this.root = "/" + this.root;
    if (root.endsWith("/*")) this.root = this.root.slice(0, -2) + "/";
    if (!root.endsWith("/")) this.root = this.root + "/";
  }

  buildHandler(api: RouteDefinition<T>) {
    return async (context: T) => {
      const { path, method, params, body } = await this.matchRequestData(context);
      const { process, pathData } = this.findRoute(api, path, method);

      const combined = { ...body, ...pathData, ...params };
      const result = await process(combined, context);
      return new Response(JSON.stringify(result), { headers: this.headers });
    };
  }

  headers = {
    "Content-Type": "application/json",
  };

  extractRequest(ctx: any) {
    const check = [ctx, ctx?.req, ctx?.req?.raw, ctx?.request];
    const req = check.find((c) => c instanceof Request);
    return req || throws("Unknown context, can't extract request");
  }

  async matchRequestData(context: T) {
    const req = this.extractRequest(context);
    const { pathname, searchParams } = new URL(req.url);

    if (!pathname.startsWith(this.root)) {
      throws(`Path ${pathname} does not start with ${this.root}`);
    }
    const path = pathname.slice(this.root.length).split("/");
    const method = "$" + req.method.toLowerCase();
    const body = req.body ? await req.json() : {};

    const paramsArray = Array.from(searchParams.entries()).map(([k, v]) => {
      return ["$" + k, this.parse(v)];
    });

    return { path, method, body, params: Object.fromEntries(paramsArray) };
  }

  parse(part: string) {
    const dec = decodeURIComponent(part);
    if (['"', "[", "{"].includes(dec.charAt(0))) return JSON.parse(part);
    if (+dec + "" !== "NaN") return +dec;
    const literals = [undefined, null, NaN, true, false];
    return literals.find((l) => "" + l === dec) || dec;
  }

  findRoute(api: RouteDefinition<T>, path: string[], method: string) {
    const found = this.searchRoutes(api, path, method, {});
    if (found.length < 1) throws(method + " not found under " + path.join("/"));
    if (found.length > 1) throws(method + " matches multiple routes " + path.join("/"));
    return found[0];
  }

  searchRoutes(api: RouteDefinition<T>, path: string[], method: string, pathData: any): SearchResult {
    const notFunc = (k: string) => !(api[k] instanceof Function);

    // End case - No more path, find method
    if (path.length === 0) {
      if (notFunc(method)) return [];
      return [{ process: api[method] as Function, pathData }];
    }

    // Default case - find api keys matching path[0]
    const newPath = path.slice(1);
    if (api[path[0]] && notFunc(path[0])) {
      return this.searchRoutes(api[path[0]], newPath, method, pathData);
    }

    // Fallthrough case - search through all placeholders, assume path[0] is a value
    const value = this.parse(path[0]);
    const keys = Object.keys(api).filter((k) => k.startsWith("$") && notFunc(k));

    return keys.flatMap((k: string) => {
      let newData = { ...pathData, [k]: value };
      return this.searchRoutes(api[k], newPath, method, newData);
    });
  }
}

type SearchResult = { process: Function; pathData: any }[];
type LooseRequestContext = Request | { req: Request } | { req: { raw: Request } } | { request: Request };

function throws(message: string): never {
  throw new Error(message);
}
