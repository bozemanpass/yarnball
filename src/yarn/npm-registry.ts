// Source: https://github.com/yarnpkg/yarn/blob/1.22-stable/src/registries/npm-registry.js

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

// TEL 20210105: Replace 'request' with 'fetch' for easy use in the browser.
import fetch from 'cross-fetch';

// TEL 20210105: Use the CloudFlare registry by default, since it supports CORS.
export const DEFAULT_REGISTRY = 'https://registry.npmjs.cf';

export const SCOPE_SEPARATOR = '%2f';
// All scoped package names are of the format `@scope%2fpkg` from the use of NpmRegistry.escapeName
// `(?:^|\/)` Match either the start of the string or a `/` but don't capture
// `[^\/?]+?` Match any character that is not '/' or '?' and capture, up until the first occurrence of:
// `(?=%2f|\/)` Match SCOPE_SEPARATOR, the escaped '/', or a raw `/` and don't capture
// The reason for matching a plain `/` is NPM registry being inconsistent about escaping `/` in
// scoped package names: when you're fetching a tarball, it is not escaped, when you want info
// about the package, it is escaped.

export default class NpmRegistry {
  static escapeName(name: string): string {
    // scoped packages contain slashes and the npm registry expects them to be escaped
    return name.replace('/', SCOPE_SEPARATOR);
  }

  static async request(name: string, registry = DEFAULT_REGISTRY) {
    const requestUrl = `${registry}/${NpmRegistry.escapeName(name)}`;

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {'Accept': 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'}
    });

    if (!response.ok) {
      if (response.status == 404) {
        return null;
      }
      throw new Error('HTTP request failed.');
    }

    return response.json();
  }
}
