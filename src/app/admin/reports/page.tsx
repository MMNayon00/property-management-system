'use client';

import { t } from '@/lib/i18n';
import BackButton from '@/components/common/BackButton';

export default function SystemReportsPage() {
  return (
    <div className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">{t('System Reports')}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">{t('This section is under construction. Detailed system-wide reports will be available here soon.')}</p>
      </div>
    </div>
  );
}
