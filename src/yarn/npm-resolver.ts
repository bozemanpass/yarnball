// Source: https://github.com/yarnpkg/yarn/blob/1.22-stable/src/resolvers/registries/npm-resolver.js

/**
 * BSD 2-Clause License
 *
 * For Yarn software
 *
 * Copyright (c) 2016-present, Yarn Contributors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import semver from 'semver';
import {Manifest, RegistryResponse} from "./types";
import PackageConstraintResolver from "./package-constraint-resolver";

export default class NpmResolver {

  static async findVersionInRegistryResponse(
    name: string,
    range: string,
    body: RegistryResponse
  ): Promise<Manifest | null> {
    if (body.versions && Object.keys(body.versions).length === 0) {
      throw new Error('No versions');
    }

    if (!body['dist-tags'] || !body.versions) {
      throw new Error('Malformed response');
    }

    if (range in body['dist-tags']) {
      range = body['dist-tags'][range];
    }

    // If the latest tag in the registry satisfies the requested range, then use that.
    // Otherwise we will fall back to semver maxSatisfying.
    // This mimics logic in NPM. See issue #3560
    const latestVersion = body['dist-tags'] ? body['dist-tags'].latest : undefined;
    if (latestVersion && semver.satisfies(latestVersion, range)) {
      return body.versions[latestVersion];
    }

    const satisfied = await PackageConstraintResolver.reduce(Object.keys(body.versions), range);
    return satisfied ? body.versions[satisfied] : null;
  }
}
