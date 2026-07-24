import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AnalyzeScriptBody, AnalyzeTitlesBody, DashboardStats, FetchVideosBody, FetchVideosResponse, GenerateScriptBody, GenerateScriptResponse, GenerateTitlesBody, GenerateTitlesResponse, GeneratedScriptListResponse, GetVideosParams, HealthStatus, ScriptAnalysisListResponse, ScriptAnalysisResponse, TitleAnalysisListResponse, TitleAnalysisResponse, VideoListResponse } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Fetch latest videos from competitor channels
 */
export declare const getFetchCompetitorVideosUrl: () => string;
export declare const fetchCompetitorVideos: (fetchVideosBody: FetchVideosBody, options?: RequestInit) => Promise<FetchVideosResponse>;
export declare const getFetchCompetitorVideosMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchCompetitorVideos>>, TError, {
        data: BodyType<FetchVideosBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof fetchCompetitorVideos>>, TError, {
    data: BodyType<FetchVideosBody>;
}, TContext>;
export type FetchCompetitorVideosMutationResult = NonNullable<Awaited<ReturnType<typeof fetchCompetitorVideos>>>;
export type FetchCompetitorVideosMutationBody = BodyType<FetchVideosBody>;
export type FetchCompetitorVideosMutationError = ErrorType<unknown>;
/**
 * @summary Fetch latest videos from competitor channels
 */
export declare const useFetchCompetitorVideos: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof fetchCompetitorVideos>>, TError, {
        data: BodyType<FetchVideosBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof fetchCompetitorVideos>>, TError, {
    data: BodyType<FetchVideosBody>;
}, TContext>;
/**
 * @summary Get all saved competitor videos
 */
export declare const getGetVideosUrl: (params?: GetVideosParams) => string;
export declare const getVideos: (params?: GetVideosParams, options?: RequestInit) => Promise<VideoListResponse>;
export declare const getGetVideosQueryKey: (params?: GetVideosParams) => readonly ["/api/videos", ...GetVideosParams[]];
export declare const getGetVideosQueryOptions: <TData = Awaited<ReturnType<typeof getVideos>>, TError = ErrorType<unknown>>(params?: GetVideosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetVideosQueryResult = NonNullable<Awaited<ReturnType<typeof getVideos>>>;
export type GetVideosQueryError = ErrorType<unknown>;
/**
 * @summary Get all saved competitor videos
 */
export declare function useGetVideos<TData = Awaited<ReturnType<typeof getVideos>>, TError = ErrorType<unknown>>(params?: GetVideosParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Analyze competitor titles with AI
 */
export declare const getAnalyzeTitlesUrl: () => string;
export declare const analyzeTitles: (analyzeTitlesBody: AnalyzeTitlesBody, options?: RequestInit) => Promise<TitleAnalysisResponse>;
export declare const getAnalyzeTitlesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeTitles>>, TError, {
        data: BodyType<AnalyzeTitlesBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzeTitles>>, TError, {
    data: BodyType<AnalyzeTitlesBody>;
}, TContext>;
export type AnalyzeTitlesMutationResult = NonNullable<Awaited<ReturnType<typeof analyzeTitles>>>;
export type AnalyzeTitlesMutationBody = BodyType<AnalyzeTitlesBody>;
export type AnalyzeTitlesMutationError = ErrorType<unknown>;
/**
 * @summary Analyze competitor titles with AI
 */
export declare const useAnalyzeTitles: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeTitles>>, TError, {
        data: BodyType<AnalyzeTitlesBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzeTitles>>, TError, {
    data: BodyType<AnalyzeTitlesBody>;
}, TContext>;
/**
 * @summary Generate viral titles based on analysis
 */
export declare const getGenerateTitlesUrl: () => string;
export declare const generateTitles: (generateTitlesBody: GenerateTitlesBody, options?: RequestInit) => Promise<GenerateTitlesResponse>;
export declare const getGenerateTitlesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateTitles>>, TError, {
        data: BodyType<GenerateTitlesBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateTitles>>, TError, {
    data: BodyType<GenerateTitlesBody>;
}, TContext>;
export type GenerateTitlesMutationResult = NonNullable<Awaited<ReturnType<typeof generateTitles>>>;
export type GenerateTitlesMutationBody = BodyType<GenerateTitlesBody>;
export type GenerateTitlesMutationError = ErrorType<unknown>;
/**
 * @summary Generate viral titles based on analysis
 */
export declare const useGenerateTitles: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateTitles>>, TError, {
        data: BodyType<GenerateTitlesBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateTitles>>, TError, {
    data: BodyType<GenerateTitlesBody>;
}, TContext>;
/**
 * @summary Analyze a competitor script with AI
 */
export declare const getAnalyzeScriptUrl: () => string;
export declare const analyzeScript: (analyzeScriptBody: AnalyzeScriptBody, options?: RequestInit) => Promise<ScriptAnalysisResponse>;
export declare const getAnalyzeScriptMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeScript>>, TError, {
        data: BodyType<AnalyzeScriptBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzeScript>>, TError, {
    data: BodyType<AnalyzeScriptBody>;
}, TContext>;
export type AnalyzeScriptMutationResult = NonNullable<Awaited<ReturnType<typeof analyzeScript>>>;
export type AnalyzeScriptMutationBody = BodyType<AnalyzeScriptBody>;
export type AnalyzeScriptMutationError = ErrorType<unknown>;
/**
 * @summary Analyze a competitor script with AI
 */
export declare const useAnalyzeScript: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeScript>>, TError, {
        data: BodyType<AnalyzeScriptBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzeScript>>, TError, {
    data: BodyType<AnalyzeScriptBody>;
}, TContext>;
/**
 * @summary Generate a full YouTube script
 */
export declare const getGenerateScriptUrl: () => string;
export declare const generateScript: (generateScriptBody: GenerateScriptBody, options?: RequestInit) => Promise<GenerateScriptResponse>;
export declare const getGenerateScriptMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateScript>>, TError, {
        data: BodyType<GenerateScriptBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateScript>>, TError, {
    data: BodyType<GenerateScriptBody>;
}, TContext>;
export type GenerateScriptMutationResult = NonNullable<Awaited<ReturnType<typeof generateScript>>>;
export type GenerateScriptMutationBody = BodyType<GenerateScriptBody>;
export type GenerateScriptMutationError = ErrorType<unknown>;
/**
 * @summary Generate a full YouTube script
 */
export declare const useGenerateScript: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateScript>>, TError, {
        data: BodyType<GenerateScriptBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateScript>>, TError, {
    data: BodyType<GenerateScriptBody>;
}, TContext>;
/**
 * @summary Get saved title analyses
 */
export declare const getGetTitleAnalysesUrl: () => string;
export declare const getTitleAnalyses: (options?: RequestInit) => Promise<TitleAnalysisListResponse>;
export declare const getGetTitleAnalysesQueryKey: () => readonly ["/api/history/title-analyses"];
export declare const getGetTitleAnalysesQueryOptions: <TData = Awaited<ReturnType<typeof getTitleAnalyses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTitleAnalyses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTitleAnalyses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTitleAnalysesQueryResult = NonNullable<Awaited<ReturnType<typeof getTitleAnalyses>>>;
export type GetTitleAnalysesQueryError = ErrorType<unknown>;
/**
 * @summary Get saved title analyses
 */
export declare function useGetTitleAnalyses<TData = Awaited<ReturnType<typeof getTitleAnalyses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTitleAnalyses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get saved script analyses
 */
export declare const getGetScriptAnalysesUrl: () => string;
export declare const getScriptAnalyses: (options?: RequestInit) => Promise<ScriptAnalysisListResponse>;
export declare const getGetScriptAnalysesQueryKey: () => readonly ["/api/history/script-analyses"];
export declare const getGetScriptAnalysesQueryOptions: <TData = Awaited<ReturnType<typeof getScriptAnalyses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getScriptAnalyses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getScriptAnalyses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetScriptAnalysesQueryResult = NonNullable<Awaited<ReturnType<typeof getScriptAnalyses>>>;
export type GetScriptAnalysesQueryError = ErrorType<unknown>;
/**
 * @summary Get saved script analyses
 */
export declare function useGetScriptAnalyses<TData = Awaited<ReturnType<typeof getScriptAnalyses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getScriptAnalyses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get saved generated scripts
 */
export declare const getGetGeneratedScriptsUrl: () => string;
export declare const getGeneratedScripts: (options?: RequestInit) => Promise<GeneratedScriptListResponse>;
export declare const getGetGeneratedScriptsQueryKey: () => readonly ["/api/history/generated-scripts"];
export declare const getGetGeneratedScriptsQueryOptions: <TData = Awaited<ReturnType<typeof getGeneratedScripts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGeneratedScripts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGeneratedScripts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGeneratedScriptsQueryResult = NonNullable<Awaited<ReturnType<typeof getGeneratedScripts>>>;
export type GetGeneratedScriptsQueryError = ErrorType<unknown>;
/**
 * @summary Get saved generated scripts
 */
export declare function useGetGeneratedScripts<TData = Awaited<ReturnType<typeof getGeneratedScripts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGeneratedScripts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard summary stats
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/stats/dashboard"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary stats
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map