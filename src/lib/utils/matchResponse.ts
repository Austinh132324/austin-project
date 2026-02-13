const kb: Record<string, string> = {
  greeting: "Hey! I'm Austin Howell, a Software Engineer currently working at JB Hunt. I graduated from the University of Arkansas in 2022 with a 4.0 GPA in Computer Science. What would you like to know about me?",
  experience: "I've been a Software Engineer at JB Hunt since January 2023. I work on full-stack applications using Angular, React, and Azure DevOps. Before that, I was a Software Development Intern at CTTP in Fayetteville from 2018-2020 where I helped build their website. Most recently, I've also been doing consulting work since March 2025, leading a team of 2 to build a Vite React app with an embedded Power BI reporting portal.",
  jbhunt: "At JB Hunt, I've done a ton of impactful work! I mentored 3 interns, converted our CI/CD pipelines to YAML for anytime deployments instead of weekly ones, modernized our monorepo to use Module Federation, led an Angular-to-React conversion that improved dev time by 25% and load times by 15%, and owned an entire feature end-to-end using Kafka messaging with Elasticsearch. I also helped implement AI developer and code review agents connected to Azure DevOps and MCP servers.",
  skills: "My main tech stack includes TypeScript, JavaScript, Python, Angular, React, Redux, Vite, Cypress for testing, and Azure DevOps for CI/CD. I also work with Kafka, Elasticsearch, Module Federation for micro-frontends, Power BI, and Git. I'm big on clean architecture, agile methodologies, and REST APIs.",
  education: "I graduated with a Computer Science degree from the University of Arkansas in 2022 with a 4.0 GPA. My coursework included Data Structures, Algorithms, Software Engineering, Database Management, and Computer Networks.",
  projects: "I've got several projects I'm proud of! This personal platform site (austinshowell.dev), the Power BI Reporting Portal I built as a consultant, the AI Dev Agents I helped implement at JB Hunt, the Kafka Feature Pipeline I owned end-to-end, and the Module Federation Monorepo modernization. You can check them all out on my Projects page!",
  ai_agents: "One of the coolest things I've worked on is researching and implementing AI-powered developer, tester, and code review agents. They integrate with Azure DevOps and internal design system MCP servers to ensure design-compliant development. It's like having AI teammates that help write, test, and review code!",
  kafka: "I took full ownership of a feature that used Kafka messaging to orchestrate Elasticsearch queries. I built the Angular UI, set up CI/CD pipelines across DEV, TEST, and PROD environments, and iterated on it with user feedback over 4 months. It replaced constant endpoint polling with event-driven architecture.",
  module_federation: "I modernized our legacy monorepo UI to use Webpack Module Federation, which enabled independent deployments of micro-frontends. I also led the Angular-to-React conversion that resulted in 25% faster development time and 15% faster load times. Plus, I added component Cypress testing to gate production builds.",
  consulting: "Since March 2025, I've been working as a Software Engineer Consultant. I designed and led a team of 2 developers to create a Vite React application with an embedded Power BI reporting portal. I also handled the Python backend connectors and managed pods in DEV and PROD containers. We used Redux for state management across the app.",
  activities: "I'm a member of ACM (Association for Computing Machinery), participated in HackAR 2024, and I volunteer as a Code.org Hour of Code mentor to help teach kids programming. I love giving back to the community!",
  contact: "You can reach me at AH132324@hotmail.com or connect with me on LinkedIn! I'm always happy to chat about software engineering, potential opportunities, or tech in general.",
  hiring: "I'm always open to hearing about exciting opportunities! I'm passionate about building production-quality software, especially with React, Angular, and modern web technologies. If you have something interesting, feel free to reach out at AH132324@hotmail.com or connect on LinkedIn.",
  intern: "My first tech role was a Software Development Intern at CTTP in Fayetteville, AR from June 2018 to October 2020. I helped create the company website and an online classes application using the Symphony framework, working with HTML, CSS, and JavaScript.",
  cypress: "I'm a big advocate for testing. At JB Hunt, I implemented end-to-end testing using Cypress, including setting up artifact builds on the Azure pipeline for production deployments. I led the effort to add component Cypress testing on all existing and new development, which significantly reduced bugs making it to production.",
  hobbies: "Outside of coding, I'm a big gamer! I also enjoy building side projects and tinkering with new tech. Check out my Games page - I've got some browser games you can play right now!",
  fallback: "That's a great question! I might not have a specific answer for that, but I'd love to chat more. Feel free to ask about my work experience, tech stack, projects, education, or anything else about my background. Or reach out to the real me at AH132324@hotmail.com!",
}

export function matchResponse(input: string): string {
  const q = input.toLowerCase()

  if (/^(hi|hey|hello|sup|yo|what'?s? up)/.test(q)) return kb.greeting
  if (/(jb\s*hunt|j\.?b\.?\s*hunt)/.test(q)) return kb.jbhunt
  if (/(experience|work|job|career|where do you work|what do you do|professional)/.test(q)) return kb.experience
  if (/(consult|power\s*bi|reporting|vite react)/.test(q)) return kb.consulting
  if (/(skill|tech|stack|language|framework|tools|what.*use|what.*know|technologies)/.test(q)) return kb.skills
  if (/(school|university|college|education|degree|gpa|graduat|arkansas|uark)/.test(q)) return kb.education
  if (/(project|build|portfolio|proud|ship)/.test(q)) return kb.projects
  if (/(ai|agent|mcp|artificial intelligence|machine learn)/.test(q)) return kb.ai_agents
  if (/(kafka|elastic|pipeline|event.?driven|messaging)/.test(q)) return kb.kafka
  if (/(module.?federation|monorepo|micro.?frontend|webpack)/.test(q)) return kb.module_federation
  if (/(cypress|test|qa|quality)/.test(q)) return kb.cypress
  if (/(intern|cttp|first.*job|start)/.test(q)) return kb.intern
  if (/(acm|hack|volunteer|code\.org|activit|leadership|extracurricular)/.test(q)) return kb.activities
  if (/(contact|email|reach|linkedin|connect)/.test(q)) return kb.contact
  if (/(hir|opportunit|available|open to|looking for|recruit|resume)/.test(q)) return kb.hiring
  if (/(hobby|hobbies|fun|free time|game|gaming|outside|interest)/.test(q)) return kb.hobbies

  return kb.fallback
}

export { kb }
