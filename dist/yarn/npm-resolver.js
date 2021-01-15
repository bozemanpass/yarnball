"use strict";
// Source: https://github.com/yarnpkg/yarn/blob/1.22-stable/src/resolvers/registries/npm-resolver.js
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const semver_1 = __importDefault(require("semver"));
const package_constraint_resolver_1 = __importDefault(require("./package-constraint-resolver"));
class NpmResolver {
    static findVersionInRegistryResponse(name, range, body) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (latestVersion && semver_1.default.satisfies(latestVersion, range)) {
                return body.versions[latestVersion];
            }
            const satisfied = yield package_constraint_resolver_1.default.reduce(Object.keys(body.versions), range);
            return satisfied ? body.versions[satisfied] : null;
        });
    }
}
exports.default = NpmResolver;
