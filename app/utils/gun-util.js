import Gun from 'gun/gun'
import 'gun/sea'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import 'gun/lib/unset'

export const gun = Gun({
  peers: ['http://localhost:8765/gun'],
  localStorage: true,
})
