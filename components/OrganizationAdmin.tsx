import React, { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api';

interface Member { userId: string; email: string; displayName: string; role: string; status: string; joinedAt: string; }
interface Props { apiBaseUrl: string; token: string; organizationId: string; currentUserId: string; }
const roles = ['organization_admin','investigator','authorization_approver','operator_liaison','auditor','reporter'];
const OrganizationAdmin: React.FC<Props> = ({ apiBaseUrl, token, organizationId, currentUserId }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await apiRequest<{data: Member[]}>(apiBaseUrl, token, organizationId, '/v1/organization/members'); setMembers(result.data); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not load organization members.'); }
    finally { setLoading(false); }
  }, [apiBaseUrl, token, organizationId]);
  useEffect(() => { void load(); }, [load]);
  const update = async (member: Member, changes: Partial<Pick<Member, 'role'|'status'>>) => {
    setBusyId(member.userId); setError(''); setNotice('');
    try {
      await apiRequest(apiBaseUrl, token, organizationId, `/v1/organization/members/${member.userId}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setNotice(`Membership updated for ${member.displayName}.`);
      await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Membership update failed.'); }
    finally { setBusyId(''); }
  };
  return <div className="space-y-6">
    <div><p className="text-xs uppercase tracking-[0.2em] text-brand-accent font-bold">Institutional administration</p><h1 className="mt-1 text-2xl font-black text-white">Organization access</h1><p className="mt-2 text-sm text-brand-text-secondary">Review existing organization memberships, assign roles and suspend or revoke access. Every change is audited.</p></div>
    <div className="rounded border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"><strong>Provisioning boundary:</strong> this page does not invite users or create identity-provider accounts. Members must already exist in the institution's OIDC directory and IPTIRS user directory. Administrators cannot edit their own membership or remove the last active administrator.</div>
    {error && <div role="alert" className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
    {notice && <div role="status" className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}
    <section className="overflow-hidden rounded-lg border border-brand-light bg-brand-secondary">
      <div className="flex items-center justify-between border-b border-brand-light p-4"><h2 className="font-bold text-white">Members <span className="ml-2 text-xs font-normal text-brand-text-secondary">{members.length}</span></h2><button onClick={() => void load()} className="text-xs text-brand-accent">Refresh</button></div>
      {loading ? <p className="p-5 text-sm text-brand-text-secondary">Loading members…</p> : members.length === 0 ? <p className="p-5 text-sm text-brand-text-secondary">No memberships were returned.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-brand-dark/60 text-xs uppercase text-brand-text-secondary"><tr><th className="p-3">Member</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-brand-light/60">{members.map(member => <tr key={member.userId}><td className="p-3"><p className="font-semibold text-white">{member.displayName}</p><p className="text-xs text-brand-text-secondary">{member.email}</p><p className="mt-1 font-mono text-[10px] text-brand-text-secondary">{member.userId}</p></td><td className="p-3"><select aria-label={`Role for ${member.displayName}`} disabled={member.userId===currentUserId || busyId===member.userId} value={member.role} onChange={e => void update(member,{role:e.target.value})} className="rounded border border-brand-light bg-brand-dark p-2 text-xs text-white">{roles.map(role=><option key={role} value={role}>{role.replaceAll('_',' ')}</option>)}</select></td><td className="p-3"><span className="text-xs uppercase text-brand-text-secondary">{member.status}</span></td><td className="p-3">{member.userId===currentUserId ? <span className="text-xs text-brand-text-secondary">Current account</span> : <div className="flex gap-2">{member.status==='active' ? <button disabled={busyId===member.userId} onClick={()=>void update(member,{status:'suspended'})} className="text-xs text-amber-300 disabled:opacity-50">Suspend</button> : member.status==='suspended' ? <button disabled={busyId===member.userId} onClick={()=>void update(member,{status:'active'})} className="text-xs text-emerald-300 disabled:opacity-50">Reactivate</button> : <span className="text-xs text-brand-text-secondary">Revoked</span>}{member.status!=='revoked' && <button disabled={busyId===member.userId} onClick={()=>void update(member,{status:'revoked'})} className="text-xs text-red-300 disabled:opacity-50">Revoke</button>}</div>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
};
export default OrganizationAdmin;
