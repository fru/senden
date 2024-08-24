<img src="https://raw.githubusercontent.com/fru/senden/main/logo.png" align="right" height="68" alt="Logo" />

⭐ Star us on GitHub — it motivates us a lot!

# senden

Use your TS server definition, to write typesafe client code. Yes - like tRPC but RESTfull. We have custamizable paths and familiar HTTP methods.

```ts
import { server, RouteClient } from "senden";

const routes = {
  warehouse: {
    order: {
      $post: async (order: Order) => { ... }),

      $id: {
        $get: async (data: {$id: number}) => { ... }),
        $delete: async (data: {$id: number}) => { ... }),
      }

      list: {
        $get: async (data: {$page: number}) => { ... }),
      }
    },
  },
};

export const appRouter = server.build(routes);

export type WarehouseApi = RouteClient<typeof routes>;
```

This api will now accept the following requests:

| Method   | Route                         | Description                  |
| -------- | ----------------------------- | ---------------------------- |
| `POST`   | `warehouse/order`             | Create a new order           |
| `GET`    | `warehouse/order/123`         | Get the order with id 123    |
| `DELETE` | `warehouse/order/123`         | Delete it                    |
| `GET`    | `warehouse/order/list?page=0` | Get the first page of orders |

And finally, we can use it in frontend code with auto-completion and type-safety.

```ts
import { client } from "senden";
import type { WarehouseApi } from "../server/routes";

const api = client<WarehouseApi>();

const result = await api.warehouse.order.$post({
  name: "My Order",
  ...
});
```
