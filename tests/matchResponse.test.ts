import { describe, it, expect } from 'vitest'
import { matchResponse, kb } from '../src/lib/utils/matchResponse'

describe('matchResponse', () => {
  describe('greetings', () => {
    it.each(['hi', 'hey', 'hello', 'sup', 'yo', 'whats up'])(
      'responds to "%s" with greeting',
      (input) => {
        expect(matchResponse(input)).toBe(kb.greeting)
      }
    )
  })

  describe('JB Hunt', () => {
    it.each(['JB Hunt', 'jb hunt', 'jbhunt', 'J.B. Hunt'])(
      'responds to "%s" with jbhunt info',
      (input) => {
        expect(matchResponse(input)).toBe(kb.jbhunt)
      }
    )
  })

  describe('experience', () => {
    it.each(['Tell me about your experience', 'Where do you work?', 'What is your job?', 'career'])(
      'responds to "%s" with experience',
      (input) => {
        expect(matchResponse(input)).toBe(kb.experience)
      }
    )
  })

  describe('skills', () => {
    it.each(['What is your tech stack?', 'skills', 'What languages do you know?', 'technologies'])(
      'responds to "%s" with skills',
      (input) => {
        expect(matchResponse(input)).toBe(kb.skills)
      }
    )
  })

  describe('education', () => {
    it.each(['Where did you go to school?', 'university', 'What is your GPA?', 'Arkansas'])(
      'responds to "%s" with education',
      (input) => {
        expect(matchResponse(input)).toBe(kb.education)
      }
    )
  })

  describe('projects', () => {
    it.each(['Tell me about your projects', 'portfolio', 'What did you ship?'])(
      'responds to "%s" with projects',
      (input) => {
        expect(matchResponse(input)).toBe(kb.projects)
      }
    )
  })

  describe('AI agents', () => {
    it.each(['Tell me about AI', 'What are the agents?', 'MCP servers'])(
      'responds to "%s" with ai_agents',
      (input) => {
        expect(matchResponse(input)).toBe(kb.ai_agents)
      }
    )
  })

  describe('kafka', () => {
    it('responds to kafka-related queries', () => {
      expect(matchResponse('Tell me about Kafka')).toBe(kb.kafka)
      expect(matchResponse('elasticsearch')).toBe(kb.kafka)
    })
  })

  describe('module federation', () => {
    it('responds to module federation queries', () => {
      expect(matchResponse('module federation')).toBe(kb.module_federation)
      expect(matchResponse('monorepo')).toBe(kb.module_federation)
      expect(matchResponse('micro-frontend')).toBe(kb.module_federation)
    })
  })

  describe('consulting', () => {
    it('responds to consulting queries', () => {
      expect(matchResponse('Tell me about consulting')).toBe(kb.consulting)
      expect(matchResponse('Power BI')).toBe(kb.consulting)
    })
  })

  describe('contact', () => {
    it('responds to contact queries', () => {
      expect(matchResponse('How can I contact you?')).toBe(kb.contact)
      expect(matchResponse('reach out')).toBe(kb.contact)
      expect(matchResponse('connect with you')).toBe(kb.contact)
    })
  })

  describe('hiring', () => {
    it('responds to hiring queries', () => {
      expect(matchResponse('Are you hiring?')).toBe(kb.hiring)
      expect(matchResponse('open to opportunities')).toBe(kb.hiring)
      expect(matchResponse('resume')).toBe(kb.hiring)
    })
  })

  describe('hobbies', () => {
    it('responds to hobby queries', () => {
      expect(matchResponse('What are your hobbies?')).toBe(kb.hobbies)
      expect(matchResponse('gaming')).toBe(kb.hobbies)
    })
  })

  describe('fallback', () => {
    it('returns fallback for unrecognized input', () => {
      expect(matchResponse('random gibberish xyz123')).toBe(kb.fallback)
    })
  })

  describe('case insensitivity', () => {
    it('handles uppercase input', () => {
      expect(matchResponse('HELLO')).toBe(kb.greeting)
      expect(matchResponse('JB HUNT')).toBe(kb.jbhunt)
    })

    it('handles mixed case input', () => {
      expect(matchResponse('What Is Your Tech Stack?')).toBe(kb.skills)
    })
  })
})
