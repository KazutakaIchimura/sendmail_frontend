import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Furigana } from './Furigana';

type Props = {
  children: React.ReactNode;
};

export const PageTitle = ({ children }: Props) => {
  const { settings } = useAccessibility();
  return (
    <h1 className="text-std-24B-150 text-solid-gray-900 mb-6">
      {settings.furigana && typeof children === 'string'
        ? <Furigana text={children} />
        : children}
    </h1>
  );
};
