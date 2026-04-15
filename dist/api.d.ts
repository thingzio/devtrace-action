export interface ScoreResponse {
    version: string;
    username: string;
    provider: string;
    score: {
        grade: string;
        value: number;
        categories?: Record<string, number>;
    };
    signals?: Record<string, unknown>;
    risk_summary?: string;
    repo_context?: {
        repo: string;
        commits: number;
        total_commits: number;
        total_contributors: number;
        last_commit_days?: number;
        org_member: boolean;
        commits_verified: boolean;
        author_association?: string;
        trusted_org_member?: boolean;
    };
    behavior?: Record<string, unknown>;
    scored_at: string;
    cached_at?: string;
    detail?: string;
}
export declare class APIError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export interface FetchScoreOpts {
    apiUrl: string;
    token: string;
    repo: string;
    trustedOrgs: string;
}
export declare function fetchScore(username: string, opts: FetchScoreOpts): Promise<ScoreResponse>;
