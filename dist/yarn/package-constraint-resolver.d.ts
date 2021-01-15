export default class PackageConstraintResolver {
    static reduce(versions: Array<string>, range: string): Promise<string | null>;
}
