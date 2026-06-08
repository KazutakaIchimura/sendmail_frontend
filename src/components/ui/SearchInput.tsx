import { Input } from '@/components/dads/Input/Input';

type Props = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

export const SearchInput = ({ placeholder = '検索...', value, onChange }: Props) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-solid-gray-500 pointer-events-none">🔍</span>
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="pl-8"
      blockSize="md"
    />
  </div>
);
