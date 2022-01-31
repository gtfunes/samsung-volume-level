import {stdin} from 'process';
import {on} from 'events';

import config from 'dos-config';
import {logger} from 'appium-support';

import CoolFace from 'cool-ascii-faces';
import {SamsungTV, KEY_CODES} from 'samsungtv';

const COMMAND_KEYS = {
  QUIT: '\u0003',
  KEYUP: '\u001b[A',
  KEYDOWN: '\u001b[B',
  TAB: '\t',
  SPACE: ' ',
  ENTER: '\r',
  ESCAPE: '\u001b',
};

// Logger object
const log = logger.getLogger(config.appName);
// TV object
const tv = new SamsungTV(config.tv.ip, config.tv.mac);

const main = async () => {
  try {
    log.info(CoolFace());
    log.info('Starting up...');

    await tv.connect();

    // Operate stream as a raw device
    stdin.setRawMode(true);
    // Let's work with plain text
    stdin.setEncoding('utf8');
    // explicity start the readable stream and keep event loop running
    stdin.resume();

    log.info('Press a key to use the remote...');

    // eslint-disable-next-line no-restricted-syntax
    for await (const [key] of on(stdin, 'data')) {
      switch (key) {
        case 'w':
          await tv.sendKey(KEY_CODES.KEY_UP);
          break;
        case 's':
          await tv.sendKey(KEY_CODES.KEY_DOWN);
          break;
        case 'd':
          await tv.sendKey(KEY_CODES.KEY_RIGHT);
          break;
        case 'a':
          await tv.sendKey(KEY_CODES.KEY_LEFT);
          break;
        case COMMAND_KEYS.KEYUP:
          await tv.sendKey(KEY_CODES.KEY_VOLUP);
          break;
        case COMMAND_KEYS.KEYDOWN:
          await tv.sendKey(KEY_CODES.KEY_VOLDOWN);
          break;
        case COMMAND_KEYS.SPACE:
          await tv.sendKey(KEY_CODES.KEY_MENU);
          break;
        case COMMAND_KEYS.TAB:
          await tv.sendKey(KEY_CODES.KEY_SOURCE);
          break;
        case COMMAND_KEYS.ESCAPE:
          await tv.sendKey(KEY_CODES.KEY_POWER);
          break;
        case COMMAND_KEYS.ENTER:
          await tv.sendKey(KEY_CODES.KEY_ENTER);
          break;
        case COMMAND_KEYS.QUIT:
          process.exit(0);
        // eslint-disable-next-line no-fallthrough
        default:
          break;
      }
    }
  } catch (error: unknown) {
    // In case of error, just exit
    process.exit(1);
  }
};

// Start the thing!
main();
