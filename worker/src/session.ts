// The session config is pinned here, at deploy time. Whatever the client sends
// in the request body is ignored, so a token minted by this Worker can only be
// used as the portfolio guide, never as a general-purpose voice LLM.
//
// The prompt and tool declarations live in the front end's assistant/ folder
// (they are public anyway) and are bundled into the Worker by wrangler. Editing
// assistant/knowledge.js or assistant/tools.js needs a Worker redeploy to reach
// the live assistant.
import { SYSTEM_PROMPT, PROFILE } from '../../assistant/knowledge.js';
import { TOOL_DECLARATIONS } from '../../assistant/tools.js';

export const SYSTEM_INSTRUCTION = {
  parts: [
    {
      text:
        `${SYSTEM_PROMPT}\n\n` +
        `this is the only information you have about karthik. ` +
        `use only these facts and do not invent anything beyond them:\n` +
        JSON.stringify(PROFILE),
    },
  ],
};

export const TOOLS = [{ functionDeclarations: TOOL_DECLARATIONS }];
