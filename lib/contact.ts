export const MAX_NAME = 100
export const MAX_EMAIL = 254
export const MAX_MESSAGE = 2000

export const TOPICS = ["role", "project", "hello"] as const

export type Topic = (typeof TOPICS)[number]

export const TOPIC_LABELS: Record<Topic, string> = {
    role: "A role",
    project: "A project",
    hello: "Just saying hi"
}
