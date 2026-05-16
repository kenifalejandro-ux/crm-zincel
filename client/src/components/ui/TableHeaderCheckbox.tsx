/**client/src/ui/TableHeaderCkeckbox.tsx**/
/**ELIMINAR MASIVO */


interface TableCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export function TableHeaderCheckbox({
  checked,
  onChange,
}: TableCheckboxProps) {

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="
        w-4
        h-4
        cursor-pointer
        accent-blue-600
      "
    />
  );
}