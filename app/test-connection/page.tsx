import { createClient } from '@/lib/supabase/server'

export default async function TestConnectionPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.from('risk_zones').select('*')

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error connecting to Supabase:</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Successfully connected!</p>
          <p className="mt-2">Found {data?.length || 0} risk zones.</p>
          <pre className="mt-2 text-sm bg-black/5 p-2 rounded whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
