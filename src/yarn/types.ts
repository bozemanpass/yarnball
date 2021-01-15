// Source: https://github.com/yarnpkg/yarn/blob/1.22-stable/src/types.js

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

type Dependencies = {
  [key: string]: string,
};

export type Manifest = {
  name: string,
  version: string,

  private?: boolean,

  author?: {
    name?: string,
    email?: string,
    url?: string,
  },

  homepage?: string,
  flat?: boolean,
  license?: string,
  licenseText?: string,
  noticeText?: string,

  readme?: string,
  readmeFilename?: string,

  repository?: {
    type: 'git',
    url: string,
  },

  bugs?: {
    url: string,
  },

  dist?: {
    tarball: string,
    shasum: string,
    unpackedSize?: number
  },

  directories?: {
    man: string,
    bin: string,
  },

  dependencies?: Dependencies,
  devDependencies?: Dependencies,
  peerDependencies?: Dependencies,
  optionalDependencies?: Dependencies,

  man?: Array<string>,

  bin?: {
    [name: string]: string,
  },

  scripts?: {
    [name: string]: string,
  },

  engines?: {
    [engineName: string]: string,
  },

  os?: Array<string>,
  cpu?: Array<string>,

  bundleDependencies?: Array<string>,
  bundledDependencies?: Array<string>,

  installConfig?: {
    pnp?: boolean,
  },

  deprecated?: string,
  files?: Array<string>,
  main?: string,

  // This flag is true when we add a new package with `yarn add <mypackage>`.
  // We need to preserve the flag because we print a list of new packages in
  // the end of the add command
  fresh?: boolean,

  prebuiltVariants?: { [filename: string]: string },
};

export type RegistryResponse = {
  name: string,
  versions: { [key: string]: Manifest },
  'dist-tags': { [key: string]: string },
};
