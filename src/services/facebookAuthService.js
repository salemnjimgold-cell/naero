import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import { Platform, NativeModules } from 'react-native';
import { getSupabaseClient } from './supabase';
import { saveOAuthSession } from './authService';

async function logKeyHashes() {
  if (Platform.OS !== 'android') return;
  try {
    const info = await NativeModules.KeyHashModule.getAppInfo();
    console.warn('[FB Hash] packageName:', info.packageName);
    console.warn('[FB Hash] keyHashes:', JSON.stringify(info.keyHashes));
  } catch (e) {
    console.warn('[FB Hash] Error getting key hashes:', e.message);
  }
}

export async function signInWithFacebook() {
  try {
    await logKeyHashes();

    Settings.initializeSDK();

    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (result.isCancelled) {
      return { session: null, user: null, error: null };
    }

    const currentAccessToken = await AccessToken.getCurrentAccessToken();

    if (!currentAccessToken) {
      return { session: null, user: null, error: 'Failed to get Facebook access token.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { session: null, user: null, error: 'Supabase is not configured.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'facebook',
      token: currentAccessToken.accessToken.toString(),
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('not configured')) {
        return { session: null, user: null, error: 'This sign-in method is coming soon.' };
      }
      return { session: null, user: null, error: error.message };
    }

    if (!data?.session) {
      return { session: null, user: null, error: 'No session returned from Supabase.' };
    }

    return await saveOAuthSession(data.session, 'facebook');
  } catch (err) {
    if (err.message && (err.message.includes('not enabled') || err.message.includes('unsupported') || err.message.includes('not configured'))) {
      return { session: null, user: null, error: 'This sign-in method is coming soon.' };
    }
    let errMsg = err.message || 'Facebook authentication failed.';
    if (Platform.OS === 'android') {
      try {
        const info = await NativeModules.KeyHashModule.getAppInfo();
        const hashes = JSON.stringify(info.keyHashes);
        errMsg += ` [pkg:${info.packageName} hashes:${hashes}]`;
        console.warn('[FB Hash] packageName:', info.packageName);
        console.warn('[FB Hash] keyHashes:', hashes);
      } catch (e2) {
        errMsg += ' [hashError:' + e2.message + ']';
      }
    }
    return { session: null, user: null, error: errMsg };
  }
}
