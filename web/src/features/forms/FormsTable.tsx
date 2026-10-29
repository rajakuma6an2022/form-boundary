import { StatusBadge } from '../../components/ui/StatusBadge';
import { RowActionsMenu } from './RowActionMenu';
import type { SampleForm } from './sample-data';

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function FormsTable({ rows }: { rows: SampleForm[] }) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <caption className="sr-only">Your forms</caption>
      <colgroup>
        <col />
        <col className="w-36" />
        <col className="w-32" />
        <col className="w-40" />
        <col className="w-24" />
      </colgroup>
      <thead>
        <tr className="border-b border-line text-xs font-medium uppercase tracking-wide text-ink-muted">
          <th scope="col" className="px-5 py-3">Form name</th>
          <th scope="col" className="px-5 py-3">Status</th>
          <th scope="col" className="px-5 py-3 text-right">Responses</th>
          <th scope="col" className="px-5 py-3">Last updated</th>
          <th scope="col" className="px-5 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((form) => (
          <tr key={form.id} className="transition-colors hover:bg-canvas">
            <th scope="row" className="truncate px-5 py-3.5 font-medium text-ink">{form.name}</th>
            <td className="px-5 py-3.5"><StatusBadge status={form.status} /></td>
            <td className="px-5 py-3.5 text-right tabular-nums text-ink">{form.responses}</td>
            <td className="px-5 py-3.5 text-ink-muted">
              <time dateTime={form.updatedAt}>{dateFormat.format(new Date(form.updatedAt))}</time>
            </td>
            <td className="px-5 py-2.5 text-right"><RowActionsMenu formName={form.name} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}