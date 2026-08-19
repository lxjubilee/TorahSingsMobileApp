const { withMainActivity, CodeGenerator } = require('expo/config-plugins');

const { mergeContents } = CodeGenerator;

/**
 * Keeps screenshots and screen recording available on every screen.
 *
 * Nothing in this app asks for FLAG_SECURE, but the flag can still land on our
 * window from outside — an OEM/device policy, a work profile, or a dependency
 * shipped as an AAR. Once it is set, Android answers every screenshot with
 * "Can't take screenshot due to app restrictions", which is not what we want on
 * the sign-in screen (or anywhere else). So we clear it ourselves: once when the
 * activity is built, and again on every resume in case it was applied while the
 * app sat in the background.
 */
const withScreenshotsAllowed = (config) =>
  withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kt') {
      throw new Error(
        `withScreenshotsAllowed only supports Kotlin MainActivity, found "${config.modResults.language}"`,
      );
    }

    let contents = config.modResults.contents;

    contents = mergeContents({
      tag: 'allow-screenshots-import',
      src: contents,
      newSrc: 'import android.view.WindowManager',
      anchor: /^import android\.os\.Bundle$/m,
      offset: 1,
      comment: '//',
    }).contents;

    contents = mergeContents({
      tag: 'allow-screenshots-oncreate',
      src: contents,
      newSrc: '    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)',
      anchor: /^\s*super\.onCreate\(null\)$/m,
      offset: 1,
      comment: '//',
    }).contents;

    contents = mergeContents({
      tag: 'allow-screenshots-onresume',
      src: contents,
      newSrc: [
        '  override fun onResume() {',
        '    super.onResume()',
        '    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)',
        '  }',
      ].join('\n'),
      anchor: /^class MainActivity : ReactActivity\(\) \{$/m,
      offset: 1,
      comment: '//',
    }).contents;

    config.modResults.contents = contents;
    return config;
  });

module.exports = withScreenshotsAllowed;
