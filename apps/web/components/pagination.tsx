"use client";

import { useRouter } from "@/i18n/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

type Props = {
  nextCursor: string | null;
  hasItems: boolean;
  labels: {
    next: string;
    prev: string;
    page: string;
  };
};

export function Pagination({ nextCursor, hasItems, labels }: Props) {
  const router = useRouter();

  function goNext() {
    if (!nextCursor) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cursor", nextCursor);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  function goPrev() {
    const url = new URL(window.location.href);
    url.searchParams.delete("cursor");
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const hasCursor = new URLSearchParams(window.location.search).has("cursor");

  if (!hasItems && !hasCursor) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        onClick={goPrev}
        disabled={!hasCursor}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {labels.prev}
      </button>
      <button
        onClick={goNext}
        disabled={!nextCursor}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {labels.next}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
