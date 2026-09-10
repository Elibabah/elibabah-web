import { CV_PATH, CV_PDF_PATH, SITE_URL } from "@/lib/site";

import type { Metadata } from "next";
import styles from "./cv.module.css";

export const metadata: Metadata = {
  title: "CV — Elías Hernández",
  description:
    "Elías Hernández, front-end engineer in New Zealand. Four years building customer-facing journeys for banking and retail. Full CV and PDF download.",
  alternates: { canonical: `${SITE_URL}${CV_PATH}` },
  openGraph: {
    title: "CV — Elías Hernández",
    description:
      "Front-end engineer in New Zealand. Four years building customer-facing journeys for banking and retail.",
    url: `${SITE_URL}${CV_PATH}`,
    type: "profile",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#elias`,
  jobTitle: "Frontend Software Engineer",
  email: "mailto:elias@elibabah.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Invercargill",
    addressRegion: "Southland",
    addressCountry: "NZ",
  },
  worksFor: { "@type": "Organization", name: "BBVA" },
  alumniOf: [
    {
      "@type": "EducationalOrganization",
      name: "Southern Institute of Technology, Te Pūkenga",
    },
    {
      "@type": "EducationalOrganization",
      name: "National Autonomous University of Mexico",
    },
  ],
  knowsLanguage: [
    { "@type": "Language", name: "English" },
    { "@type": "Language", name: "Spanish" },
  ],
  knowsAbout: [
    "TypeScript",
    "JavaScript",
    "Web Components",
    "Lit",
    "React",
    "React Native",
    "Design systems",
    "Web accessibility",
  ],
};

/** A dated entry: heading and meta on the left, detail on the right at wide widths. */
function Entry({
  title,
  subtitle,
  meta,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}>) {
  return (
    <article className={styles.entry}>
      <header className={styles.entryHead}>
        <h3 className={styles.entryTitle}>{title}</h3>
        {subtitle ? <p className={styles.entrySubtitle}>{subtitle}</p> : null}
        {meta ? <p className={styles.entryMeta}>{meta}</p> : null}
      </header>
      <div className={styles.entryBody}>{children}</div>
    </article>
  );
}

export default function CvPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className={styles.page}>
        <header className={styles.masthead}>
          <h1 className={styles.name}>Elías Hernández</h1>
          <p className={styles.role}>Frontend Software Engineer</p>
          <p className={styles.where}>
            Invercargill, New Zealand. Open to relocation nationwide.
          </p>
          <p className={styles.status}>
            Legally entitled to work full-time in New Zealand.
          </p>
          <p className={styles.links}>
            <a href="mailto:elias@elibabah.com">elias@elibabah.com</a>{" "}
            <a href="https://www.linkedin.com/in/elibabah/" rel="me">
              LinkedIn
            </a>{" "}
            <a href="https://github.com/Elibabah" rel="me">
              GitHub
            </a>{" "}
            <a href={CV_PDF_PATH} className={styles.download} data-print="hide">
              Download as PDF
            </a>
          </p>
        </header>

        <section className={styles.section} aria-labelledby="profile">
          <h2 className={styles.sectionTitle} id="profile">
            Profile
          </h2>
          <div className={styles.sectionBody}>
            <p>
              Front-end engineer with over four years in production, building
              customer-facing journeys for banking and retail at enterprise
              scale. At BBVA I own flows end to end, from Figma handoff through
              business logic, testing and staged release, working to a regulated
              bank’s quality gates and accessibility requirements. Currently
              completing a Master of Applied Management in New Zealand,
              researching how AI is changing software engineering practice.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="skills">
          <h2 className={styles.sectionTitle} id="skills">
            Skills
          </h2>
          <div className={styles.sectionBody}>
            <dl className={styles.skills}>
              <dt>Core</dt>
              <dd>
                JavaScript (ES6+), TypeScript, Web Components, Lit, HTML5, CSS3,
                Sass
              </dd>
              <dt>Architecture</dt>
              <dd>
                Component-based architecture, atomic design, design system
                consumption and extension, responsive design, accessibility
              </dd>
              <dt>Also worked with</dt>
              <dd>
                React, React Native, Angular, Tailwind CSS, Bootstrap, Firebase,
                Supabase
              </dd>
              <dt>Testing and quality</dt>
              <dd>
                Unit, end-to-end and accessibility testing, Jest, WebdriverIO,
                SonarQube quality gates
              </dd>
              <dt>Delivery</dt>
              <dd>
                Git, Bitbucket, GitHub, GitLab, Jira, Jenkins, CI/CD, feature
                flags, analytics tagging, technical documentation
              </dd>
              <dt>Ways of working</dt>
              <dd>
                Agile, Scrum, sprint planning, user stories, backlog management,
                cross-functional collaboration
              </dd>
            </dl>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="experience">
          <h2 className={styles.sectionTitle} id="experience">
            Professional experience
          </h2>
          <div className={styles.sectionBody}>
            <Entry
              title="BBVA"
              subtitle="Frontend Software Engineer"
              meta={
                <>
                  Remote from New Zealand.{" "}
                  <time dateTime="2023-10">October 2023</time> to present.
                </>
              }
            >
              <p className={styles.context}>
                BBVA is a global bank operating in more than 25 countries with
                over 80 million active customers. BBVA Mexico is the country’s
                largest financial institution, serving 27 million digital
                customers through its mobile app. Design, engineering standards,
                regulatory requirements and technology are governed centrally
                from Spain.
              </p>
              <ul>
                <li>
                  Deliver customer journeys end to end for the retail banking
                  app: Figma handoff, composition from the bank’s component
                  catalogue, business logic built from scratch, service
                  integration, demos, unit and accessibility testing, functional
                  and analytics end-to-end testing, CI/CD, documentation and
                  production troubleshooting.
                </li>
                <li>
                  Compose each journey from 20 to 30 catalogue components
                  following atomic design, extending non-atomic components such
                  as lists through their public property and event APIs where
                  the design calls for behaviour the catalogue does not provide.
                </li>
                <li>
                  Meet a SonarQube quality gate of 85% unit coverage in the
                  Jenkins pipeline, with reviewers holding pull requests to
                  roughly 90% across all scenarios rather than overall, branch
                  coverage being the demanding part. End-to-end coverage is
                  measured against acceptance documents written by the product
                  owner with the business.
                </li>
                <li>
                  Contributed to the group-wide migration of the Mexican app to
                  a new stack and design language, directed from Spain, in teams
                  ranging from 2 to 15 front-end developers. Rebuilt the payroll
                  upgrade journey with a reduced step count, and migrated the
                  Buy Now Pay Later journey.
                </li>
                <li>
                  Built the address module on the new stack, letting customers
                  upload proof of address in-app to update their identity data,
                  and am currently completing Pay by Bank, which lets customers
                  pay third-party merchants from deeplinks and push
                  notifications.
                </li>
                <li>
                  Work to a monthly release train on two-week sprints, with
                  journeys typically taking 6 to 12 months from architecture to
                  release depending on dependencies. Own each journey for six
                  months after release, through feature-flag rollout by
                  percentage, before handover to the central maintenance team.
                </li>
              </ul>
            </Entry>

            <Entry
              title="Sngular"
              subtitle="Frontend Developer, client: BBVA Mexico"
              meta={
                <>
                  Mexico. <time dateTime="2022-10">October 2022</time> to{" "}
                  <time dateTime="2023-10">October 2023</time>.
                </>
              }
            >
              <p className={styles.context}>
                Spanish technology consultancy. Placed with BBVA Mexico for the
                full engagement, and offered a direct role by the client at the
                end of it.
              </p>
              <ul>
                <li>
                  Built the payroll account upgrade journey (account tier N2 to
                  N4) from scratch as one of two front-end developers, spanning
                  around 15 screens including error scenarios. Upgrading
                  customers to a complete profile made them eligible for credit
                  and other products, so the journey carried direct commercial
                  weight.
                </li>
                <li>
                  Designed the flow as independent modules that reused existing
                  back-end services without modifying them, since those services
                  were shared and locked. The modular boundaries had to absorb
                  the constraint instead of the services adapting to the flow.
                </li>
              </ul>
            </Entry>

            <Entry
              title="Innovattia"
              subtitle="React Developer, client: Walmart Mexico"
              meta={
                <>
                  Mexico. <time dateTime="2022-04">April 2022</time> to{" "}
                  <time dateTime="2022-10">October 2022</time>.
                </>
              }
            >
              <ul>
                <li>
                  Developed responsive web and mobile interfaces in React for
                  Walmart Mexico’s health services and mobile telecommunications
                  products, building reusable components and integrating
                  back-end APIs.
                </li>
                <li>
                  Led a small front-end team, coordinating implementation and
                  unblocking delivery across releases. First professional role.
                </li>
              </ul>
            </Entry>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="work">
          <h2 className={styles.sectionTitle} id="work">
            Selected work
          </h2>
          <div className={styles.sectionBody}>
            <Entry
              title="NZ Drive Practice"
              subtitle="React Native, TypeScript, Supabase"
              meta={
                <a href="https://github.com/Elibabah/nz-drive-test">
                  github.com/Elibabah/nz-drive-test
                </a>
              }
            >
              <p>
                Mobile app for practising the New Zealand practical driving
                test, built solo. The exam logic is a pure, dependency-free
                TypeScript engine with no framework, globals or clocks, so
                sessions replay deterministically and are covered by 254 tests;
                React Native sits behind an adapter layer as the only code that
                touches the outside world. Scoring is modelled on official NZTA
                error categories, session state is checkpointed to Supabase, and
                no provider keys ship in the app: AI and speech calls are
                proxied through an authenticated Supabase Edge Function.
                Architecture decisions are recorded as ADRs in the repository.
                In development, not yet published.
              </p>
            </Entry>

            <Entry
              title="elibabah.com"
              subtitle="Personal site and design system"
              meta={<a href="https://elibabah.com">elibabah.com</a>}
            >
              <p>
                Portfolio and writing platform built and maintained by me,
                including a component system of my own design, covering
                front-end, content and deployment.
              </p>
            </Entry>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="education">
          <h2 className={styles.sectionTitle} id="education">
            Education
          </h2>
          <div className={styles.sectionBody}>
            <Entry
              title="Southern Institute of Technology, Te Pūkenga"
              subtitle="Master of Applied Management (NZQF Level 9)"
              meta={
                <>
                  Invercargill, New Zealand. Expected{" "}
                  <time dateTime="2026">2026</time>.
                </>
              }
            >
              <p>
                Research: how AI is reshaping software engineering practice.
              </p>
            </Entry>
            <Entry
              title="National Autonomous University of Mexico (UNAM)"
              subtitle="Bachelor’s degree in Linguistics and Hispanic Literatures"
              meta="Mexico City, Mexico"
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="development">
          <h2 className={styles.sectionTitle} id="development">
            Professional development
          </h2>
          <div className={styles.sectionBody}>
            <ul>
              <li>
                Ongoing internal certification at BBVA in Lit and the bank’s
                component framework, assessed quarterly under a mandatory pass
                requirement.
              </li>
              <li>
                Ajusco Coding Bootcamp, Mexico City. Front-end development and
                Scrum, with collaborative projects on GitHub.
              </li>
              <li>
                <a href="https://www.scrumstudy.com/certification/verify?type=SDC&number=825342">
                  Scrum Developer Certified
                </a>{" "}
                (2023) and{" "}
                <a href="https://wallet.xertify.co/certificates/57670152A001">
                  Secure Development Certified
                </a>{" "}
                (2023).
              </li>
              <li>
                <a href="https://www.freecodecamp.org/certification/elibabah/javascript-algorithms-and-data-structures">
                  JavaScript Algorithms and Data Structures
                </a>{" "}
                (2021) and{" "}
                <a href="https://www.freecodecamp.org/certification/elibabah/responsive-web-design">
                  Responsive Web Design
                </a>{" "}
                (2021), freeCodeCamp.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="languages">
          <h2 className={styles.sectionTitle} id="languages">
            Languages
          </h2>
          <div className={styles.sectionBody}>
            <dl className={styles.skills}>
              <dt>English</dt>
              <dd>
                Professional working proficiency. Master’s-level study in
                English in New Zealand; NZCEL Level 5.
              </dd>
              <dt>Spanish</dt>
              <dd>Native.</dd>
            </dl>
          </div>
        </section>

        <p className={styles.closing}>
          Full New Zealand Class 1 driver licence. References on request. The
          same content is available as a{" "}
          <a href={CV_PDF_PATH} data-print="hide">
            PDF
          </a>
          .
        </p>
      </main>
    </>
  );
}
