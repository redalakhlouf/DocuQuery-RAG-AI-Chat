"use client";

import { usePathname } from "next/navigation";
import GridBackground from "./GridBackground";

function variantFromPath(pathname) {
  if (!pathname) return "landing";
  if (pathname === "/login") return "auth";
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/chat") return "chat";
  if (pathname === "/upload") return "upload";
  if (pathname === "/settings") return "settings";
  return "landing";
}

export default function PageWrapper({ children }) {
  const pathname = usePathname();
  const variant = variantFromPath(pathname);

  return (
    <>
      <GridBackground variant={variant} />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </>
  );
}
