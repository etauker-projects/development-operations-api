/**
 * Class for extracting values from environment variables.
 */
export class Extractor {

    public static extractBoolean(name: string, fallback?: boolean): boolean {
        // eslint-disable-next-line no-process-env
        // eslint-disable-next-line no-process-env
        const value = process.env[name];
        if (value?.toLowerCase() === 'true') {
            return true;
        } else if (value?.toLowerCase() === 'false') {
            return false;
        } else if (fallback !== undefined) {
            return fallback;
        } else {
            throw new Error(`Environment variable '${ name }' not set`);
        }
    }

    public static extractNumber(name: string, fallback?: number): number {
        // eslint-disable-next-line no-process-env
        const value = process.env[name];
        const isNumber = !isNaN(value as any);
        if (isNumber) {
            return parseInt(value);
        } else if (fallback !== undefined) {
            return fallback;
        } else {
            throw new Error(`Environment variable '${ name }' not set`);
        }
    }

    public static extractString(name: string, fallback?: string): string {
        // eslint-disable-next-line no-process-env
        const value = process.env[name];
        if (value) {
            return value;
        } else if (fallback !== undefined) {
            return fallback;
        } else {
            throw new Error(`Environment variable '${ name }' not set`);
        }
    }

    public static extractEnum(
        name: string,
        options: string[],
        fallback?: string,
    ): string {

        // eslint-disable-next-line no-process-env
        const value = process.env[name]?.toUpperCase();
        if (value && options.includes(value)) {
            return value;
        } else if (fallback !== undefined) {
            return fallback;
        } else {
            throw new Error(`Environment variable '${ name }' not set`);
        }

    }
}