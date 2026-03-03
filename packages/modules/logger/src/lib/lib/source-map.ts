export function enableSourceMapSupport() {
    Error.stackTraceLimit = 100;

    try {
        const processWithSourceMaps = process as typeof process & {
            setSourceMapsEnabled?: (enabled: boolean) => void;
        };

        processWithSourceMaps.setSourceMapsEnabled?.(true);
    } catch {
        // noop
    }
}
