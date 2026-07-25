"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, Send, Users, Table, User, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/features/auth/auth-context";

const navItems = [
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/tracker", label: "Tracker", icon: Table },
  { href: "/bulk", label: "Bulk Outreach", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function CapsuleNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setIsScrolledDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 350, damping: 25 };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <motion.nav
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: isScrolledDown && !isHovered ? 0.9 : 1,
        }}
        transition={transitionConfig}
        className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full glass-capsule shadow-lg shadow-black/5"
      >
        {/* Brand / Logo */}
        <Link
          href="/applications"
          className="flex items-center gap-2 px-2 py-1 rounded-full text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <motion.span
            animate={{
              width: isScrolledDown && !isHovered ? 0 : "auto",
              opacity: isScrolledDown && !isHovered ? 0 : 1,
            }}
            transition={transitionConfig}
            className="font-bold text-sm text-[var(--ink)] overflow-hidden whitespace-nowrap hidden sm:inline-block"
          >
            ApplyDesk
          </motion.span>
        </Link>

        <div className="h-4 w-px bg-[var(--border)] mx-1" />

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--accent-soft)]/50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <motion.span
                    animate={{
                      width: isHovered || isActive ? "auto" : "auto",
                      opacity: 1,
                    }}
                    transition={transitionConfig}
                    className="overflow-hidden whitespace-nowrap hidden md:inline-block"
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[var(--border)] mx-1" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-full hover:bg-red-500/10 text-[var(--ink-soft)] hover:text-[var(--red)] transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.nav>
    </div>
  );
}
