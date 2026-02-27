import { Optional } from '@work-tools/ts';

export async function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
    let t: Optional<NodeJS.Timeout>;
    try {
        return await Promise.race([
            p,
            new Promise<T>((_, rej) => {
                t = setTimeout(() => rej(new Error(label)), ms);
            }),
        ]);
    } finally {
        if (t) clearTimeout(t);
    }
}
