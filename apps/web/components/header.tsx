import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileMenu } from "@/components/mobile-menu";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  currentLocale: string;
  navItems: NavItem[];
  employerLabel: string;
};

export function Header({ currentLocale, navItems, employerLabel }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Logo size="md" />

        {/* Center: Nav links (desktop) */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
          <Link
            href="/ilanlar"
            className="hidden rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md sm:inline-flex"
          >
            {employerLabel}
          </Link>
          <MobileMenu
            currentLocale={currentLocale}
            navItems={navItems}
            employerLabel={employerLabel}
          />
        </div>
      </nav>
    </header>
  );
}
