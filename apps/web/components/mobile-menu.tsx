"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MenuIcon, XIcon, BriefcaseIcon, HomeIcon, GlobeIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  currentLocale: string;
  navItems: NavItem[];
  employerLabel: string;
};

export function MobileMenu({ currentLocale, navItems, employerLabel }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-primary-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <Logo size="sm" />
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-900"
            >
              {item.href === "/ilanlar" ? (
                <BriefcaseIcon className="h-5 w-5 text-primary-500" />
              ) : (
                <HomeIcon className="h-5 w-5 text-primary-500" />
              )}
              {item.label}
            </Link>
          ))}

          <Link
            href="/ilanlar"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-base font-semibold text-white hover:bg-primary-600"
          >
            {employerLabel}
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <GlobeIcon className="h-4 w-4" />
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
        </div>
      </div>
    </>
  );
}
