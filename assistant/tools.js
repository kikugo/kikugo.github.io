import { PROFILE, SECTION_IDS } from './knowledge.js';

const PROJECT_IDS = new Set(PROFILE.projects.map((p) => p.id));
const SECTION_SET = new Set(SECTION_IDS);

export const TOOL_DECLARATIONS = [
  {
    name: 'scrollToSection',
    description:
      'Scroll the page to a section or a specific project and highlight it. ' +
      'Call this whenever you start talking about a part of the portfolio.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sectionId: {
          type: 'STRING',
          description:
            'A section id (about, work, education, skills, projects, contact) ' +
            'or a project id (e.g. videosense, unified-rag).',
        },
      },
      required: ['sectionId'],
    },
  },
  {
    name: 'downloadCV',
    description: "Trigger a download of Karthik's CV / resume.",
    parameters: { type: 'OBJECT', properties: {} },
  },
];

/**
 * Pure dispatcher: validate a tool call and return a descriptor of the action
 * the UI layer should perform. Never throws; returns { ok:false } on bad input.
 */
export function dispatchTool(name, args = {}) {
  if (name === 'downloadCV') {
    return { ok: true, action: 'downloadCV' };
  }
  if (name === 'scrollToSection') {
    const id = String(args.sectionId ?? '').trim();
    if (SECTION_SET.has(id)) return { ok: true, action: 'scroll', domId: id };
    if (PROJECT_IDS.has(id)) return { ok: true, action: 'scroll', domId: `proj-${id}` };
    return { ok: false, action: 'scroll', error: `unknown section: ${id}` };
  }
  return { ok: false, error: `unknown tool: ${name}` };
}
