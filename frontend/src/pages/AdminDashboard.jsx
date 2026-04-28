import { useEffect, useMemo, useState } from "react"

const STATUS_META = {
    pending: { label: "Pending", color: "#F0A500", chip: "bg-[#F0A500]/15 text-[#F0A500]" },
    approved: { label: "Approved", color: "#00BFA5", chip: "bg-[#00BFA5]/15 text-[#00BFA5]" },
    rejected: { label: "Rejected", color: "#FF6B6B", chip: "bg-[#FF6B6B]/15 text-[#FF6B6B]" },
}

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"]

const formatDate = (value) => {
    if (!value) return "-"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return "-"
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

const getCollegeLabel = (request) => {
    if (!request) return "-"
    const city = request.requested_college_city ? `, ${request.requested_college_city}` : ""
    return `${request.requested_college_name || "Unknown college"}${city}`
}

function AdminDashboard() {
    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [statusFilter, setStatusFilter] = useState("pending")
    const [searchTerm, setSearchTerm] = useState("")
    const [busyRequestId, setBusyRequestId] = useState("")
    const [passwordDrafts, setPasswordDrafts] = useState({})
    const [rejectionDrafts, setRejectionDrafts] = useState({})

    const fetchCollegeAdminRequests = async ({ silent = false } = {}) => {
        try {
            if (silent) setIsRefreshing(true)
            else setIsLoading(true)

            setError("")
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/college-admin-requests`, {
                credentials: "include",
            })
            const payload = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(payload?.message || "Could not fetch admin requests")
            }

            const nextItems = Array.isArray(payload?.data?.items) ? payload.data.items : []
            setRequests(nextItems)
        } catch (fetchError) {
            setRequests([])
            setError(fetchError?.message || "Unable to load requests")
        } finally {
            if (silent) setIsRefreshing(false)
            else setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCollegeAdminRequests()
    }, [])

    const filteredRequests = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        return requests.filter((request) => {
            const matchesStatus = statusFilter === "all" || request.status === statusFilter
            if (!matchesStatus) return false

            if (!normalizedSearch) return true
            const haystack = [
                request.full_name,
                request.email,
                request.requested_college_name,
                request.requested_college_email_domain,
                request.requested_college_city,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()

            return haystack.includes(normalizedSearch)
        })
    }, [requests, searchTerm, statusFilter])

    const stats = useMemo(() => {
        const base = { total: requests.length, pending: 0, approved: 0, rejected: 0 }
        for (const item of requests) {
            if (item.status === "pending") base.pending += 1
            if (item.status === "approved") base.approved += 1
            if (item.status === "rejected") base.rejected += 1
        }
        return base
    }, [requests])

    const onApprove = async (requestId) => {
        const initialPassword = (passwordDrafts[requestId] || "").trim()
        if (initialPassword.length < 8) {
            setError("Initial password must be at least 8 characters")
            return
        }

        try {
            setBusyRequestId(requestId)
            setError("")

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/college-admin-requests/${requestId}/approve`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ initialPassword }),
                }
            )

            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                throw new Error(payload?.message || "Failed to approve request")
            }

            setPasswordDrafts((prev) => ({ ...prev, [requestId]: "" }))
            await fetchCollegeAdminRequests({ silent: true })
        } catch (approveError) {
            setError(approveError?.message || "Failed to approve request")
        } finally {
            setBusyRequestId("")
        }
    }

    const onReject = async (requestId) => {
        const rejectionReason = (rejectionDrafts[requestId] || "").trim()
        if (!rejectionReason) {
            setError("Rejection reason is required")
            return
        }

        try {
            setBusyRequestId(requestId)
            setError("")

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/college-admin-requests/${requestId}/reject`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ rejectionReason }),
                }
            )

            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                throw new Error(payload?.message || "Failed to reject request")
            }

            setRejectionDrafts((prev) => ({ ...prev, [requestId]: "" }))
            await fetchCollegeAdminRequests({ silent: true })
        } catch (rejectError) {
            setError(rejectError?.message || "Failed to reject request")
        } finally {
            setBusyRequestId("")
        }
    }

    return (
        <div
            className="min-h-screen bg-[#070C16] text-[#E8E4DC]"
            style={{ fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif" }}
        >
            <style>{`
                .fd-admin{font-family:'Playfair Display',serif}
                @keyframes enterUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
                .enter{animation:enterUp .45s ease both}
                .glass{background:rgba(13,21,38,.76);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.07)}
            `}</style>

            <header className="relative overflow-hidden border-b border-white/8">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(circle at 20% 10%, rgba(240,165,0,0.15), transparent 45%), radial-gradient(circle at 85% 30%, rgba(0,191,165,0.13), transparent 42%)",
                    }}
                />
                <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-12">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#4A5568] mb-2">Admin Console</p>
                    <h1 className="fd-admin text-3xl md:text-5xl font-bold leading-tight">
                        College Onboarding <em className="font-normal italic text-[#F0A500]">Control Room</em>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm md:text-base text-[#7A8494]">
                        Review incoming college admin requests, verify eligibility, and approve or reject with a transparent decision trail.
                    </p>

                    <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Total", value: stats.total, accent: "#7B8FFF" },
                            { label: "Pending", value: stats.pending, accent: "#F0A500" },
                            { label: "Approved", value: stats.approved, accent: "#00BFA5" },
                            { label: "Rejected", value: stats.rejected, accent: "#FF6B6B" },
                        ].map((card, idx) => (
                            <article
                                key={card.label}
                                className="enter rounded-2xl p-4"
                                style={{
                                    background: "rgba(13,21,38,0.72)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    animationDelay: `${idx * 0.06}s`,
                                    opacity: 0,
                                }}
                            >
                                <p className="text-xs text-[#4A5568]">{card.label}</p>
                                <p className="fd-admin text-2xl font-bold mt-0.5" style={{ color: card.accent }}>
                                    {card.value}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-8">
                <section className="glass rounded-2xl p-4 md:p-5 mb-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTERS.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                                        statusFilter === key
                                            ? "bg-[#F0A500] text-[#07111F]"
                                            : "bg-white/4 border border-white/10 text-[#7A8494] hover:text-[#E8E4DC]"
                                    }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 md:max-w-sm">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search by name, email, or college"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-[#3A4455]"
                            />
                        </div>

                        <button
                            onClick={() => fetchCollegeAdminRequests({ silent: true })}
                            disabled={isRefreshing}
                            className="rounded-xl px-4 py-2 text-xs font-semibold bg-[#7B8FFF]/18 text-[#9EACFF] border border-[#7B8FFF]/25 hover:bg-[#7B8FFF]/26 disabled:opacity-60"
                        >
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </section>

                {error ? (
                    <section className="rounded-2xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-200 mb-5">
                        {error}
                    </section>
                ) : null}

                {isLoading ? (
                    <section className="glass rounded-2xl px-4 py-16 text-center text-sm text-[#7A8494]">
                        Loading admin requests...
                    </section>
                ) : filteredRequests.length === 0 ? (
                    <section className="glass rounded-2xl px-4 py-16 text-center">
                        <p className="fd-admin text-2xl text-[#E8E4DC]">No requests found</p>
                        <p className="text-sm text-[#7A8494] mt-1">Try another filter or update your search terms.</p>
                    </section>
                ) : (
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredRequests.map((request, index) => {
                            const status = request.status || "pending"
                            const statusMeta = STATUS_META[status] || STATUS_META.pending
                            const isPending = status === "pending"
                            const isBusy = busyRequestId === request.id

                            return (
                                <article
                                    key={request.id}
                                    className="enter glass rounded-2xl p-4"
                                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <p className="fd-admin text-xl leading-tight">{request.full_name}</p>
                                            <p className="text-xs text-[#7A8494] mt-0.5">{request.email}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.chip}`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-[#4A5568]">College</p>
                                            <p className="text-[#C8CDD6] mt-0.5">{getCollegeLabel(request)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#4A5568]">Domain</p>
                                            <p className="text-[#C8CDD6] mt-0.5">{request.requested_college_email_domain || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#4A5568]">Requested On</p>
                                            <p className="text-[#C8CDD6] mt-0.5">{formatDate(request.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#4A5568]">Designation</p>
                                            <p className="text-[#C8CDD6] mt-0.5">{request.designation || "-"}</p>
                                        </div>
                                    </div>

                                    {request.reason ? (
                                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-[#4A5568] mb-1">Reason</p>
                                            <p className="text-xs text-[#AAB1BE] leading-relaxed">{request.reason}</p>
                                        </div>
                                    ) : null}

                                    {request.rejection_reason ? (
                                        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-950/20 p-3">
                                            <p className="text-[11px] uppercase tracking-[0.12em] text-red-300 mb-1">Rejection Note</p>
                                            <p className="text-xs text-red-200 leading-relaxed">{request.rejection_reason}</p>
                                        </div>
                                    ) : null}

                                    {isPending ? (
                                        <div className="mt-4 pt-3 border-t border-white/8 space-y-2.5">
                                            <input
                                                type="text"
                                                value={passwordDrafts[request.id] || ""}
                                                onChange={(event) =>
                                                    setPasswordDrafts((prev) => ({
                                                        ...prev,
                                                        [request.id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="Initial password for approved admin (min 8 chars)"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:text-[#3A4455]"
                                            />
                                            <textarea
                                                rows={2}
                                                value={rejectionDrafts[request.id] || ""}
                                                onChange={(event) =>
                                                    setRejectionDrafts((prev) => ({
                                                        ...prev,
                                                        [request.id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="Reason if rejecting this request"
                                                className="w-full resize-none bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:text-[#3A4455]"
                                            />

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onApprove(request.id)}
                                                    disabled={isBusy}
                                                    className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold bg-[#00BFA5]/16 text-[#00D6B8] border border-[#00BFA5]/25 hover:bg-[#00BFA5]/24 disabled:opacity-60"
                                                >
                                                    {isBusy ? "Working..." : "Approve"}
                                                </button>
                                                <button
                                                    onClick={() => onReject(request.id)}
                                                    disabled={isBusy}
                                                    className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold bg-[#FF6B6B]/16 text-[#FF8B8B] border border-[#FF6B6B]/25 hover:bg-[#FF6B6B]/24 disabled:opacity-60"
                                                >
                                                    {isBusy ? "Working..." : "Reject"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 pt-3 border-t border-white/8 text-[11px] text-[#4A5568]">
                                            Reviewed on {formatDate(request.reviewed_at)}
                                        </div>
                                    )}
                                </article>
                            )
                        })}
                    </section>
                )}
            </main>
        </div>
    )
}

export default AdminDashboard