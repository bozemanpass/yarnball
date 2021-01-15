export declare const DEFAULT_REGISTRY = "https://registry.npmjs.cf";
export declare const SCOPE_SEPARATOR = "%2f";
export default class NpmRegistry {
    static escapeName(name: string): string;
    static request(name: string, registry?: string): Promise<any>;
}
