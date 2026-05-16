/**client/src/ui/TableBulkActions.tsx**/
/**ELIMINAR MASIVO - button eliminar */


interface TableBulkActionsProps {
  count: number;
  onDelete?: () => void;
}

export function TableBulkActions({
  count,
  onDelete,
}: TableBulkActionsProps) {

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2">

      {onDelete && (
        <button
          onClick={onDelete}
          className="
            px-3
            py-2
            text-xs
            bg-red-600
            hover:bg-red-700
            text-white
            rounded-lg
          "
        >
          🗑️ Eliminar ({count})
        </button>
      )}

    </div>
  );
}