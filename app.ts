import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.104.0/node/path.ts";
import { Drash } from "https://deno.land/x/drash@v1.5.1/mod.ts";

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
  public GET() {
    this.response.headers.set("Content-Type", "text/html");
    this.response.body = `Hello World! (on ${new Date()})`;
    return this.response;
  }
}

const server = new Drash.Http.Server({
  directory: dirname(fromFileUrl(import.meta.url)),
  logger: new Drash.CoreLoggers.ConsoleLogger({
    enabled: true,
    level: "debug",
  }),
  middleware: {
    before_request: [RerenderCSSMiddleware],
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
