import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.104.0/node/path.ts";
import { Drash } from "https://deno.land/x/drash@v1.5.1/mod.ts";
import { Tengine } from "https://deno.land/x/drash_middleware@v0.7.9/tengine/mod.ts";
import { configure, renderFile } from "https://deno.land/x/eta@v1.12.2/mod.ts";

async function RerenderCSSMiddleware(
  req: Drash.Http.Request,
): Promise<void> {
  if (req.url_path.startsWith("css")) {
    const renderProcess = Deno.run({
      cmd: ["sass", "scss:www/css"],
    });
    await renderProcess.status();
  }
}

class HTMLResource extends Drash.Http.Resource {
  static paths = ["/"];
  public async GET() {
    this.response.headers.set("Content-Type", "text/html");
    this.response.body = await this.response.render(
      "./index",
      {
        message: "Hella using Eta.",
        template_engines: [
          {
            name: "dejs",
            url: "https://github.com/syumai/dejs",
          },
          {
            name: "Dinja",
            url: "https://github.com/denjucks/dinja",
          },
          {
            name: "Jae",
            url: "https://github.com/drashland/deno-drash-middleware",
          },
        ],
      },
    );
    return this.response;
  }
}

// Eta configuration
configure({ views: "./templates/" });

const server = new Drash.Http.Server({
  directory: dirname(fromFileUrl(import.meta.url)),
  logger: new Drash.CoreLoggers.ConsoleLogger({
    enabled: true,
    level: "debug",
  }),
  middleware: {
    before_request: [RerenderCSSMiddleware],
    after_resource: [Tengine({
      render: async (...args: unknown[]): Promise<string> => {
        return await renderFile(
          args[0] as string,
          args[1] as any,
        ) as string;
      },
    })],
  },
  resources: [HTMLResource],
  static_paths: {
    "/css": "/www/css",
  },
});

server.run({
  hostname: "localhost",
  port: 3788,
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);
