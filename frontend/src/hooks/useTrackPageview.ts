import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { supabase } from '../lib/supabase';

/**
 * Pings public.web_visits on every route change. Privacy-friendly:
 *  - no IP (server already doesn't see it via RLS anon path)
 *  - no cookie/session token
 *  - user-agent truncated to 200 chars
 *
 * Skips paths starting with /admin (we don't want admin traffic in stats).
 */
export function useTrackPageview() {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 1000)
      : null;
    const ua = navigator.userAgent.slice(0, 200);

    void supabase
      .from('web_visits')
      .insert({ path: pathname, referrer, ua_short: ua })
      .then(() => {});
  }, [pathname]);
}
