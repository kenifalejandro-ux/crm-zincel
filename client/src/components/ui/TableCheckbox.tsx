/**client/src/componenents/ui/TableCheckbox.tsx**/
/**CKEKIN POR CASILLA Y MASIVO  */

interface TableCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export function TableCheckbox({
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