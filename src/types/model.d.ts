interface ProgressItem {
    total: number;
    loaded: number;
    file: string;
    progress: number;
    name: string;
    status: string;
}

export type { ProgressItem };