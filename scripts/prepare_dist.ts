import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { Logger } from "../src/utils.ts"

const LOG_LEVEL =  Logger.log_levels.info
const __dirname = dirname(fileURLToPath(import.meta.url))

type PackageJson = {
  name: string;
  version: string;
  main?: string;
  module?: string;
  browser?: string;
  types?: string;
  typings?: string;
  bin?: string,
  exports?: Record<string, unknown> | string;
  scripts: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

const logger = new Logger(LOG_LEVEL)

const pkgPath = path.join(__dirname, "../package.json");
const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));

function check_version(){
  const tagVersion = process.env.RELEASE_VERSION || process.env.GITHUB_REF_NAME
  if (tagVersion) {
    const cleanVersion = tagVersion.replace(/^v/, "")
    if (pkg.version == cleanVersion){
      logger.info(`got tag version ${cleanVersion}`)
      logger.debug(`package version is ${pkg.version}`)
    }
    else {
      throw new Error(
        `package version (${pkg.version}) does not match tag version (${cleanVersion})`
      )
    }
  }
  else {
      throw new Error("couldn't get tag version")
  }
}

function update_recursively(pkg_obj: Record<string, unknown>, recursion_level=1){
    const indent = "    ".repeat(recursion_level)
    for (const key in pkg_obj) {
      logger.debug(`looking at ${key}: ${pkg_obj[key]}`, indent)
      if (typeof pkg_obj[key] === "string") {
        const replacement = (pkg_obj[key] as string).replace("dist/", "")
        pkg_obj[key] = replacement
        logger.debug(`replacing with ${replacement}`, indent)
      }
      else if (typeof pkg_obj[key] === "object" && pkg_obj[key] !== null) {
        logger.debug("type is object, recursing", indent)
        update_recursively(pkg_obj[key] as Record<string, unknown>, recursion_level+1);
      }
      else {
        logger.debug(`skipping as type '${typeof pkg_obj[key]}' is neither object nor string`, indent)
      }
    }
}

function update_package_json(){
  delete pkg.scripts.build
  delete pkg.scripts.release
  delete pkg.scripts.test
  
  for (const [key, value] of Object.entries(pkg)){
    logger.debug(`looking at ${key}: ${value}`)
    if (typeof value === "string") {
      const replacement = (value as string).replace("dist/", "")
      logger.debug(`replacing with ${replacement}`)
      pkg[key] = replacement
    }
    else if (typeof value === "object"){
      logger.debug("type is object, updating recursively")
      update_recursively(value as Record<string, unknown>);
    }
    else {
        logger.debug(`skipping as type '${typeof value}' is neither object nor string`)
    }
  }
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
  logger.info("checking version")
  check_version()
}
logger.info("updating dist/package.json")
update_package_json()
logger.info("moving files to dist")
move_files_to_dist()
logger.info("Successfully prepared dist/ for publication")