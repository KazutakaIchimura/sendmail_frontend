import { ErrorText } from '@/components/dads/ErrorText/ErrorText';

type Props = {
  message?: string;
};

export const FormError = ({ message }: Props) => {
  if (!message) return null;
  return <ErrorText className="mt-1">{message}</ErrorText>;
};
