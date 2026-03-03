import { Optional } from '@work-tools/ts';
import { TimeoutError } from './timeout.error.js';

export async function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
    let t: Optional<NodeJS.Timeout>;
    
    const timeoutPromise = new Promise<never>((_, rej) => {
        t = setTimeout(() => rej(new TimeoutError(label)), ms);
    });

    try {
        return await Promise.race([p, timeoutPromise]);
    } finally {
        if (t) {
            clearTimeout(t);
        }
    }
}
