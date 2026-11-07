import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren<{
  authority: string;
  clientId: string;
}>> = ({ authority, clientId, children }) => {
  const manager = useMemo(() => new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/callback`,
    post_logout_redirect_uri: window.location.origin,
    silent_redirect_uri: `${window.location.origin}/auth/silent-renew`,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    monitorSession: false,
    loadUserInfo: false,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage })
  }), [authority, clientId]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialization = useRef<Promise<User | null> | null>(null);

  useEffect(() => {
    let active = true;
    const onUserLoaded = (nextUser: User) => { if (active) setUser(nextUser); };
    const onUserUnloaded = () => { if (active) setUser(null); };
    manager.events.addUserLoaded(onUserLoaded);
    manager.events.addUserUnloaded(onUserUnloaded);

    if (!initialization.current) {
      initialization.current = (async () => {
        if (window.location.pathname === '/auth/callback') {
          await manager.signinCallback();
          window.history.replaceState({}, document.title, '/');
        } else if (window.location.pathname === '/auth/silent-renew') {
          await manager.signinSilentCallback();
          return manager.getUser();
        }
        return manager.getUser();
      })();
    }
    void initialization.current.then(existing => {
      if (active) setUser(existing && !existing.expired ? existing : null);
    }).catch(() => {
      if (active) setError('Identity sign-in could not be completed. Check the OIDC client and redirect URI configuration.');
    }).finally(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      manager.events.removeUserLoaded(onUserLoaded);
      manager.events.removeUserUnloaded(onUserUnloaded);
    };
  }, [manager]);

  const value: AuthContextValue = {
    user,
    ready,
    error,
    signIn: async () => { setError(null); await manager.signinRedirect(); },
    signOut: async () => { await manager.signoutRedirect(); }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
