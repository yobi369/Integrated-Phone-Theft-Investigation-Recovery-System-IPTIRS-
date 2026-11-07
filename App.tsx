import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import CaseWorkspace from './components/CaseWorkspace';
import OrganizationAdmin from './components/OrganizationAdmin';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const authority = import.meta.env.VITE_OIDC_AUTHORITY as string | undefined;
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined;
const organizationId = import.meta.env.VITE_ORGANIZATION_ID as string | undefined;

const SetupRequired: React.FC = () => <main className="min-h-screen bg-brand-dark p-6 text-brand-text"><div className="mx-auto mt-16 max-w-2xl rounded-xl border border-amber-500/40 bg-brand-secondary p-8"><p className="text-xs font-bold uppercase tracking-widest text-amber-300">Configuration required</p><h1 className="mt-2 text-2xl font-black text-white">Connect an institutional environment</h1><p className="mt-3 text-sm text-brand-text-secondary">The authenticated workspace is disabled until the browser API URL, OIDC authority, client ID and organization UUID are configured by the deployment administrator.</p><ul className="mt-5 list-disc space-y-2 pl-5 font-mono text-xs text-brand-text"><li>VITE_API_BASE_URL</li><li>VITE_OIDC_AUTHORITY</li><li>VITE_OIDC_CLIENT_ID</li><li>VITE_ORGANIZATION_ID</li></ul><p className="mt-5 text-xs text-brand-text-secondary">No demo credentials or default organization are provided. Register the exact redirect URI <code>/auth/callback</code> and silent-renew URI <code>/auth/silent-renew</code> with the institution's OIDC client.</p></div></main>;

const SignIn: React.FC = () => {
  const { signIn, error } = useAuth();
  const [busy,setBusy]=useState(false);
  const [failure,setFailure]=useState('');
  const start = async () => { setBusy(true); setFailure(''); try { await signIn(); } catch { setFailure('The identity provider rejected or could not start sign-in.'); } finally { setBusy(false); } };
  return <main className="min-h-screen bg-brand-dark p-6 text-brand-text"><div className="mx-auto mt-24 max-w-md rounded-xl border border-brand-light bg-brand-secondary p-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-accent">Institutional workspace</p><h1 className="mt-3 text-3xl font-black text-white">IPTIRS</h1><p className="mt-3 text-sm text-brand-text-secondary">Sign in through your organization’s configured identity provider. IPTIRS does not accept local passwords.</p>{(error||failure)&&<p role="alert" className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">{error||failure}</p>}<button onClick={()=>void start()} disabled={busy} className="mt-6 w-full rounded bg-brand-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Connecting…':'Continue with organization sign-in'}</button><p className="mt-5 text-[11px] text-brand-text-secondary">Development foundation · No institutional affiliation or live operator integration is implied.</p></div></main>;
};

const AuthenticatedWorkspace: React.FC = () => {
  const { user, ready, signOut } = useAuth();
  const [view,setView]=useState<'cases'|'members'>('cases');
  const [profile,setProfile]=useState<{userId:string;role:string;organization:{id:string;name:string;slug:string}}|null>(null);
  const [profileError,setProfileError]=useState('');
  React.useEffect(()=>{
    if(!user?.access_token || !organizationId || !apiBaseUrl) return;
    let active=true;
    void fetch(new URL('/v1/me',apiBaseUrl),{headers:{Authorization:`Bearer ${user.access_token}`,'X-Organization-Id':organizationId},credentials:'omit'})
      .then(async response=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error?.message||'Organization access could not be verified.');return payload.data;})
      .then(data=>{if(active)setProfile(data);})
      .catch(err=>{if(active)setProfileError(err instanceof Error?err.message:'Organization access could not be verified.');});
    return ()=>{active=false;};
  },[user?.access_token]);
  if(!ready) return <main className="min-h-screen bg-brand-dark p-8 text-brand-text">Checking organization sign-in…</main>;
  if(!user) return <SignIn/>;
  if(profileError) return <main className="min-h-screen bg-brand-dark p-6 text-brand-text"><div className="mx-auto mt-16 max-w-xl rounded-lg border border-red-500/40 bg-brand-secondary p-6"><h1 className="text-xl font-bold text-white">Organization access unavailable</h1><p className="mt-3 text-sm text-red-200">{profileError}</p><p className="mt-3 text-xs text-brand-text-secondary">Ask an authorized administrator to provision your account and active organization membership.</p><button onClick={()=>void signOut()} className="mt-5 rounded border border-brand-light px-4 py-2 text-sm text-white">Sign out</button></div></main>;
  if(!profile) return <main className="min-h-screen bg-brand-dark p-8 text-brand-text">Verifying organization membership…</main>;
  return <div className="flex min-h-screen bg-brand-dark text-brand-text">
    <aside className="flex w-16 shrink-0 flex-col border-r border-brand-light bg-brand-secondary md:w-60"><div className="border-b border-brand-light p-4"><h1 className="text-xl font-black tracking-widest text-brand-accent">IPTIRS</h1><p className="hidden text-[10px] uppercase tracking-wider text-brand-text-secondary md:block">Institutional case coordination</p></div><nav className="flex-1 space-y-2 p-2" aria-label="Workspace navigation"><button onClick={()=>setView('cases')} className={`w-full rounded px-3 py-3 text-left text-xs font-bold uppercase ${view==='cases'?'bg-brand-accent/15 text-brand-accent':'text-brand-text-secondary hover:bg-brand-light/30'}`}>Cases</button>{profile.role==='organization_admin'&&<button onClick={()=>setView('members')} className={`w-full rounded px-3 py-3 text-left text-xs font-bold uppercase ${view==='members'?'bg-brand-accent/15 text-brand-accent':'text-brand-text-secondary hover:bg-brand-light/30'}`}>Organization access</button>}</nav><div className="border-t border-brand-light p-3"><p className="hidden truncate text-xs font-semibold text-white md:block">{String(user.profile.email||user.profile.preferred_username||user.profile.sub)}</p><p className="hidden text-[10px] uppercase text-brand-text-secondary md:block">{profile.role.replaceAll('_',' ')}</p><button onClick={()=>void signOut()} className="mt-2 w-full rounded border border-brand-light px-2 py-2 text-xs text-brand-text-secondary hover:text-white">Sign out</button></div></aside>
    <main className="min-w-0 flex-1 p-4 md:p-7"><header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-brand-light pb-4"><div><p className="text-sm font-bold text-white">{profile.organization.name}</p><p className="text-xs text-brand-text-secondary">Authenticated organization workspace</p></div><span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase text-amber-200">Staging / synthetic data until approved</span></header>{view==='members'&&profile.role==='organization_admin'?<OrganizationAdmin apiBaseUrl={apiBaseUrl!} token={user.access_token} organizationId={organizationId!} currentUserId={profile.userId}/>:<CaseWorkspace apiBaseUrl={apiBaseUrl!} token={user.access_token} organizationId={organizationId!} role={profile.role} currentUserId={profile.userId}/>}</main>
  </div>;
};

const App: React.FC = () => {
  if (!apiBaseUrl || !authority || !clientId || !organizationId) return <SetupRequired/>;
  if (!/^[0-9a-f-]{36}$/i.test(organizationId)) return <SetupRequired/>;
  return <AuthProvider authority={authority} clientId={clientId}><AuthenticatedWorkspace/></AuthProvider>;
};
export default App;
