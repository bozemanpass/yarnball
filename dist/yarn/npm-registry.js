"use strict";
// Source: https://github.com/yarnpkg/yarn/blob/1.22-stable/src/registries/npm-registry.js
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
exports.SCOPE_SEPARATOR = exports.DEFAULT_REGISTRY = void 0;
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
const cross_fetch_1 = __importDefault(require("cross-fetch"));
// TEL 20210105: Use the CloudFlare registry by default, since it supports CORS.
exports.DEFAULT_REGISTRY = 'https://registry.npmjs.cf';
exports.SCOPE_SEPARATOR = '%2f';
// All scoped package names are of the format `@scope%2fpkg` from the use of NpmRegistry.escapeName
// `(?:^|\/)` Match either the start of the string or a `/` but don't capture
// `[^\/?]+?` Match any character that is not '/' or '?' and capture, up until the first occurrence of:
// `(?=%2f|\/)` Match SCOPE_SEPARATOR, the escaped '/', or a raw `/` and don't capture
// The reason for matching a plain `/` is NPM registry being inconsistent about escaping `/` in
// scoped package names: when you're fetching a tarball, it is not escaped, when you want info
// about the package, it is escaped.
class NpmRegistry {
    static escapeName(name) {
        // scoped packages contain slashes and the npm registry expects them to be escaped
        return name.replace('/', exports.SCOPE_SEPARATOR);
    }
    static request(name, registry = exports.DEFAULT_REGISTRY) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUrl = `${registry}/${NpmRegistry.escapeName(name)}`;
            const response = yield cross_fetch_1.default(requestUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*' }
            });
            if (!response.ok) {
                if (response.status == 404) {
                    return null;
                }
                throw new Error('HTTP request failed.');
            }
            return response.json();
        });
    }
}
exports.default = NpmRegistry;
