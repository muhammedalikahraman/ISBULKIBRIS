import { SearchIcon } from "@/components/icons";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <SearchIcon className="h-10 w-10 text-primary-300" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-6 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
