import type { Course, Assignment, Module, ModuleItem, File, Quiz, Page } from '@/types/canvas';

const BASE_URL = "https://canvas.instructure.com/api/v1";

interface CanvasConfig {
    apiToken: string;
    baseUrl?: string;
}

export class CanvasClient {
    private apiToken: string;
    private baseUrl: string;

    constructor(config: CanvasConfig) {
        this.apiToken = config.apiToken;
        this.baseUrl = config.baseUrl || BASE_URL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Canvas API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    async getCourses(courseId?: string): Promise<Course[] | Course> {
        return this.request<Course[] | Course>(`/courses${courseId ? `/${courseId}` : ''}`);
    }

    async getModules(courseId: string, moduleId?: string): Promise<Module[] | Module> {
        return this.request<Module[] | Module>(`/courses/${courseId}/modules${moduleId ? `/${moduleId}` : ''}`);
    }

    async getAssignments(courseId: string, assignmentId?: string): Promise<Assignment[] | Assignment> {
        return this.request<Assignment[] | Assignment>(`/courses/${courseId}/assignments${assignmentId ? `/${assignmentId}` : ''}`);
    }

    async getFiles(courseId?: string, fileId?: string): Promise<File[] | File> {
        if (fileId) {
            // Single file - doesn't need courseId
            return this.request<File>(`/files/${fileId}`);
        }
        if (courseId) {
            return this.request<File[]>(`/courses/${courseId}/files`);
        }
        throw new Error('Either courseId or fileId must be provided');
    }

    async getQuizzes(courseId: string, quizId?: string): Promise<Quiz[] | Quiz> {
        return this.request<Quiz[] | Quiz>(`/courses/${courseId}/quizzes${quizId ? `/${quizId}` : ''}`);
    }
    
    async getPages(courseId: string, pageId?: string): Promise<Page[] | Page> {
        return this.request<Page[] | Page>(`/courses/${courseId}/pages${pageId ? `/${pageId}` : ''}`);
    }
    
    async getModuleItems(courseId: string, moduleId: string): Promise<ModuleItem[] | ModuleItem> {
        return this.request<ModuleItem[] | ModuleItem>(`/courses/${courseId}/modules/${moduleId}/items`);
    }
}

export function createCanvasClient(apiToken: string, baseUrl?: string): CanvasClient {
    return new CanvasClient({ apiToken, baseUrl });
}

/**
 * Utility function to parse query parameters from a Request object
 * @param req - The incoming HTTP request
 * @returns An object with parsed query parameters
 */
export function readParams(req: Request): Record<string, string | undefined> {
    const url = new URL(req.url);
    const params: Record<string, string | undefined> = {};
    
    // Parse query string parameters
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

