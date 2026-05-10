import clsx from "clsx";

interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: Array<SelectOption<T>>;
  className?: string;
}

export function Select<T extends string | number>({ value, onChange, options, className }: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(event) => {
        const matched = options.find((option) => String(option.value) === event.target.value);
        if (matched) {
          onChange(matched.value);
        }
      }}
      className={clsx("field", className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
