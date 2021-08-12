import { exists } from "https://deno.land/std@0.104.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.104.0/node/path.ts";
import { Drash } from "https://deno.land/x/drash@v1.5.1/mod.ts";

function generateGenericRoute(
  prefix: string,
  depth: number,
): string[] {
  if (depth === 0) return [prefix];
  const arr = generateGenericRoute(prefix, depth - 1);
  return arr.concat(
    `${arr![arr!.length - 1]}/:f${depth}?`,
  );
}

class HTMLResource extends Drash.Http.Resource {
  static paths = ["/"];
  public GET() {
    this.response.headers.set("Content-Type", "text/html");
    this.response.body = `Hello World! (on ${new Date()})`;
    return this.response;
  }
}

class CSSResource extends Drash.Http.Resource {
  static paths = generateGenericRoute("/css", 32);
  public async GET() {
    // Reconstruct the file name from the path parameters
    const fileName = Object.values(this.request.getAllPathParams()).filter(
      (param) => param != null && param !== "",
    ).join(
      "/",
    );

    // Rerender all SCSS files
    const renderProcess = Deno.run({
      cmd: ["sass", "scss:www/css"],
    });
    await renderProcess.status();

    const fsFileName = join("./www/css", fileName);

    // Ensure requested file exists
    if (fileName == null || fileName === "" || !await exists(fsFileName)) {
      this.response.status_code = 404;
      this.response.body = "Not Found";
      return this.response;
    }

    // Retrieve the appropriate CSS file
    this.response.headers.set("Content-Type", "text/css");
    this.response.body = await Deno.readFile(fsFileName);
    return this.response;
  }
}

const server = new Drash.Http.Server({
  logger: new Drash.CoreLoggers.ConsoleLogger({
    enabled: true,
    level: "debug",
  }),
  resources: [HTMLResource, CSSResource],
});

server.run({
  hostname: "localhost",
  port: 3788,
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);
