import { join } from "https://deno.land/std@0.104.0/node/path.ts";
import { Drash } from "https://deno.land/x/drash@v1.5.1/mod.ts";

async function getDirectoryFilenames(dir: string): Promise<string[]> {
  const scssFiles: string[] = [];
  for await (const de of Deno.readDir(dir)) {
    if (de.isDirectory) {
      scssFiles.push(...await getDirectoryFilenames(join(dir, de.name)));
    } else {
      scssFiles.push(de.name);
    }
  }
  return scssFiles;
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
  static paths = ["/css"];
  public async GET() {
    this.response.headers.set("Content-Type", "text/css");

    const filePaths = await getDirectoryFilenames("./scss");
    if (filePaths.length > 0) {
      const renderProcess = Deno.run({
        cmd: ["sass", ...filePaths],
        stdout: "piped",
      });
      await renderProcess.status();

      const cssBuf = await renderProcess.output();
      const decoder = new TextDecoder("utf-8");
      const cssData = decoder.decode(cssBuf.buffer);

      this.response.body = cssData;
    }

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
