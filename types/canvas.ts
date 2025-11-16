export interface Course { 
    id: number; 
    name: string; 
    description: string;
    start_at: string | null;
    end_at: string | null;
    created_at: string;
    updated_at: string;
    course_code: string;
}

export interface Assignment { 
    id: number; 
    name: string; 
    description: string | null;
    due_at: string | null;
    unlock_at: string | null;
    lock_at: string | null;
    course_id: number;
    moduleItemId?: string;
}

export interface Module { 
    id: number; 
    name: string; 
    position: number;
    items_count: number;
    items_url: string;
    items: ModuleItem[];
    course_id: number;
}

export interface ModuleItem { 
    id: number; 
    module_id: number;
    position: number;
    title: string;
    type: 'File' | 'Page' | 'Discussion' | 'Assignment' | 'Quiz' | 'ExternalUrl' | 'ExternalTool' | 'SubHeader';
    content_id: number | null;
    html_url: string;
    external_url?: string;
    page_url?: string;
}

export interface File { 
    id: number; 
    display_name: string;
    filename: string;
    url: string;
    content_type: string;
    size: number;
    created_at: string;
    updated_at: string;
    folder_id: number | null;
    moduleItemId?: string;
}

export interface Quiz { 
    id: number; 
    title: string; 
    description: string | null;
    quiz_type: 'practice_quiz' | 'assignment' | 'graded_survey' | 'survey';
    due_at: string | null;
    course_id: number;
    moduleItemId?: string;
}

export interface Page {
    page_id: number;
    title: string;
    body: string;
    url: string;
    created_at: string;
    updated_at: string;
    moduleItemId?: string;
}