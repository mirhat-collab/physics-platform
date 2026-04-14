import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function ClassPage({ params }: { params: { id: string } }) {
  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('grade', classData?.name)

  return (
    <div style={{ padding: 32 }}>
      <h1>{classData?.name}</h1>
      <p>Всего тем: {topics?.length}</p>
      <div>
        {topics?.map(topic => (
          <div key={topic.id} style={{ padding: 16, margin: '8px 0', background: '#f5f5f5', borderRadius: 8 }}>
            <Link href={`/topics/${topic.id}`}>
              <h3>{topic.name}</h3>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}