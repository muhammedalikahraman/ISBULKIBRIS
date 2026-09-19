import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İşBulKıbrıs",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
