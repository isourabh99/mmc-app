import React from "react";
import {
  useNavigate as useRRDNavigate,
  useLocation as useRRDLocation,
  useSearchParams as useRRDSearchParams,
  useParams as useRRDParams,
} from "react-router-dom";

export function useRouter() {
  const navigate = useRRDNavigate();
  return React.useMemo(
    () => ({
      push: (url: string) => navigate(url),
      replace: (url: string) => navigate(url, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.location.reload(),
      prefetch: () => {},
    }),
    [navigate]
  );
}

export function usePathname() {
  const location = useRRDLocation();
  return location.pathname;
}

export function useSearchParams() {
  const [searchParams] = useRRDSearchParams();
  return searchParams;
}

export function useParams<T extends Record<string, string | string[] | undefined> = Record<string, string | undefined>>(): T {
  return useRRDParams() as T;
}

export function redirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
