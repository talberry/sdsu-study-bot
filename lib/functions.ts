export const toolSchemas = [
    {
        toolSpec: {
            name: "get_courses",
            description: "lists all of the user's courses",
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
            description: "get a course's modules",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "the course id"
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
            description: "fetch a page's HTML",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "the course id"
                        },
                        page_id: {
                            type: "integer",
                            description: "the page id"
                        }
                    },
                    required: ["course_id", "page_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_assignment_content",
            description: "fetch the content of a specific assignment",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        course_id: {
                            type: "integer",
                            description: "the course id"
                        },
                        assignment_id: {
                            type: "integer",
                            description: "the assignment id"
                        }
                    },
                    required: ["course_id", "assignment_id"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "generate_study_pack",
            description: "generate study materials",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "study material"
                        },
                        material_type: {
                            type: "string",
                            enum: ["page", "assignment"],
                            description: "whether the content is a page or an assignment"
                        }
                    },
                    required: ["content", "material_type"]
                }
            }
        }
    },
    {
        name: "generate_study_guide",
        description:
            "Create a structured study guide from Canvas course content. Include title, key topics, what to review, and 3–5 practice prompts.",
        inputSchema: {
            type: "object",
            properties: {
                course_id: { type: "string", description: "Canvas course ID" },
                token: { type: "string", description: "Canvas API access token" },
            },
            required: ["course_id", "token"],
        },
    }
]