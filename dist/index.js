"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.deepResolvePackageVersions = exports.resolvePackageVersion = exports.versionCompare = void 0;
const assert_1 = __importDefault(require("assert"));
const npm_registry_1 = __importStar(require("./yarn/npm-registry"));
const npm_resolver_1 = __importDefault(require("./yarn/npm-resolver"));
const semver_1 = __importDefault(require("semver"));
exports.versionCompare = semver_1.default.compare;
const resolvePackageVersion = (name, version = 'latest', registry = npm_registry_1.DEFAULT_REGISTRY, cache) => __awaiter(void 0, void 0, void 0, function* () {
    const json = (cache === null || cache === void 0 ? void 0 : cache.get(name)) || (yield npm_registry_1.default.request(name, registry));
    let match;
    let satisfies = [];
    if (json) {
        match = yield npm_resolver_1.default.findVersionInRegistryResponse(name, version, json);
        if (json.versions) {
            for (const ver of Object.keys(json.versions)) {
                if (semver_1.default.satisfies(ver, version)) {
                    satisfies.push(json.versions[ver]);
                }
            }
        }
    }
    return { name, version, match, satisfies, tags: json ? json['dist-tags'] : {}, versions: json ? json.versions : {} };
});
exports.resolvePackageVersion = resolvePackageVersion;
const deepResolvePackageVersions = (name, version = 'latest', registry = npm_registry_1.DEFAULT_REGISTRY) => __awaiter(void 0, void 0, void 0, function* () {
    const flat = {};
    const cache = new Map();
    const deepResolve = (name, version, parent) => __awaiter(void 0, void 0, void 0, function* () {
        const ret = {
            name,
            requested: version,
            resolved: null,
            dependencies: {},
            tarball: null,
            unpackedSize: 0
        };
        const { match } = yield exports.resolvePackageVersion(name, version, registry, cache);
        if (match) {
            assert_1.default(match && match.dist);
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
                const { name, version } = parent;
                if (!record[match.version].requiredBy.find((item) => item.name == name && item.version == version)) {
                    record[match.version].requiredBy.push({ name, version });
                }
            }
            flat[name] = record;
            ret.resolved = match.version;
            ret.tarball = match.dist.tarball;
            ret.unpackedSize = match.dist.unpackedSize || 0;
            if (match.dependencies) {
                for (const depName of Object.keys(match.dependencies)) {
                    ret.dependencies[depName] = yield deepResolve(depName, match.dependencies[depName], match);
                }
            }
        }
        return ret;
    });
    const tree = yield deepResolve(name, version, undefined);
    return { tree, flat };
});
exports.deepResolvePackageVersions = deepResolvePackageVersions;
