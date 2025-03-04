import React from 'react';
import Select from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  placeholder?: string;
  value: string[];
  onChange: (selectedValues: string[]) => void;
  disabled?: boolean; // properti disabled ditambahkan
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  placeholder,
  value,
  onChange,
  disabled, // ambil properti disabled
}) => {
  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={(selected) => onChange(selected.map(opt => opt.value))}
      placeholder={placeholder || "Cari dan pilih opsi"}
      isDisabled={disabled} // meneruskan nilai disable ke react-select
    />
  );
};

export default MultiSelect;
