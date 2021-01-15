/* START COPY NOTICE
 * MIT License
 * Copyright (c) 2021 Bozeman Pass, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * END COPY NOTICE */

import assert from "assert";
import NpmRegistry, {DEFAULT_REGISTRY} from "./yarn/npm-registry";
import NpmResolver from "./yarn/npm-resolver";
import semver from "semver";

export const versionCompare = semver.compare;

export const resolvePackageVersion = async (name: string,
                                            version = 'latest',
                                            registry = DEFAULT_REGISTRY,
                                            cache?: Map<string, any>) => {

  const json = cache?.get(name) || await NpmRegistry.request(name, registry);
  let match;
  let satisfies = [];
  if (json) {
    match = await NpmResolver.findVersionInRegistryResponse(name, version, json);
    if (json.versions) {
      for (const ver of Object.keys(json.versions)) {
        if (semver.satisfies(ver, version)) {
          satisfies.push(json.versions[ver]);
        }
      }
    }
  }
  return {name, version, match, satisfies, tags: json ? json['dist-tags'] : {}, versions: json ? json.versions : {}};
}

export const deepResolvePackageVersions = async (name: string, version = 'latest', registry = DEFAULT_REGISTRY) => {
  const flat: any = {};
  const cache = new Map<string, any>();

  const deepResolve = async (name: string, version: string, parent?: any) => {
    const ret: any = {
      name,
      requested: version,
      resolved: null,
      dependencies: {},
      tarball: null,
      unpackedSize: 0
    };

    const { match } = await resolvePackageVersion(name, version, registry, cache);

    if (match) {
      assert(match && match.dist);
      const record = flat[name] || {};
      if (!record[match.version]) {
        record[match.version] = {
          name: match.name,
          version: match.version,
          tarball: match.dist.tarball,
          unpackedSize: match.dist.unpackedSize || 0,
          requiredBy: []
        };
      }
      if (parent) {
        const {name, version} = parent;
        if (!record[match.version].requiredBy.find((item: any) => item.name == name && item.version == version)) {
          record[match.version].requiredBy.push({name, version});
        }
      }
      flat[name] = record;

      ret.resolved = match.version;
      ret.tarball = match.dist.tarball;
      ret.unpackedSize = match.dist.unpackedSize || 0;
      if (match.dependencies) {
        for (const depName of Object.keys(match.dependencies)) {
          ret.dependencies[depName] = await deepResolve(depName, match.dependencies[depName], match);
        }
      }
    }
    return ret;
  }

  const tree = await deepResolve(name, version, undefined);

  return {tree, flat};
}
