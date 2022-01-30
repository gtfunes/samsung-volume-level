import config from 'dos-config';
import {logger} from 'appium-support';

import CoolFace from 'cool-ascii-faces';
import {SamsungTV} from 'samsungtv'
import {SpeechRecorder} from 'speech-recorder';
import times from 'lodash.times';

// TV keys
const TV_VOLUME_UP_KEY = 'KEY_VOLUP';
const TV_VOLUME_DOWN_KEY = 'KEY_VOLDOWN';

// Exit function that also does some cleanup
const exit = (reason = 'Exiting...', code = 0) => {
  // Tiny hack to avoid extra logging
  // eslint-disable-next-line no-console
  console.info('\n');
  log.info(CoolFace());
  log.info(reason);

  try {
    tv.disconnect();
    recorder.stop();
  } catch (_error: unknown) {
    // Do nothing, we are exiting
    // and we don't care anymore
  }

  process.exit(code);
}

// Custom error hanlder
const errorHandler = (error: unknown) => {
  let message = 'An unexpected error occurred...';
  if (error instanceof Error) {
    message = error.message;
  }

  exit(message, 1);
}

// Logger object
const log = logger.getLogger(config.appName);
// TV object
const tv = new SamsungTV(config.tv.ip, config.tv.mac);
// Sound recorder object
const recorder = new SpeechRecorder({disableSecondPass: true, error: errorHandler});

// Main function of our script
const main = async () => {
  try {
    log.info(CoolFace());
    log.info('Starting up...');

    // Attemp to connect to our TV
    await tv.connect(config.appName);

    let consecutiveLoudNoiseCount = 0;
    let consecutiveQuietNoiseCount = 0;

    recorder.start({
        deviceId: config.audio.deviceId,
        minimumVolume: Math.max(config.volume.min - 10, 10),
        onAudio: (_audio: Buffer[], _speaking1: boolean, _speaking2: number, volume: number, consecutiveSilence: number) => {
          if (consecutiveSilence >= config.volume.consecutiveSilenceLimit) {
            // If the consecutive silence counter goes beyond
            // our limit, exit the app
            exit('Exiting due to continuous silence...')
          }

          if (volume > config.volume.max) {
            // If volume is higher than our max configured
            // value, increment our loud noise counter
            consecutiveLoudNoiseCount++;
            // Also, reset the quiet noise counter
            consecutiveQuietNoiseCount = 0;
          } else if (volume < config.volume.min) {
            // If volume is lower than our min configured
            // value, increment our quiet noise counters
            consecutiveQuietNoiseCount++;
            // Also, reset the loud noise counter
            consecutiveLoudNoiseCount = 0;
          }

          if (consecutiveLoudNoiseCount >= config.volume.consecutiveLoudLimit) {
            // If our loud noise counter goes beyond
            // our limit, we lower our TV's volume a
            // number of times
            log.info('Too loud!');

            times(config.remote.volumeDownTimes, () => tv.sendKey(TV_VOLUME_DOWN_KEY));
            consecutiveLoudNoiseCount = 0;
          } else if (consecutiveQuietNoiseCount >= config.volume.consecutiveQuietLimit) {
            // If our quiet noise counter goes beyond
            // our limit, we increase our TV's volume a
            // number of times
            log.info('Too quiet!');

            times(config.remote.volumeUpTimes, () => tv.sendKey(TV_VOLUME_UP_KEY));
            consecutiveQuietNoiseCount = 0;
          }
        },
    });
  } catch(error: unknown) {
    errorHandler(error);
  }
}

// If case we receive an exit
// signal, run our exit() function
process.on('SIGINT', () => exit());

// Start the thing!
main();
