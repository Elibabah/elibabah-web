export const SITE_URL = "https://elibabah.com"
export const CV_PATH = "/cv"
export const CV_PDF_PATH = "/cv.pdf"
export const CV_PDF_FILENAME = "Elias-Hernandez-CV-Frontend-Software-Engineer.pdf"
export const LINKEDIN_URL = "https://www.linkedin.com/in/david-elias-hernandez-morales/"
export const GITHUB_URL = "https://github.com/elibabah"
export const CONTACT_EMAIL = "elias@elibabah.com"

export const displayUrl = (url: string) => {
  const { host, pathname } = new URL(url)
  return (host + pathname).replace(/^www\./, "").replace(/\/$/, "")
}
