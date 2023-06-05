type UserProps = { users: string[], currentUser: string }
export function Users({ users, currentUser }: UserProps) {
  return (
    <ul style={{ display: 'flex', listStyle: 'none', padding: '0', gap: '8px', flexWrap: 'wrap' }}>
      {users
        .map(u => u.split(':')[1])
        .map(name => <li key={name} style={{
          border: '1px solid #43444e',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: name === currentUser?.split(':')[1] ? 'var(--shadow-elevation-medium)' : 'var(--shadow-elevation-low)',
          transform: name === currentUser?.split(':')[1] ? 'scale(1.1)' : 'scale(0.9)',
          transition: 'all 250ms ease-in-out'
        }}>{name}</li>)
      }
    </ul >
  )
}