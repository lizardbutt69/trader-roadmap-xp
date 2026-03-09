import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zoqdjfadooxymwzyurhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcWRqZmFkb294eW13enl1cmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzQ2MDQsImV4cCI6MjA4ODYxMDYwNH0.VeoOC8IcHfwcuiTLBaz67y7P365FbUIv5gQ7FwFpBgo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
