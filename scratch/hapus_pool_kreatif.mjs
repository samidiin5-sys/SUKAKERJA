const url = 'https://onpgzulupjhvgzczjasy.supabase.co/rest/v1'
const serviceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucGd6dWx1cGpodmd6Y3pqYXN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxMzQ4OCwiZXhwIjoyMTAwMTg5NDg4fQ.TML36CsShg4dXqT4LbvS8Q7jC0xzJzRET-RKbvDkQbI'

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function run() {
  // Cari task dengan judul mengandung 'claude'
  const resClaude = await fetch(
    `${url}/tasks?judul=ilike.*claude*&deleted_at=is.null&select=id,judul,board_id`,
    { headers }
  )
  const claudeTasks = await resClaude.json()

  console.log('Task mengandung "claude":', claudeTasks)

  if (claudeTasks && claudeTasks.length > 0) {
    const ids = claudeTasks.map((t) => t.id)
    const now = new Date().toISOString()
    const resUpdate = await fetch(`${url}/tasks?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ deleted_at: now }),
    })
    const delResult = await resUpdate.json()
    console.log('\nBerhasil menghapus (soft delete) task:', delResult)
  } else {
    console.log('Tidak ada task mengandung "claude" yang aktif.')
  }
}

run()
