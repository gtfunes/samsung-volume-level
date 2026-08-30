import {format} from 'util';

// Matches the `<level> <prefix> <message>` output that npmlog
// (and therefore appium-support's logger) writes to stderr
const LEVEL_STYLE = '\u001b[32m';
const PREFIX_STYLE = '\u001b[35m';
const RESET_STYLE = '\u001b[0m';

const paint = (style: string, text: string) =>
  process.stderr.isTTY ? `${style}${text}${RESET_STYLE}` : text;

export const getLogger = (prefix: string) => ({
  info: (...args: unknown[]) => {
    const level = paint(LEVEL_STYLE, 'info');
    const scope = paint(PREFIX_STYLE, prefix);

    process.stderr.write(`${level} ${scope} ${format(...args)}\n`);
  },
});
