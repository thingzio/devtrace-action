import { AuthorResult } from './comment';
export interface CheckResult {
    conclusion: 'success' | 'failure' | 'neutral';
    title: string;
    summary: string;
}
export declare function evaluateThreshold(results: AuthorResult[], minScore: number): CheckResult;
