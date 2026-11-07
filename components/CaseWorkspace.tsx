import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api';

type CaseStatus = 'submitted' | 'under_review' | 'accepted' | 'in_progress' | 'pending_external_response' | 'recovered' | 'closed' | 'rejected';
interface CaseRow {
  id: string; case_reference: string; category: string; status: CaseStatus;
  priority: string; summary: string; created_at: string; updated_at: string;
  active_assignment_count: number;
}
interface CaseDetail extends CaseRow {
  assignments: Array<{ id: string; assigned_to_user_id: string; assignment_reason: string; status: string; assigned_at: string; released_at?: string }>;
  timeline: Array<{ id: string; event_type: string; description: string; occurred_at: string; actor_user_id: string }>;
  authorizations: Array<{ id: string; requested_action: string; purpose: string; status: string; valid_until: string }>;
}
interface Props { apiBaseUrl: string; token: string; organizationId: string; role: string; }
const statuses: CaseStatus[] = ['submitted','under_review','accepted','in_progress','pending_external_response','recovered','closed','rejected'];
const transitions: Record<CaseStatus, CaseStatus[]> = {
  submitted: ['under_review','rejected'], under_review: ['accepted','rejected'], accepted: ['in_progress'],
  in_progress: ['pending_external_response','recovered'], pending_external_response: ['in_progress','recovered'],
  recovered: ['in_progress','closed'], closed: [], rejected: []
};
const label = (value: string) => value.replaceAll('_', ' ');
const date = (value: string) => new Date(value).toLocaleString();

const CaseWorkspace: React.FC<Props> = ({ apiBaseUrl, token, organizationId, role }) => {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState('phone_theft');
  const [priority, setPriority] = useState('normal');
  const [summary, setSummary] = useState('');
  const [nextStatus, setNextStatus] = useState<CaseStatus>('under_review');
  const [statusReason, setStatusReason] = useState('');
  const [assignee, setAssignee] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const staff = role === 'organization_admin' || role === 'investigator';

  const request = useCallback(<T,>(path: string, init?: RequestInit) =>
    apiRequest<T>(apiBaseUrl, token, organizationId, path, init), [apiBaseUrl, token, organizationId]);

  const loadCases = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await request<{ data: CaseRow[] }>('/v1/cases?limit=100');
      setCases(result.data);
      if (selectedId && !result.data.some(item => item.id === selectedId)) setSelectedId(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load cases.'); }
    finally { setLoading(false); }
  }, [request, selectedId]);

  const loadDetail = useCallback(async (caseId: string) => {
    setError('');
    try {
      const result = await request<{ data: CaseDetail }>(`/v1/cases/${caseId}`);
      setDetail(result.data);
      setNextStatus(transitions[result.data.status][0] ?? result.data.status);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load case details.'); }
  }, [request]);

  useEffect(() => { void loadCases(); }, [loadCases]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null); }, [selectedId, loadDetail]);

  const run = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); setNotice(success); await loadCases(); if (selectedId) await loadDetail(selectedId); }
    catch (err) { setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'The action failed.'); }
    finally { setBusy(false); }
  };

  const createCase = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const result = await request<{ data: CaseRow }>('/v1/cases', {
        method: 'POST', body: JSON.stringify({ category, priority, summary })
      });
      setShowCreate(false); setSummary(''); setSelectedId(result.data.id);
    }, 'Case created successfully.');
  };

  const updateStatus = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    void run(() => request(`/v1/cases/${selectedId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: statusReason })
    }), 'Case status updated.');
    setStatusReason('');
  };

  const assignCase = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    void run(() => request(`/v1/cases/${selectedId}/assignments`, {
      method: 'POST', body: JSON.stringify({ assigneeUserId: assignee, reason: assignmentReason })
    }), 'Investigator assignment recorded.');
    setAssignee(''); setAssignmentReason('');
  };

  const releaseAssignment = (assignmentId: string) => {
    if (!selectedId) return;
    void run(() => request(`/v1/cases/${selectedId}/assignments/${assignmentId}`, { method: 'DELETE' }), 'Assignment released.');
  };

  const selected = useMemo(() => cases.find(item => item.id === selectedId), [cases, selectedId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-brand-accent font-bold">Authenticated workspace</p><h1 className="mt-1 text-2xl font-black text-white">Case management</h1><p className="mt-2 text-sm text-brand-text-secondary">Live records returned by the configured IPTIRS API. Use synthetic test records until an institution approves real-data operation.</p></div>
        <div className="flex gap-2"><button onClick={() => void loadCases()} className="rounded border border-brand-light px-4 py-2 text-sm text-white hover:bg-brand-light/30">Refresh</button>{staff && <button onClick={() => setShowCreate(v => !v)} className="rounded bg-brand-accent px-4 py-2 text-sm font-bold text-white">{showCreate ? 'Cancel' : 'Create case'}</button>}</div>
      </div>

      {error && <div role="alert" className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}

      {showCreate && <form onSubmit={createCase} className="rounded-lg border border-brand-light bg-brand-secondary p-5 space-y-4">
        <h2 className="font-bold text-white">Create a case</h2>
        <p className="text-xs text-amber-200">Use synthetic information in development. Do not submit real citizen or investigative details to an unapproved deployment.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-brand-text-secondary">Category<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-white"><option value="phone_theft">Phone theft</option><option value="device_loss">Device loss</option><option value="institutional_asset_loss">Institutional asset loss</option></select></label>
          <label className="text-sm text-brand-text-secondary">Priority<select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-white"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        </div>
        <label className="block text-sm text-brand-text-secondary">Case summary<textarea required minLength={10} maxLength={4000} rows={3} value={summary} onChange={e => setSummary(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-3 text-white" placeholder="Describe the synthetic incident and relevant context..." /></label>
        <button disabled={busy} className="rounded bg-brand-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Create case'}</button>
      </form>}

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
        <section className="overflow-hidden rounded-lg border border-brand-light bg-brand-secondary">
          <div className="border-b border-brand-light p-4"><h2 className="font-bold text-white">Cases <span className="ml-2 text-xs font-normal text-brand-text-secondary">{cases.length} records</span></h2></div>
          {loading ? <p className="p-5 text-sm text-brand-text-secondary">Loading cases…</p> : cases.length === 0 ? <p className="p-5 text-sm text-brand-text-secondary">No cases are visible to this account.</p> :
            <ul className="divide-y divide-brand-light/60">{cases.map(item => <li key={item.id}><button onClick={() => setSelectedId(item.id)} className={`w-full p-4 text-left transition hover:bg-brand-light/20 ${selectedId === item.id ? 'bg-brand-accent/10 border-l-2 border-brand-accent' : ''}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-bold text-brand-accent">{item.case_reference}</span><span className="rounded border border-brand-light px-2 py-1 text-[10px] uppercase text-brand-text-secondary">{label(item.status)}</span></div><p className="mt-2 line-clamp-2 text-sm text-white">{item.summary}</p><p className="mt-2 text-xs text-brand-text-secondary">{label(item.category)} · {label(item.priority)} · {item.active_assignment_count} active assignments</p></button></li>)}</ul>}
        </section>

        <section className="min-w-0 rounded-lg border border-brand-light bg-brand-secondary p-5">
          {!detail ? <div className="flex min-h-64 items-center justify-center text-center text-sm text-brand-text-secondary">Select a case to inspect its details, assignments and timeline.</div> : <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-light pb-4"><div><p className="font-mono text-sm text-brand-accent">{detail.case_reference}</p><h2 className="mt-1 text-xl font-bold text-white">{label(detail.category)}</h2><p className="mt-2 text-sm text-brand-text-secondary">{detail.summary}</p></div><span className="rounded border border-brand-light px-3 py-1 text-xs uppercase text-white">{label(detail.status)}</span></div>
            <div className="grid gap-3 py-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-brand-text-secondary">Priority</p><p className="mt-1 text-white">{label(detail.priority)}</p></div><div><p className="text-xs text-brand-text-secondary">Created</p><p className="mt-1 text-white">{date(detail.created_at)}</p></div><div><p className="text-xs text-brand-text-secondary">Updated</p><p className="mt-1 text-white">{date(detail.updated_at)}</p></div></div>
            {staff && transitions[detail.status].length > 0 && <form onSubmit={updateStatus} className="grid gap-3 rounded border border-brand-light bg-brand-dark/50 p-4 md:grid-cols-[1fr_2fr_auto] md:items-end"><label className="text-xs text-brand-text-secondary">Next status<select value={nextStatus} onChange={e => setNextStatus(e.target.value as CaseStatus)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-sm text-white">{transitions[detail.status].map(status => <option key={status} value={status}>{label(status)}</option>)}</select></label><label className="text-xs text-brand-text-secondary">Reason<input required minLength={10} maxLength={1000} value={statusReason} onChange={e => setStatusReason(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-sm text-white" placeholder="Explain the status transition..." /></label><button disabled={busy || !statusReason.trim()} className="rounded bg-brand-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Update status</button></form>}
            {staff && <form onSubmit={assignCase} className="mt-4 grid gap-3 rounded border border-brand-light p-4 md:grid-cols-2"><div className="md:col-span-2"><h3 className="text-sm font-bold text-white">Assign investigator</h3><p className="mt-1 text-xs text-brand-text-secondary">Enter the UUID of an active investigator or organization administrator in this organization.</p></div><label className="text-xs text-brand-text-secondary">Assignee user ID<input required pattern="[0-9a-fA-F-]{36}" value={assignee} onChange={e => setAssignee(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-sm text-white" placeholder="UUID" /></label><label className="text-xs text-brand-text-secondary">Reason<input required minLength={5} maxLength={500} value={assignmentReason} onChange={e => setAssignmentReason(e.target.value)} className="mt-1 block w-full rounded border border-brand-light bg-brand-dark p-2 text-sm text-white" placeholder="Assignment rationale" /></label><div className="md:col-span-2"><button disabled={busy} className="rounded border border-brand-accent px-3 py-2 text-xs font-bold text-brand-accent disabled:opacity-50">Record assignment</button></div></form>}
            <div className="mt-5"><h3 className="mb-3 font-bold text-white">Assignment history</h3>{detail.assignments.length === 0 ? <p className="text-xs text-brand-text-secondary">No assignments recorded.</p> : <ul className="space-y-2">{detail.assignments.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-brand-light p-3 text-xs"><div><p className="font-mono text-brand-accent">{item.assigned_to_user_id}</p><p className="mt-1 text-brand-text-secondary">{item.assignment_reason} · {label(item.status)}</p></div>{staff && item.status === 'active' && <button onClick={() => releaseAssignment(item.id)} disabled={busy} className="text-red-300 hover:text-red-200">Release</button>}</li>)}</ul>}</div>
            <div className="mt-5"><h3 className="mb-3 font-bold text-white">Case timeline</h3>{detail.timeline.length === 0 ? <p className="text-xs text-brand-text-secondary">No timeline events.</p> : <ol className="space-y-3 border-l border-brand-light pl-4">{detail.timeline.map(event => <li key={event.id} className="relative"><span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brand-accent" /><p className="text-xs font-bold uppercase text-brand-accent">{label(event.event_type)}</p><p className="mt-1 text-sm text-white">{event.description}</p><p className="mt-1 text-[11px] text-brand-text-secondary">{date(event.occurred_at)} · Actor {event.actor_user_id}</p></li>)}</ol>}</div>
            <div className="mt-5"><h3 className="mb-3 font-bold text-white">Authorization requests</h3>{detail.authorizations.length === 0 ? <p className="text-xs text-brand-text-secondary">No sensitive requests recorded.</p> : <ul className="space-y-2">{detail.authorizations.map(item => <li key={item.id} className="rounded border border-brand-light p-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><strong className="text-white">{label(item.requested_action)}</strong><span className="uppercase text-brand-accent">{label(item.status)}</span></div><p className="mt-1 text-brand-text-secondary">{item.purpose}</p><p className="mt-1 text-brand-text-secondary">Expires {date(item.valid_until)}</p></li>)}</ul>}</div>
          </>}
        </section>
      </div>
    </div>
  );
};

export default CaseWorkspace;
