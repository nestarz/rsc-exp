let tmpDir: string | undefined;

interface InfoOutput {
  roots: string[];
  modules: (
    & { specifier: string }
    & (
      | {
        kind: "esm";
        local: string | null;
        emit: string | null;
        map: string | null;
        mediaType: "TypeScript";
        size: number;
      }
      | {
        kind: "npm";
        npmPackage: string;
      }
    )
  )[];
  redirects: Record<string, string>;
  npmPackages: Record<
    string,
    {
      name: string;
      version: string;
      dependencies: string[];
    }
  >;
}

export async function info(
  specifier: string,
  options: InfoOptions,
): Promise<InfoOutput> {
  const opts = {
    args: ["info", "--json"],
    cwd: undefined as string | undefined,
    env: { DENO_NO_PACKAGE_JSON: "true" } as Record<string, string>,
    stdout: "piped",
    stderr: "inherit",
  };
  if (typeof options.config === "string") {
    opts.args.push("--config", options.config);
  } else {
    opts.args.push("--no-config");
  }
  if (options.importMap) {
    opts.args.push("--import-map", options.importMap);
  }
  if (typeof options.lock === "string") {
    opts.args.push("--lock", options.lock);
  } else if (!options.cwd) {
    opts.args.push("--no-lock");
  }
  if (options.nodeModulesDir) {
    opts.args.push("--node-modules-dir");
  }
  if (options.cwd) {
    opts.cwd = options.cwd;
  } else {
    if (!tmpDir) tmpDir = Deno.makeTempDirSync();
    opts.cwd = tmpDir;
  }

  opts.args.push(specifier);

  const output = await new Deno.Command(
    Deno.execPath(),
    opts as Deno.CommandOptions,
  ).output();
  if (!output.success) {
    throw new Error(`Failed to call 'deno info' on '${specifier}'`);
  }
  const txt = new TextDecoder().decode(output.stdout);
  return JSON.parse(txt);
}
