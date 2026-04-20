"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("./Navbar"), {
  ssr: false,
});

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const isHidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/order") ||
    pathname?.startsWith("/profile");

  if (isHidden) return null;

  return <Navbar />;
}