import { Drash } from "https://deno.land/x/drash@v1.5.1/mod.ts";

class HomeResource extends Drash.Http.Resource {
  static paths = ["/"];
  public GET() {
    this.response.body = `Hello World! (on ${new Date()})`;
    return this.response;
  }
}

const server = new Drash.Http.Server({
  logger: new Drash.CoreLoggers.ConsoleLogger({
    enabled: true,
    level: "debug",
  }),
  response_output: "text/html",
  resources: [HomeResource],
});

server.run({
  hostname: "localhost",
  port: 3788,
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);
