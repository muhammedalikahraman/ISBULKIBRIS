import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { MailIcon, PhoneIcon, MapPinIcon, BriefcaseIcon, HomeIcon } from "@/components/icons";

type FooterLink = {
  href: string;
  label: string;
};

type Props = {
  currentLocale: string;
  siteName: string;
  tagline: string;
  navItems: FooterLink[];
  copyright: string;
};

export function Footer({ currentLocale, siteName, tagline, navItems, copyright }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-gray-200 bg-primary-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-200">
              {tagline}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="mailto:info@isbulkibris.com"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800 text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
                aria-label="Email"
              >
                <MailIcon className="h-5 w-5" />
              </a>
              <a
                href="tel:+903928000000"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800 text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
                aria-label="Phone"
              >
                <PhoneIcon className="h-5 w-5" />
              </a>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800 text-primary-200">
                <MapPinIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-400">
              {currentLocale === "tr" ? "Bağlantılar" : currentLocale === "ru" ? "Ссылки" : "Links"}
            </h3>
            <ul className="mt-4 space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-sm text-primary-200 transition-colors hover:text-white"
                  >
                    {item.href === "/ilanlar" ? (
                      <BriefcaseIcon className="h-4 w-4" />
                    ) : (
                      <HomeIcon className="h-4 w-4" />
                    )}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-400">
              {currentLocale === "tr" ? "İletişim" : currentLocale === "ru" ? "Контакт" : "Contact"}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-200">
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-400" />
                <span>Lefkoşa, Kuzey Kıbrıs</span>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 flex-shrink-0 text-accent-400" />
                <a href="mailto:info@isbulkibris.com" className="hover:text-white transition-colors">
                  info@isbulkibris.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 flex-shrink-0 text-accent-400" />
                <a href="tel:+903928000000" className="hover:text-white transition-colors">
                  +90 392 800 00 00
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-800 pt-6 sm:flex-row">
          <p className="text-sm text-primary-300">
            © {year} {siteName}. {copyright}
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-300">
            <a href="#" className="transition-colors hover:text-white">
              {currentLocale === "tr" ? "Gizlilik" : currentLocale === "ru" ? "Конфиденциальность" : "Privacy"}
            </a>
            <a href="#" className="transition-colors hover:text-white">
              {currentLocale === "tr" ? "Şartlar" : currentLocale === "ru" ? "Условия" : "Terms"}
            </a>
            <a href="#" className="transition-colors hover:text-white">
              {currentLocale === "tr" ? "Çerezler" : currentLocale === "ru" ? "Cookies" : "Cookies"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
