"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const isHidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/order") ||
    pathname?.startsWith("/profile");

  if (isHidden) return null;

  return <Navbar />;
}