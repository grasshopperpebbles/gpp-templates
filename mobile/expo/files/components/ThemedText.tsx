import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'subtitle' | 'link';
}

export function ThemedText({ type = 'default', className, ...props }: ThemedTextProps) {
  const baseClasses = {
    default: 'text-base text-gray-900',
    title: 'text-3xl font-bold text-gray-900',
    subtitle: 'text-xl font-semibold text-gray-700',
    link: 'text-base text-blue-500 underline',
  };

  return (
    <Text
      className={`${baseClasses[type]} ${className || ''}`}
      {...props}
    />
  );
}
