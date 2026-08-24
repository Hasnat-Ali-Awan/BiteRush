import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import GoogleMapPicker from '../components/GoogleMapPicker'
import { useAuth } from '../context/AuthContext'

const ETA_PRESETS = ['15-25 min', '25-35 min', '30-45 min', '45-60 min']

const emptyBranch = {
  branch: '',
  address: '',
  eta: '25-35 min',
  deliveryFee: '150',
  minOrder: '0',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [branchForm, setBranchForm] = useState(emptyBranch)
  const [inviteForm, setInviteForm] = useState(emptyInvite)
  const [inviteBranchId, setInviteBranchId] = useState('')
  const [inviteType, setInviteType] = useState('manager')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState('')

  // Modals state
  const [deletingBranch, setDeletingBranch] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [editingBranch, setEditingBranch] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

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

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches
    const q = searchQuery.toLowerCase().trim()
    return branches.filter(
      (b) =>
        b.branch.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)),
    )
  }, [branches, searchQuery])

  // --- Branch Creation ---
  async function handleCreateBranch(event) {
    event.preventDefault()
    if (!group?.id) {
      setError('Please create your brand first')
      return
    }

    const trimmedName = branchForm.branch.trim()
    if (trimmedName.length < 2) {
      setError('Branch name must be at least 2 characters long')
      return
    }

    // Duplicate check in client state
    const duplicate = branches.some(
      (b) => b.branch.toLowerCase() === trimmedName.toLowerCase(),
    )
    if (duplicate) {
      setError(`A branch named "${trimmedName}" already exists in your brand`)
      return
    }

    if (!branchForm.address.trim()) {
      setError('Please provide a valid branch address or search for one on the map')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.createBranch(group.id, {
        branch: trimmedName,
        address: branchForm.address.trim(),
        eta: branchForm.eta.trim(),
        deliveryFee: Number(branchForm.deliveryFee || 0),
        minOrder: Number(branchForm.minOrder || 0),
        location: branchForm.location,
      })
      setBranchForm(emptyBranch)
      setMessage(`Branch "${trimmedName}" created successfully!`)
      await refresh()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // --- Branch Edit ---
  function openEditModal(branch) {
    setEditingBranch(branch)
    setEditForm({
      branch: branch.branch,
      address: branch.address || '',
      eta: branch.eta || '25-35 min',
      deliveryFee: String(branch.deliveryFee ?? 0),
      minOrder: String(branch.minOrder ?? 0),
      location: branch.location || null,
    })
    setEditError('')
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    if (!group?.id || !editingBranch?.id) return

    const trimmedName = editForm.branch.trim()
    if (trimmedName.length < 2) {
      setEditError('Branch name must be at least 2 characters')
      return
    }

    // Duplicate check against other branches
    const duplicate = branches.some(
      (b) =>
        b.id !== editingBranch.id &&
        b.branch.toLowerCase() === trimmedName.toLowerCase(),
    )
    if (duplicate) {
      setEditError(`Another branch is already named "${trimmedName}"`)
      return
    }

    if (!editForm.address.trim()) {
      setEditError('Branch address cannot be empty')
      return
    }

    setEditSaving(true)
    setEditError('')
    try {
      await api.updateBranch(group.id, editingBranch.id, {
        branch: trimmedName,
        address: editForm.address.trim(),
        eta: editForm.eta.trim(),
        deliveryFee: Number(editForm.deliveryFee || 0),
        minOrder: Number(editForm.minOrder || 0),
        location: editForm.location,
      })
      setEditingBranch(null)
      setMessage(`Branch "${trimmedName}" updated successfully!`)
      await refresh()
      await load()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  // --- Branch Deletion ---
  async function handleConfirmDelete() {
    if (!group?.id || !deletingBranch?.id) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await api.deleteBranch(group.id, deletingBranch.id)
      setDeletingBranch(null)
      setMessage(res.message || `Branch "${deletingBranch.branch}" was deleted.`)
      await refresh()
      await load()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // --- Staff Invite ---
  async function handleInvite(event) {
    event.preventDefault()
    if (!inviteBranchId) {
      setError('Please choose a branch to assign this staff member')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteForm.email.trim())) {
      setError('Please provide a valid email address (e.g. name@example.com)')
      return
    }

    if (inviteForm.name.trim().length < 2) {
      setError('Staff name must be at least 2 characters')
      return
    }

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
          ? `✓ Invite email sent to ${payload.email}`
          : preview
            ? `✓ Account created! SMTP credentials logged on backend:\n${preview}`
            : `✓ Account created for ${payload.name}`,
      )
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCopyId(id) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div className="custom-scrollbar h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branches & staff</h2>
          <p className="mt-1 text-on-surface-variant">
            Manage your brand locations, set delivery zones, and invite staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-sm">
            Total Branches: <strong className="text-primary">{branches.length}</strong>
          </span>
        </div>
      </div>

      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 flex items-start justify-between rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          <pre className="whitespace-pre-wrap font-sans font-medium">{message}</pre>
          <button
            type="button"
            onClick={() => setMessage('')}
            className="font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ADD BRANCH FORM */}
        <form
          onSubmit={handleCreateBranch}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Add new branch</h3>
            <span className="text-xs font-semibold text-on-surface-variant">
              Brand: {group?.name || 'Create Brand First'}
            </span>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Create a branch location with exact Google Maps coordinates and delivery settings.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Branch Name *
              </label>
              <input
                required
                disabled={!group?.id}
                value={branchForm.branch}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, branch: e.target.value })
                }
                placeholder="e.g. Gulberg, DHA Phase 5, F-7 Markaz"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div>
              <GoogleMapPicker
                label="Branch Map Location & Address *"
                required
                address={branchForm.address}
                onAddressChange={(address) =>
                  setBranchForm((prev) => ({ ...prev, address }))
                }
                value={branchForm.location}
                onChange={(location) =>
                  setBranchForm((prev) => ({ ...prev, location }))
                }
                height={220}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Delivery ETA
              </label>
              <input
                value={branchForm.eta}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, eta: e.target.value })
                }
                placeholder="e.g. 25-35 min"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ETA_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setBranchForm((prev) => ({ ...prev, eta: preset }))
                    }
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      branchForm.eta === preset
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-outline-variant/30'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Delivery Fee (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={branchForm.deliveryFee}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, deliveryFee: e.target.value })
                  }
                  placeholder="150"
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Min Order (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={branchForm.minOrder}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, minOrder: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !group?.id}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:opacity-50"
          >
            {saving ? 'Creating branch…' : '+ Add branch'}
          </button>
        </form>

        {/* INVITE STAFF FORM */}
        <form
          onSubmit={handleInvite}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <h3 className="text-lg font-bold">Invite branch staff</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Assign managers or delivery riders directly to a specific branch.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setInviteType('manager')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                inviteType === 'manager'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Branch manager
            </button>
            <button
              type="button"
              onClick={() => setInviteType('rider')}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                inviteType === 'rider'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Delivery rider
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Select Branch *
              </label>
              <select
                required
                value={inviteBranchId}
                onChange={(e) => setInviteBranchId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Choose target branch…</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch}
                    {branch.branchManagerId && inviteType === 'manager'
                      ? ' (has manager)'
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Full Name *
              </label>
              <input
                required
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, name: e.target.value })
                }
                placeholder="e.g. Ali Ahmed"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Email Address *
              </label>
              <input
                required
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="staff@example.com"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-surface-container p-3 text-xs text-on-surface-variant">
            {inviteType === 'manager' ? (
              <p>
                <strong>Branch Manager:</strong> Can manage menu items, accept orders, control kitchen workflow, and handle table reservations for this branch only.
              </p>
            ) : (
              <p>
                <strong>Rider:</strong> Accesses the rider app (`/rider`) to claim ready orders, update delivery progress, and broadcast live GPS location.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !inviteBranchId}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:opacity-50"
          >
            {saving ? 'Sending invite…' : `Send ${inviteType} invite`}
          </button>
        </form>
      </div>

      {/* BRANCHES LIST & MANAGEMENT */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="text-lg font-bold">Configured branches</h3>
            <p className="text-sm text-on-surface-variant">
              Edit branch details, update delivery pins, or delete unused branches.
            </p>
          </div>
          {branches.length > 3 ? (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter branches…"
                className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {filteredBranches.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant">
            <p className="text-4xl">📍</p>
            <p className="mt-2 font-semibold">
              {searchQuery ? 'No matching branches found' : 'No branches created yet'}
            </p>
            <p className="mt-1 text-sm">
              Use the "Add new branch" form above to create your first restaurant location.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-on-surface">
                        {branch.branch}
                      </h4>
                      <p className="text-xs text-on-surface-variant">{group?.name}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        branch.branchManagerId
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {branch.branchManagerId ? 'Manager active' : 'No manager'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-on-surface-variant">
                    <p className="flex items-start gap-1.5">
                      <span className="shrink-0 text-sm">📍</span>
                      <span className="line-clamp-2">{branch.address || 'Address not set'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="shrink-0 text-sm">⏱️</span>
                      <span>ETA: {branch.eta || '25-35 min'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="shrink-0 text-sm">🛵</span>
                      <span>
                        Delivery fee: Rs. {branch.deliveryFee ?? 0} · Min order: Rs. {branch.minOrder ?? 0}
                      </span>
                    </p>
                    {branch.location?.lat ? (
                      <p className="text-[11px] text-emerald-600">
                        ● GPS Pin: {branch.location.lat.toFixed(3)}, {branch.location.lng.toFixed(3)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-600">⚠ No map pin set</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-outline-variant/20 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(branch)}
                      className="rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-container"
                    >
                      ✏ Edit
                    </button>
                    <Link
                      to={`/restaurants/${branch.id}`}
                      target="_blank"
                      className="rounded-lg border border-outline-variant/40 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                      title="Preview branch in customer view"
                    >
                      ↗ View
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyId(branch.id)}
                      className="rounded-lg p-1.5 text-xs text-on-surface-variant transition hover:bg-surface-container"
                      title="Copy branch ID"
                    >
                      {copiedId === branch.id ? '✓ Copied' : '📋 ID'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingBranch(branch)
                        setDeleteError('')
                      }}
                      className="rounded-lg border border-error/20 bg-error/5 px-2.5 py-1.5 text-xs font-semibold text-error transition hover:bg-error hover:text-white"
                      title="Delete branch"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EDIT MODAL */}
      {editingBranch && editForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit branch: {editingBranch.branch}</h3>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            {editError ? (
              <p className="mt-3 rounded-lg bg-error/10 p-3 text-xs text-error">
                {editError}
              </p>
            ) : null}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Branch Name *
                </label>
                <input
                  required
                  value={editForm.branch}
                  onChange={(e) =>
                    setEditForm({ ...editForm, branch: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <GoogleMapPicker
                  label="Branch Pin & Address *"
                  required
                  address={editForm.address}
                  onAddressChange={(address) =>
                    setEditForm((prev) => ({ ...prev, address }))
                  }
                  value={editForm.location}
                  onChange={(location) =>
                    setEditForm((prev) => ({ ...prev, location }))
                  }
                  height={200}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Delivery ETA
                </label>
                <input
                  value={editForm.eta}
                  onChange={(e) =>
                    setEditForm({ ...editForm, eta: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ETA_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({ ...prev, eta: preset }))
                      }
                      className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                        editForm.eta === preset
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Delivery Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={editForm.deliveryFee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, deliveryFee: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Min Order (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={editForm.minOrder}
                    onChange={(e) =>
                      setEditForm({ ...editForm, minOrder: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="rounded-xl border border-outline-variant/40 px-4 py-2.5 font-semibold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50"
                >
                  {editSaving ? 'Saving changes…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBranch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-2xl text-error">
              ⚠️
            </div>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              Delete Branch "{deletingBranch.branch}"?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Are you sure you want to delete this branch? This action will permanently remove:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-on-surface-variant">
              <li>All menu items & categories specific to this branch</li>
              <li>Table reservations history</li>
              <li>Manager and rider assignments</li>
            </ul>

            {deleteError ? (
              <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
                {deleteError}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingBranch(null)}
                className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-error/20 transition hover:opacity-95 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting branch…' : 'Yes, delete branch'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
