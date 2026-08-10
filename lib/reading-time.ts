export function readingTimeOf(content: string): number{
    const prose = content.replace(/```[\s\S]*?```/g, " ");
    const words = prose.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t));
    return Math.max(1, Math.ceil(words.length / 200));
}
