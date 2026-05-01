'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { t } from '@/lib/i18n';

const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {t('Back')}
    </button>
  );
};

export default BackButton;
