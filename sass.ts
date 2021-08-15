export interface SassCommand {
  writeStdin: (input: string) => Promise<void>;
  execute: () => Promise<void>;
}

export function sass(...params: string[]): SassCommand {
  const renderProcess = Deno.run({
    cmd: ["sass", ...params],
    stdin: "piped",
  });

  return {
    writeStdin: async (input: string) => {
      await renderProcess.stdin.write(
        new TextEncoder().encode(input),
      );
    },
    execute: async () => {
      renderProcess.stdin.close();
      await renderProcess.status();
    },
  };
}
