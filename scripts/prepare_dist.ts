import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url));

type PackageJson = {
  name: string;
  version: string;
  main?: string;
  module?: string;
  browser?: string;
  types?: string;
  typings?: string;
  exports?: Record<string, unknown> | string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

const pkgPath = path.join(__dirname, "../package.json");
const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));

function check_version(){
  const tagVersion = process.env.RELEASE_VERSION || process.env.GITHUB_REF_NAME
  if (tagVersion) {
    const cleanVersion = tagVersion.replace(/^v/, "")
    if (pkg.version == cleanVersion){
      console.log(`got version ${cleanVersion}`)
    }
    else {
      throw new Error(
        `package.json version (${pkg.version}) does not match tag version (${cleanVersion})`
      )
    }
  }
  else {
      throw new Error("couldn't get tag version")
  }
}

function update_exports_recursively(exportsObj: Record<string, unknown>){
    for (const key in exportsObj) {
      if (typeof exportsObj[key] === "string") {
        exportsObj[key] = (exportsObj[key] as string).replace(/^(?:\.\/)?dist\//, "./");
      } else if (typeof exportsObj[key] === "object" && exportsObj[key] !== null) {
        update_exports_recursively(exportsObj[key] as Record<string, unknown>);
      }
    }
}

function update_package_json(){
  const fieldsToUpdate: (keyof PackageJson)[] = ["main", "module", "browser", "types", "typings"];
  fieldsToUpdate.forEach((field) => {
    if (typeof pkg[field] === "string") {
      pkg[field] = (pkg[field] as string).replace(/^(?:\.\/)?dist\//, "./");
    }
  })

  if (pkg.exports && typeof pkg.exports === "object") {  
    update_exports_recursively(pkg.exports as Record<string, unknown>);
  }

  delete pkg.scripts?.build
  delete pkg.files

}

function move_files_to_dist(){
  const distPath = path.join(__dirname, "../dist");
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true })
  }

  writeFileSync(
    path.join(distPath, "package.json"),
    JSON.stringify(pkg, null, 2)
  )

  const filesToCopy = ["README.md", "LICENSE"];
  filesToCopy.forEach((file) => {
    const src = path.join(__dirname, `../${file}`);
    if (existsSync(src)) {
      copyFileSync(src, path.join(distPath, file));
    }
  })
}

if (process.env.GITHUB_ACTIONS){
  console.debug("checking version")
  check_version()
}
console.debug("updating dist/package.json")
update_package_json()
console.debug("moving files to dist")
move_files_to_dist()
console.log("Successfully prepared dist/ for publication");