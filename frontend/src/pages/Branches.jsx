import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import GoogleMapPicker from '../components/GoogleMapPicker'
import { useAuth } from '../context/AuthContext'

const emptyBranch = {
  branch: '',
  address: '',
  eta: '',
  deliveryFee: '',
  minOrder: '',
  location: null,
}

const emptyInvite = {
  name: '',
  email: '',
}

export default function Branches() {
  const { user, refresh } = useAuth()
  const [group, setGroup] = useState(user?.group || null)
  const [branches, setBranches] = useState(user?.branches || [])
  const [branchForm, setBranchForm] = useState(emptyBranch)
  const [inviteForm, setInviteForm] = useState(emptyInvite)
  const [inviteBranchId, setInviteBranchId] = useState('')
  const [inviteType, setInviteType] = useState('manager')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [nextGroup, nextBranches] = await Promise.all([
        api.getMyGroup(),
        api.getMyBranches(),
      ])
      setGroup(nextGroup)
      setBranches(nextBranches || [])
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreateBranch(event) {
    event.preventDefault()
    if (!group?.id) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.createBranch(group.id, {
        branch: branchForm.branch.trim(),
        address: branchForm.address.trim(),
        eta: branchForm.eta.trim(),
        deliveryFee: Number(branchForm.deliveryFee || 0),
        minOrder: Number(branchForm.minOrder || 0),
        location: branchForm.location,
      })
      setBranchForm(emptyBranch)
      setMessage('Branch created')
      await refresh()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(event) {
    event.preventDefault()
    if (!inviteBranchId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
      }
      const result =
        inviteType === 'manager'
          ? await api.inviteBranchManager(inviteBranchId, payload)
          : await api.inviteRider(inviteBranchId, payload)
      setInviteForm(emptyInvite)
      const preview = result.email?.preview
      setMessage(
        result.email?.delivered
          ? `Invite sent to ${payload.email}`
          : preview
            ? `SMTP not configured — credentials logged on backend:\n${preview}`
            : 'Account created',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="custom-scrollbar h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Branches & staff</h2>
        <p className="mt-1 text-on-surface-variant">
          Add restaurant branches and invite branch managers or riders by email.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}
      {message ? (
        <pre className="mb-4 whitespace-pre-wrap rounded-xl bg-primary/10 p-4 text-sm text-primary">
          {message}
        </pre>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleCreateBranch}
          className="rounded-xl bg-white p-6 shadow-sm"
        >
          <h3 className="font-bold">Add branch</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Brand: {group?.name || 'Create your brand from the dashboard first'}
          </p>
          <div className="mt-4 grid gap-3">
            <input
              required
              disabled={!group?.id}
              value={branchForm.branch}
              onChange={(e) => setBranchForm({ ...branchForm, branch: e.target.value })}
              placeholder="Branch name, e.g. Gulberg"
              className="rounded-xl border border-outline-variant/40 px-4 py-3 disabled:opacity-50"
            />
            <input
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              placeholder="Address"
              className="rounded-xl border border-outline-variant/40 px-4 py-3"
            />
            <GoogleMapPicker
              label="Branch map pin"
              address={branchForm.address}
              onAddressChange={(address) =>
                setBranchForm((prev) => ({ ...prev, address }))
              }
              value={branchForm.location}
              onChange={(location) =>
                setBranchForm((prev) => ({ ...prev, location }))
              }
              height={240}
            />
            <input
              value={branchForm.eta}
              onChange={(e) => setBranchForm({ ...branchForm, eta: e.target.value })}
              placeholder="Delivery ETA"
              className="rounded-xl border border-outline-variant/40 px-4 py-3"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={branchForm.deliveryFee}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, deliveryFee: e.target.value })
                }
                placeholder="Delivery fee"
                className="rounded-xl border border-outline-variant/40 px-4 py-3"
              />
              <input
                type="number"
                min="0"
                value={branchForm.minOrder}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, minOrder: e.target.value })
                }
                placeholder="Minimum order"
                className="rounded-xl border border-outline-variant/40 px-4 py-3"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !group?.id}
            className="mt-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create branch'}
          </button>
        </form>

        <form onSubmit={handleInvite} className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-bold">Invite staff</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Sends login credentials by email (or logs them in dev if SMTP is off).
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setInviteType('manager')}
              className={`rounded-lg py-2 text-sm font-semibold ${
                inviteType === 'manager' ? 'bg-white text-primary shadow' : ''
              }`}
            >
              Branch manager
            </button>
            <button
              type="button"
              onClick={() => setInviteType('rider')}
              className={`rounded-lg py-2 text-sm font-semibold ${
                inviteType === 'rider' ? 'bg-white text-primary shadow' : ''
              }`}
            >
              Rider
            </button>
          </div>
          <select
            required
            value={inviteBranchId}
            onChange={(e) => setInviteBranchId(e.target.value)}
            className="mt-4 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch}
                {branch.branchManagerId && inviteType === 'manager' ? ' (has manager)' : ''}
              </option>
            ))}
          </select>
          <input
            required
            value={inviteForm.name}
            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
            placeholder="Full name"
            className="mt-3 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
          />
          <input
            required
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            placeholder="Email"
            className="mt-3 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
          />
          <button
            type="submit"
            disabled={saving || !inviteBranchId}
            className="mt-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="font-bold">Your branches</h3>
        {branches.length === 0 ? (
          <p className="mt-3 text-sm text-on-surface-variant">No branches yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-outline-variant/20">
            {branches.map((branch) => (
              <li key={branch.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold">{branch.branch}</p>
                  <p className="text-sm text-on-surface-variant">
                    {branch.address || 'No address'} · {branch.eta || 'ETA not set'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    branch.branchManagerId
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {branch.branchManagerId ? 'Manager assigned' : 'Needs manager'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
