import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { UserPlus, Pencil, Trash2, ShieldCheck, Power } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffManager() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [editing, setEditing] = useState(null)
  const [editPin, setEditPin] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase.from('staff').select('*').order('role', { ascending: false }).order('name')
      if (isMounted && !error) {
        setStaff(data || [])
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('staff-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        async () => {
          const { data } = await supabase.from('staff').select('*').order('role', { ascending: false }).order('name')
          if (isMounted) setStaff(data || [])
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return toast.error('Enter staff name')
    if (!/^\d{4}$/.test(newPin)) return toast.error('PIN must be exactly 4 digits')

    const { error } = await supabase.from('staff').insert([
      { name: newName.trim(), pin: newPin, role: 'cashier' },
    ])
    if (error) toast.error('Failed to add staff')
    else {
      toast.success(`${newName.trim()} added as cashier`)
      setNewName('')
      setNewPin('')
      setShowAdd(false)
    }
  }

  async function handleSavePin(staffMember) {
    if (!/^\d{4}$/.test(editPin)) return toast.error('PIN must be exactly 4 digits')
    const { error } = await supabase.from('staff').update({ pin: editPin }).eq('id', staffMember.id)
    if (error) toast.error('Failed to update PIN')
    else {
      toast.success('PIN updated')
      setEditing(null)
      setEditPin('')
    }
  }

  async function handleToggleActive(staffMember) {
    const owners = staff.filter((s) => s.role === 'owner' && s.isActive)
    if (staffMember.role === 'owner' && staffMember.isActive && owners.length <= 1) {
      return toast.error('Cannot disable the last active owner')
    }
    if (staffMember.id === user?.id && staffMember.isActive) {
      return toast.error('You cannot disable your own account')
    }
    const { error } = await supabase.from('staff').update({ isActive: !staffMember.isActive }).eq('id', staffMember.id)
    if (error) toast.error('Failed to update')
    else toast.success(`${staffMember.name} ${staffMember.isActive ? 'disabled' : 'enabled'}`)
  }

  async function handleDelete(staffMember) {
    if (staffMember.id === user?.id) return toast.error('You cannot delete your own account')
    const owners = staff.filter((s) => s.role === 'owner')
    if (staffMember.role === 'owner' && owners.length <= 1) {
      return toast.error('Cannot delete the last owner')
    }
    if (!window.confirm(`Delete staff "${staffMember.name}"?`)) return
    const { error } = await supabase.from('staff').delete().eq('id', staffMember.id)
    if (error) toast.error('Failed to delete')
    else toast.success('Staff deleted')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#F59E0B]" /> Staff & Access
          </h2>
          <p className="text-slate-400 text-sm">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#22C55E] text-[#052E16] font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#16A34A] transition cursor-pointer"
        >
          <UserPlus size={18} /> {showAdd ? 'Cancel' : 'Add Cashier'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Cashier name"
              className="w-full bg-[#334155] text-slate-100 rounded-xl px-3 py-2 text-sm border border-[#475569] placeholder-slate-500"
            />
            <input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              inputMode="numeric"
              className="w-full bg-[#334155] text-slate-100 rounded-xl px-3 py-2 text-sm border border-[#475569] placeholder-slate-500"
            />
          </div>
          <button onClick={handleAdd} className="bg-[#22C55E] text-[#052E16] font-bold px-4 py-2 rounded-xl hover:bg-[#16A34A] transition cursor-pointer">
            Save Cashier
          </button>
        </div>
      )}

      <div className="space-y-2">
        {staff.map((s) => (
          <div key={s.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              s.role === 'owner' ? 'bg-[#F59E0B] text-[#052E16]' : 'bg-[#334155] text-slate-300'
            }`}>
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{s.name}{s.id === user?.id ? ' (you)' : ''}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  s.role === 'owner' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#22C55E]/20 text-[#22C55E]'
                }`}>
                  {s.role.toUpperCase()}
                </span>
                {!s.isActive && <span className="text-[10px] text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded font-bold">DISABLED</span>}
              </div>
              <div className="text-xs text-slate-500 font-mono">PIN: {s.pin}</div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => { setEditing(editing?.id === s.id ? null : s); setEditPin('') }}
                className="p-2 text-slate-400 hover:text-[#22C55E] hover:bg-[#22C55E]/10 rounded-lg transition cursor-pointer"
                title="Change PIN"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleToggleActive(s)}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  s.isActive ? 'text-slate-400 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10' : 'text-[#22C55E] hover:bg-[#22C55E]/10'
                }`}
                title={s.isActive ? 'Disable account' : 'Enable account'}
              >
                <Power size={16} />
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition cursor-pointer"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {editing && (
          <div className="bg-[#334155] border border-[#22C55E]/40 rounded-xl p-3 flex items-center gap-3">
            <span className="text-sm text-slate-300 flex-1">New PIN for <strong>{editing.name}</strong></span>
            <input
              value={editPin}
              onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              inputMode="numeric"
              autoFocus
              className="w-32 bg-[#1E293B] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569] placeholder-slate-500"
            />
            <button onClick={() => handleSavePin(editing)} className="bg-[#22C55E] text-[#052E16] text-sm font-bold px-3 py-2 rounded-lg hover:bg-[#16A34A] transition cursor-pointer">
              Save
            </button>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white text-sm px-2 cursor-pointer">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
