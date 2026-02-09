/**
 * Fallback Service (STUBBED)
 * 
 * Feature removed in favor of Strict Single Model Policy.
 * Kept to satisfy legacy imports.
 */

export function logFallbackEvent(...args: any[]): void {
    // No-op
}

export function determineFallbackReason(error: any): string {
    return 'Unknown';
}

export function getModelReliabilityMetrics(): any {
    return {};
}
