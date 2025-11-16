export const toolSchemas = [
    {
        toolSpec: {
            name: "get_courses",
            description: "Retrieves all active courses for the user. Use this first to see what courses are available. Returns course IDs, names, codes, and descriptions.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_modules",
            description: "Retrieves all modules for a specific course, including module items (pages, assignments, files, quizzes). Use this to understand the course structure and find available content. Returns modules with their items.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID (obtained from get_courses)"
                        }
                    },
                    required: ["course_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_pages",
            description: "Lists all pages in a course. Use this to see what pages are available before fetching specific page content. Returns page titles and URLs (page slugs).",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        }
                    },
                    required: ["course_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_page_content",
            description: "Fetches the full HTML content of a specific page. Use the page_url (slug) from get_pages or module items. The page_url is a string identifier, not a number.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        },
                        page_url: {
                            type: "string",
                            description: "The page URL slug (e.g., 'syllabus', 'week-1-introduction'). This is a string identifier, not a number. Get this from get_pages or module items."
                        }
                    },
                    required: ["course_id", "page_url"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_assignments",
            description: "Lists all assignments in a course. Use this to see what assignments are available, their due dates, and IDs before fetching specific assignment content.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        }
                    },
                    required: ["course_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_assignment_content",
            description: "Fetches the full content and details of a specific assignment including description, due dates, and requirements. Use assignment_id from get_assignments or module items.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        },
                        assignment_id: {
                            type: "integer",
                            description: "The assignment ID (obtained from get_assignments or module items)"
                        }
                    },
                    required: ["course_id", "assignment_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_quizzes",
            description: "Lists all quizzes in a course. Use this to see what quizzes are available, their types, and IDs before fetching specific quiz content.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        }
                    },
                    required: ["course_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_quiz_content",
            description: "Fetches the full content and details of a specific quiz including description, questions, and quiz type. Use quiz_id from get_quizzes or module items.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        },
                        quiz_id: {
                            type: "integer",
                            description: "The quiz ID (obtained from get_quizzes or module items)"
                        }
                    },
                    required: ["course_id", "quiz_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_files",
            description: "Lists all files in a course. Use this to see what files (PDFs, documents, etc.) are available. Returns file metadata including display names, URLs, and content types.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "The Canvas course ID"
                        }
                    },
                    required: ["course_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "generate_study_pack",
            description: "Generates study materials from retrieved content. Use this after gathering course content (pages, assignments, quizzes) to create study guides, summaries, flashcards, or other study aids.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "The study material content to process (can be combined content from multiple sources)"
                        },
                        material_type: {
                            type: "string",
                            enum: ["page", "assignment", "quiz", "combined"],
                            description: "The type of material: 'page' for course pages, 'assignment' for assignments, 'quiz' for quizzes, or 'combined' for multiple sources"
                        }
                    },
                    required: ["content", "material_type"]
                }
            }
        }
    }
]