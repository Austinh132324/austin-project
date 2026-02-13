import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import StarField from '../components/StarField'
import '../styles/AboutMe.css'

/* ── skill data ── */
interface Skill {
  name: string
  category: 'lang' | 'tool' | 'concept'
}

const ring1: Skill[] = [
  { name: 'TypeScript', category: 'lang' },
  { name: 'JavaScript', category: 'lang' },
  { name: 'Python', category: 'lang' },
  { name: 'Angular', category: 'tool' },
  { name: 'React', category: 'tool' },
]

const ring2: Skill[] = [
  { name: 'HTML/CSS', category: 'lang' },
  { name: 'SQL', category: 'lang' },
  { name: 'Cypress', category: 'tool' },
  { name: 'Azure DevOps', category: 'tool' },
  { name: 'Redux', category: 'tool' },
  { name: 'Git', category: 'tool' },
]

const ring3: Skill[] = [
  { name: 'Kafka', category: 'tool' },
  { name: 'Vite', category: 'tool' },
  { name: 'CI/CD', category: 'concept' },
  { name: 'Module Federation', category: 'concept' },
  { name: 'Agile', category: 'concept' },
  { name: 'REST APIs', category: 'concept' },
]

/* ── experience data ── */
const experiences = [
  {
    date: 'Mar 2025 – Present',
    title: 'Software Engineer Consultant',
    subtitle: '',
    bullets: [],
    tags: ['Vite React', 'Power BI', 'Python', 'Redux', 'Containers'],
  },
  {
    date: 'Jan 2023 – Present',
    title: 'Software Engineer',
    subtitle: 'JB Hunt Transport Services',
    bullets: [
      'Mentored junior developers and conducted thorough code reviews to maintain high code quality standards.',
      'Built and maintained CI/CD pipelines in Azure DevOps to streamline deployments and reduce release cycle time.',
      'Designed and implemented reusable component stores using Redux for scalable state management.',
      'Developed and maintained comprehensive Cypress end-to-end test suites ensuring reliable application behavior.',
      'Architected Module Federation solutions to enable independent deployment of micro-frontends.',
      'Led the migration of legacy Angular applications to modern React, improving performance and developer experience.',
      'Implemented real-time data streaming features using Apache Kafka for event-driven architectures.',
      'Developed AI-powered agent workflows to automate repetitive development and QA tasks.',
      'Collaborated with cross-functional teams using Agile methodologies to deliver high-impact features on time.',
    ],
    tags: ['Angular', 'React', 'Cypress', 'Azure DevOps', 'Kafka', 'Module Federation'],
  },
  {
    date: 'Jun 2018 – Oct 2020',
    title: 'Software Development Intern',
    subtitle: 'CTTP',
    bullets: [],
    tags: ['Symphony', 'HTML', 'CSS', 'JavaScript'],
  },
]

/* ── coursework ── */
const coursework = [
  'Data Structures',
  'Algorithms',
  'Software Engineering',
  'Database Management',
  'Computer Networks',
]

/* ── activities ── */
const activities = [
  { title: 'ACM Member', desc: 'Active member of the Association for Computing Machinery.' },
  { title: 'HackAR 2024', desc: 'Participated in the annual Arkansas hackathon event.' },
  { title: 'Code.org Volunteer', desc: 'Volunteered to teach coding fundamentals to students.' },
]

/* ── helper: position nodes on a circle ── */
function circlePos(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  return { x, y }
}

/* ── component ── */
export default function AboutMe() {
  useEffect(() => {
    const revealEls = document.querySelectorAll<HTMLElement>('.scroll-reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.15 },
    )

    revealEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="about-page">
      <Navbar
        links={[
          { label: 'Skills', href: '#skills' },
          { label: 'Experience', href: '#experience' },
          { label: 'Education', href: '#education' },
          { label: 'Contact', href: '#contact' },
        ]}
      />
      <StarField />

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-avatar">AH</div>
          <h1 className="about-name">Austin Howell</h1>
          <p className="about-tagline">
            Software Engineer &bull; Full Stack Developer &bull; Problem Solver
          </p>
          <p className="about-summary">
            I&rsquo;m a software engineer who thrives on building polished, performant web
            applications. With hands-on experience in Angular, React, and Azure DevOps,
            I enjoy turning complex problems into clean, maintainable solutions. From
            architecting micro-frontends to mentoring teammates, I bring curiosity and
            craft to every project I touch.
          </p>
          <div className="scroll-hint">&darr; scroll</div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="about-section">
        <h2 className="about-section-title scroll-reveal">Skills</h2>

        <div className="skills-container scroll-reveal">
          <div className="skills-orbit">
            {/* rings */}
            <div className="orbit-ring r1" />
            <div className="orbit-ring r2" />
            <div className="orbit-ring r3" />

            {/* center */}
            <div className="orbit-center">Skills</div>

            {/* ring 1 */}
            {ring1.map((s, i) => {
              const { x, y } = circlePos(i, ring1.length, 80)
              return (
                <div
                  key={s.name}
                  className={`skill-node ${s.category}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.07}s`,
                  }}
                >
                  {s.name}
                </div>
              )
            })}

            {/* ring 2 */}
            {ring2.map((s, i) => {
              const { x, y } = circlePos(i, ring2.length, 130)
              return (
                <div
                  key={s.name}
                  className={`skill-node ${s.category}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${(ring1.length + i) * 0.07}s`,
                  }}
                >
                  {s.name}
                </div>
              )
            })}

            {/* ring 3 */}
            {ring3.map((s, i) => {
              const { x, y } = circlePos(i, ring3.length, 170)
              return (
                <div
                  key={s.name}
                  className={`skill-node ${s.category}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${(ring1.length + ring2.length + i) * 0.07}s`,
                  }}
                >
                  {s.name}
                </div>
              )
            })}
          </div>
        </div>

        <div className="skills-legend scroll-reveal">
          <span className="legend-item lang">Languages</span>
          <span className="legend-item tool">Tools &amp; Frameworks</span>
          <span className="legend-item concept">Concepts</span>
        </div>
      </section>

      {/* ── Experience ── */}
      <section id="experience" className="about-section">
        <h2 className="about-section-title scroll-reveal">Experience</h2>

        <div className="about-timeline">
          {experiences.map((exp, idx) => (
            <div key={idx} className="tl-item scroll-reveal">
              <div className="tl-dot" />
              <div className="tl-date">{exp.date}</div>
              <div className="tl-title">{exp.title}</div>
              {exp.subtitle && <div className="tl-subtitle">{exp.subtitle}</div>}
              {exp.bullets.length > 0 && (
                <ul className="tl-body">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
              {exp.tags.length > 0 && (
                <div className="tl-tags">
                  {exp.tags.map((t) => (
                    <span key={t} className="tl-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Education ── */}
      <section id="education" className="about-section">
        <h2 className="about-section-title scroll-reveal">Education</h2>

        <div className="edu-card scroll-reveal">
          <div className="edu-icon">&#127891;</div>
          <div className="edu-school">University of Arkansas</div>
          <div className="edu-degree">B.S. in Computer Science</div>
          <div className="edu-date">Graduated: 2022</div>
          <div className="edu-gpa">GPA: 4.0</div>
          <div className="coursework">
            {coursework.map((c) => (
              <span key={c} className="coursework-chip">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="about-section">
        <h2 className="about-section-title scroll-reveal">Activities</h2>

        <div className="activities-grid">
          {activities.map((a) => (
            <div key={a.title} className="act-card scroll-reveal">
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="about-section about-contact">
        <h2 className="about-section-title scroll-reveal">Let&rsquo;s Connect</h2>

        <div className="contact-links scroll-reveal">
          <a
            className="contact-btn email"
            href="mailto:AH132324@hotmail.com"
          >
            Email Me
          </a>
          <a
            className="contact-btn linkedin"
            href="https://www.linkedin.com/in/austin-howell"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  )
}
