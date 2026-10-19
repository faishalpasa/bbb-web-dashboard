import type { AdminSession } from '@/types/auth';

export const SESSION_MAX_AGE_MS = 60_000;

// One in-flight request, a bounded cache, and a generation check so logout wins over late responses.
export class SessionCache {
    private value: AdminSession | null = null;
    private hasValue = false;
    private updatedAt = 0;
    private revision = 0;
    private pending: Promise<AdminSession | null> | null = null;

    constructor(
        private readonly fetcher: () => Promise<AdminSession | null>,
        private readonly now = Date.now,
    ) {}

    replace(session: AdminSession | null) {
        this.revision++;
        this.value = session;
        this.hasValue = true;
        this.updatedAt = this.now();
    }

    get(force = false): Promise<AdminSession | null> {
        if (this.pending) return this.pending;
        if (!force && this.hasValue && this.now() - this.updatedAt < SESSION_MAX_AGE_MS) return Promise.resolve(this.value);
        const revision = this.revision;
        const pending = this.fetcher()
            .then((session) => {
                if (this.revision === revision) this.replace(session);
                return this.value;
            })
            .finally(() => {
                if (this.pending === pending) this.pending = null;
            });
        this.pending = pending;
        return pending;
    }
}
