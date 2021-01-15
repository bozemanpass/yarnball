import semver from "semver";
export declare const versionCompare: typeof semver.compare;
export declare const resolvePackageVersion: (name: string, version?: string, registry?: string, cache?: Map<string, any> | undefined) => Promise<{
    name: string;
    version: string;
    match: import("./yarn/types").Manifest | null | undefined;
    satisfies: any[];
    tags: any;
    versions: any;
}>;
export declare const deepResolvePackageVersions: (name: string, version?: string, registry?: string) => Promise<{
    tree: any;
    flat: any;
}>;
