export interface ScoreResponse {
    version: string;
    username: string;
    provider: string;
    profile?: {
        name?: string;
        avatar_url?: string;
        company?: string;
        location?: string;
        bio?: string;
    };
    score: {
        grade: string;
        value: number;
        categories?: Record<string, number>;
    };
    signals?: {
        account_age_days: number;
        followers: number;
        following: number;
        public_repos: number;
        forked_repos: number;
        prs_merged: number;
        prs_closed: number;
        recent_pr_repo_count: number;
        has_bio: boolean;
        has_company: boolean;
        has_location: boolean;
        has_website: boolean;
        has_public_email: boolean;
        suspended: boolean;
    };
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
    license?: {
        total_repos_with_merged_prs: number;
        own_repos: number;
        distribution: {
            license: string;
            count: number;
            own: number;
            contributed: number;
        }[];
    };
    ai_sensing?: {
        co_authored_commits: number;
        bot_associated_prs: number;
        known_tool_signatures: string[];
        total_commits_analyzed: number;
        ai_associated_ratio: number;
        pr_authenticity?: {
            classification: string;
            confidence: number;
            reasoning: string;
        };
        behavioral?: {
            velocity_anomaly_ratio: number;
            active_hour_spread: number;
            burst_vanish_score: number;
            synthetic_risk_flags: number;
            synthetic_risk_details: string[];
        };
    };
    behavior?: Record<string, unknown>;
    scoring_mode: string;
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
