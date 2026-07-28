import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function test() {
  const { data, error } = await supabase.from('public_data_points').select('*').limit(1)
  console.log("Error:", error)
  console.log("Data:", data)
}

test()
