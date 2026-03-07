import type { Types } from 'mongoose';

export type LogEntity = {
    country: string | null;
    isMak: boolean;
    file: Types.ObjectId;
    archivePath: string;
    soft: string[];
    wallets: string[];
    passCounts: number;
    analyzeResult: string[];
    category: string | null;
    three: unknown;
    inUser: number | null;
};
