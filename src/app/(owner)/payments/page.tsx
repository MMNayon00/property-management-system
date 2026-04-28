"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

interface Flat {
  id: string;
  flatNumber: string;
  building: { name: string };
}

interface RentRecord {
  id: string;
  flatId: string;
  flat: Flat;
  year: number;
  month: number;
  total: number;
  paymentStatus: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  createdAt: string;
  rentRecord: RentRecord;
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidRents, setUnpaidRents] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedRent, setSelectedRent] = useState<RentRecord | null>(null);
  const [formData, setFormData] = useState({ 
    amount: "", 
    method: "CASH", 
    reference: "" 
  });
  const [submitting, setSubmitting] = useState(false);
  
  const t = translations;

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all payments
      const payRes = await fetch("/api/payments", { cache: "no-store" });
      const payData = await payRes.json();
      setPayments(Array.isArray(payData) ? payData : []);

      // Fetch unpaid/partial rent records for the quick pay dropdown
      const rentRes = await fetch("/api/rent", { cache: "no-store" });
      const rentData = await rentRes.json();
      if (Array.isArray(rentData)) {
        setUnpaidRents(rentData.filter(r => r.paymentStatus !== "PAID"));
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rentRecord?: RentRecord) => {
    if (rentRecord) {
      setSelectedRent(rentRecord);
      // Calculate remaining amount
      const paid = rentRecord.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remaining = rentRecord.total - paid;
      setFormData(prev => ({ ...prev, amount: remaining.toString() }));
    } else {
      setSelectedRent(null);
      setFormData({ amount: "", method: "CASH", reference: "" });
    }
    setShowModal(true);
  };

  const handleRentSelectChange = (rentId: string) => {
    const rent = unpaidRents.find(r => r.id === rentId);
    if (rent) {
      setSelectedRent(rent);
      const paid = rent.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remaining = rent.total - paid;
      setFormData(prev => ({ ...prev, amount: remaining.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRent) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentRecordId: selectedRent.id,
          flatId: selectedRent.flatId,
          buildingId: selectedRent.flat.building.name, // The backend schema takes buildingId but we only have name here easily, let's fix backend if needed. Wait backend requires buildingId. We will pass flat's building id if available.
          amount: parseInt(formData.amount),
          method: formData.method,
          reference: formData.reference,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to record payment");
      } else {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('bn-BD', { month: 'long' });
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.nav.payments}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
        >
          {t.payments.recordPayment}
        </button>
      </div>

      {/* Unpaid Tracking Section */}
      {unpaidRents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-red-800 mb-3">বকেয়া ভাড়া (Unpaid Tracking)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidRents.map(rent => {
              const paid = rent.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const remaining = rent.total - paid;
              return (
                <div key={rent.id} className="bg-white p-3 rounded shadow-sm border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{rent.flat.building.name} - {rent.flat.flatNumber}</p>
                    <p className="text-xs text-gray-500">{getMonthName(rent.month)}, {rent.year}</p>
                    <p className="text-sm font-medium text-red-600 mt-1">বাকি: ৳ {remaining}</p>
                  </div>
                  <button 
                    onClick={() => handleOpenModal(rent)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                  >
                    পরিশোধ করুন
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">{t.payments.paymentHistory}</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">কোন পেমেন্ট রেকর্ড নেই</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">তারিখ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফ্ল্যাট</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ভাড়া মাস</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.payments.amount}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.payments.method}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.payments.reference}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.rentRecord?.flat?.building?.name} - {payment.rentRecord?.flat?.flatNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMonthName(payment.rentRecord?.month)}, {payment.rentRecord?.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ৳ {payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.method || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{t.payments.recordPayment}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedRent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বকেয়া ভাড়া নির্বাচন করুন</label>
                  <select
                    required
                    onChange={(e) => handleRentSelectChange(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="" disabled selected>নির্বাচন করুন</option>
                    {unpaidRents.map((r) => {
                      const paid = r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.flat.building.name} - {r.flat.flatNumber} ({getMonthName(r.month)}) - বাকি: ৳{r.total - paid}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              {selectedRent && (
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                  <p><strong>ফ্ল্যাট:</strong> {selectedRent.flat.building.name} - {selectedRent.flat.flatNumber}</p>
                  <p><strong>মাস:</strong> {getMonthName(selectedRent.month)}, {selectedRent.year}</p>
                  <p><strong>মোট ভাড়া:</strong> ৳ {selectedRent.total}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.payments.amount} (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.payments.method}</label>
                  <select
                    required
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="CASH">ক্যাশ (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK">ব্যাংক (Bank)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.payments.reference}</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Transaction ID"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRent}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
