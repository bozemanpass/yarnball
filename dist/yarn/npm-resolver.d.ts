import { Manifest, RegistryResponse } from "./types";
export default class NpmResolver {
    static findVersionInRegistryResponse(name: string, range: string, body: RegistryResponse): Promise<Manifest | null>;
}
