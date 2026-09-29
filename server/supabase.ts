import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read connection strictly from environment variables without hard-coding
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

// Check if credentials are provided and not default placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Instantiate Supabase client securely on server side
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    supabaseUrl: supabaseUrl
      ? supabaseUrl.replace(/^(https?:\/\/)(.{4})(.*)(\.supabase\.co.*)$/, '$1$2****$4')
      : null,
    hasAnonKey: Boolean(supabaseAnonKey),
    anonKeyPreview: supabaseAnonKey
      ? `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-4)}`
      : null,
  };
}

// Test Supabase connectivity
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      message: 'SUPABASE_URL and SUPABASE_ANON_KEY are not configured yet in environment secrets.',
    };
  }

  try {
    // Attempt a lightweight probe against agro_prices or profiles
    const { data, error } = await supabase.from('agro_prices').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it still verifies valid credentials
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Supabase credentials verified successfully! (Schema tables ready to be created).',
        };
      }
      return {
        connected: false,
        message: `Supabase responded with code ${error.code}: ${error.message}`,
        error: error.message,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database.',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${err.message || 'Unknown network error'}`,
      error: err.message,
    };
  }
}
