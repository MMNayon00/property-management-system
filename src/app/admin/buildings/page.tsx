'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n';
import BackButton from '@/components/common/BackButton';

interface Building {
  id: string;
  name: string;
  address: string;
  owner: {
    name: string | null;
  };
  createdAt: string;
}

export default function AllBuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/buildings');
        if (!response.ok) {
          throw new Error('Failed to fetch buildings');
        }
        const data = await response.json();
        setBuildings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  return (
    <div className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">{t('All Buildings')}</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <p className="p-4">{t('Loading...')}</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Building Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Address')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Owner')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Created At')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildings.map((building) => (
                <tr key={building.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{building.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{building.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{building.owner.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(building.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {buildings.length === 0 && !loading && <p className="p-4 text-center text-gray-500">{t('No buildings found.')}</p>}
      </div>
    </div>
  );
}
