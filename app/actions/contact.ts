"use server"

import { MAX_EMAIL, MAX_MESSAGE, MAX_NAME, TOPICS, TOPIC_LABELS, Topic } from "@/lib/contact"

import { CONTACT_EMAIL } from "@/lib/site"
import { Resend } from "resend"

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
        topic: Topic,
        message: string
    }
}

export async function sendContact(prevState: ContactState, formData: FormData): Promise<ContactState> {
    const website = read(formData, "website")
    
    if (website) return {status: "success"}
    
    const rawTopic = read(formData, "topic")
    
    const topicInUse = isTopic(rawTopic) ? rawTopic : "role"
    
    const values = {
        name: read(formData, "name"),
        email: read(formData, "email"),
        topic: topicInUse,
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
    
    const resultSendEmail = await sendEmail(values)

    if(resultSendEmail.error){
        return {status: "error", values, errors}
    }
        
    return {status: "success"}
}

function read(formData: FormData, key: string): string {
    const value = formData.get(key)
    if(typeof value !== 'string') return ""
    
    return value.trim()
}

function isTopic(value: string): value is Topic {
    return TOPICS.some(topic => topic === value)
}

async function sendEmail(values: NonNullable<ContactState["values"]>){
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const {name, email, topic, message} = values
    
    const { data, error } = await resend.emails.send({
      from: "Elibabah contact form <contact@elibabah.com>",
      to: ["delivered@resend.dev"],
      replyTo: email,
      subject: `${TOPIC_LABELS[topic]} - ${name}`,
      text: [
        `Topic: ${TOPIC_LABELS[topic]}`,
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        message
      ].join("\n"),
    })
    
    return {data, error}
}