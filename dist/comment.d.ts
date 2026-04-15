import { ScoreResponse } from './api';
export declare const COMMENT_MARKER = "<!-- devtrace-score -->";
export interface AuthorResult {
    username: string;
    response?: ScoreResponse;
    error?: string;
}
export declare function formatComment(results: AuthorResult[], apiUrl: string): string;
