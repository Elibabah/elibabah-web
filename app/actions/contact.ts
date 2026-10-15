"use server"

import { MAX_EMAIL, MAX_MESSAGE, MAX_NAME } from '@/lib/contact'

type Field = "name" | "email" | "message"

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const errorsCopies = {
    tooLarge: (max: number) => `Keep it under ${max} characters`,
    missingName: "Add your name so I know who I'm replying to",
    missingEmail: "Add your email so I know where to reply",
    wrongEmail: "Enter a full email address, like jane@company.co.nz",
    missingMessage: "Write a message so I know what it's about",
}

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
    const website = read(formData, "website")
    
    if (website) return {status: "success"}
    
    const values = {
        name: read(formData, "name"),
        email: read(formData, "email"),
        topic: read(formData, "topic"),
        message: read(formData, "message"),
    }

    const errors: ContactState["errors"] = {}
    
    if(!values.name) {
        errors.name = errorsCopies.missingName
    } else if( values.name.length > MAX_NAME) {
        errors.name = errorsCopies.tooLarge(MAX_NAME)
    }
    
    if(!values.email) {
        errors.email = errorsCopies.missingEmail
    } else if(!regexEmail.test(values.email) || values.email.length > MAX_EMAIL){
        errors.email = errorsCopies.wrongEmail
    }
    
    if(!values.message) {
        errors.message = errorsCopies.missingMessage
    } else if(values.message.length > MAX_MESSAGE){
        errors.message = errorsCopies.tooLarge(MAX_MESSAGE)
    }
    
    const hasErrors = Object.keys(errors).length > 0

    if(hasErrors) return {status: "error", values, errors}

    return {status: "success"}
}

function read(formData: FormData, key: string): string {
    const value = formData.get(key)
    if(typeof value !== 'string') return ""
    
    return value.trim()
}