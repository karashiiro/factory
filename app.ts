import { dirname, fromFileUrl } from "path";
import { Drash } from "drash";
import { Tengine } from "tengine";
import { configure, renderFile } from "eta";

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
