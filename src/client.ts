import type { Obj } from "./types.d.ts";

export class SendenClient {
  build<T>(root: string) {
    const target = { $senden: this };
    return new Proxy(target, { get: buildGet(this, root, []) }) as T & typeof target;
  }

  operators = {
    $get: this.buildOperator("GET"),
    $post: this.buildOperator("POST", true),
    $put: this.buildOperator("PUT", true),
    $patch: this.buildOperator("PATCH", true),
    $delete: this.buildOperator("DELETE"),
    $options: this.buildOperator("OPTIONS"),
  };

  buildOperator(method: string, hasBody: boolean = false) {
    return (root: string, path: string[]) => {
      const operator = (data: Obj) => {
        if (data === undefined) data = {};
        if (typeof data !== "object") {
          throw new Error("Input must be an object, not " + typeof data);
        }
        const { params, body, url } = this.integrateData(root, path, data);

        const combined = hasBody ? params : { ...body, ...params };
        for (const [key, value] of Object.entries(combined)) {
          url.searchParams.append(key, this.encodeURIComponent(value));
        }

        const req = new Request(url, {
          method,
          body: hasBody ? this.JSON.stringify(body) : undefined,
          headers: this.headers,
        });

        const promise = this.modify(req, { input: data, path, params, body });
        return this.send(promise);
      };
      return Object.assign(operator, { path, method, root });
    };
  }

  integrateData(root: string, path: string[], data: Obj) {
    const body = { ...data };

    // Move $ properties into path segments
    const segments = path.map((k) => {
      if (!k.startsWith("$")) return k;
      delete body[k];
      return this.encodeURIComponent(data[k]);
    });

    // Move remaining $ properties into params
    const params = {} as Obj;
    for (const k of Object.keys(body)) {
      if (!k.startsWith("$")) continue;
      delete body[k];
      params[k.slice(1)] = data[k];
    }

    const url = new URL([root, ...segments].join("/"), location.origin);

    return { params, body, url };
  }

  async send(req: Promise<Request>) {
    const res = await this.fetch(await req);
    const text = await res.text();
    return this.JSON.parse(text);
  }

  // Customizable

  fetch = (req: Request) => fetch(req);
  modify = async (req: Request, _: ModifyContext) => req;
  JSON = {
    stringify: (d: unknown) => JSON.stringify(d),
    parse: (d: string) => JSON.parse(d),
  };
  headers = {
    "Content-Type": "application/json",
  };

  // Edge Case: Params and Path values might need to be quoted

  quoteStringWhenAmbiguous = true;

  quoteURIComponent(d: unknown): string | number | boolean {
    if (d === undefined || d === null) return "" + d;
    if (typeof d === "boolean" || typeof d === "number") return d;
    if (typeof d !== "string") return this.JSON.stringify(d);
    if (!this.quoteStringWhenAmbiguous || !isStringAmbiguous(d)) return d;
    return this.JSON.stringify(d);
  }

  encodeURIComponent(d: unknown) {
    return encodeURIComponent(this.quoteURIComponent(d));
  }
}

function isStringAmbiguous(value: string) {
  // LITERALS
  if (value === "") return true;
  if (value === "null" || value === "undefined") return true;
  if (value === "true" || value === "false") return true;
  // JSON
  if (value.charAt(0) === '"') return true;
  if (value.charAt(0) === "[") return true;
  if (value.charAt(0) === "{") return true;
  // NUMBERS
  if (value === "NaN") return true;
  return +value + "" !== "NaN";
}

function buildGet(client: SendenClient, root: string, path: string[]) {
  return (obj: Obj, prop: string) => {
    if (obj.hasOwnProperty(prop)) return obj[prop];
    if (client.operators.hasOwnProperty(prop)) {
      return (client.operators as any)[prop](root, path);
    }
    return new Proxy({}, { get: buildGet(client, root, [...path, prop]) });
  };
}

export type ModifyContext = { input: Obj; path: string[]; params: Obj; body: Obj };
