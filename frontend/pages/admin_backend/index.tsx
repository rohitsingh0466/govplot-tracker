import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("govplot_admin_token");
    router.replace(token ? "/admin_backend/dashboard" : "/admin_backend/login");
  }, []);
  return null;
}
