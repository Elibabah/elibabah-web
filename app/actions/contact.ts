"use server"

type Field = "name" | "email" | "message"

export type ContactState = {
    status: "idle" | "error" | "success"
    errors?: Partial<Record<Field, string>>
    values?: {
        name: string,
        email: string,
        topic: string,
        message: string
    }
}

export async function sendContact(prevState: ContactState, formData: FormData): Promise<ContactState> {
    const values = {
        name: read(formData, "name"),
        email: read(formData, "email"),
        topic: read(formData, "topic"),
        message: read(formData, "message"),
    }
    
    return {status: "error", values}
}

function read(formData: FormData, key: string): string {
    const value = formData.get(key)
    if(typeof value !== 'string') return ""
    
    return value.trim()
}