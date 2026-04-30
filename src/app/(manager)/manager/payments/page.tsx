"use client";

import { useEffect, useState } from "react";
import translations from "@/lib/i18n/bn";

type RentRecord = {
  id: string;
  flatId: string;
  tenantId: string | null;
  buildingId: string;
  month: string;
  baseRent: number;
  extraCharges: number;
  serviceCharges: number;
  total: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  flatNumber: string;
  buildingName: string;
  tenantName: string | null;
};

type Payment = {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  createdAt: string;
};

export default function ManagerPayments() {
  const t = translations;
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "",
    reference: "",
  });

  useEffect(() => {
    loadRentRecords();
  }, []);

  const loadRentRecords = async () => {
    try {
      const response = await fetch("/api/manager/rent-records");
      if (response.ok) {
        const data = await response.json();
        setRentRecords(data);
      }
    } catch (error) {
      console.error("Error loading rent records:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (rentRecordId: string) => {
    try {
      const response = await fetch(`/api/manager/rent-records/${rentRecordId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const handleViewPayments = (record: RentRecord) => {
    setSelectedRecord(record);
    loadPayments(record.id);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecord) return;

    try {
      const response = await fetch(`/api/manager/rent-records/${selectedRecord.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(paymentForm.amount),
          method: paymentForm.method || null,
          reference: paymentForm.reference || null,
        }),
      });

      if (response.ok) {
        setMessage(t.payments.paymentRecorded);
        setPaymentForm({ amount: "", method: "", reference: "" });
        setShowPaymentForm(false);
        loadRentRecords();
        loadPayments(selectedRecord.id);
      } else {
        const error = await response.json();
        setMessage(error.error || "Error occurred");
      }
    } catch (error) {
      setMessage("Error occurred");
    }
  };

  const handleMarkAsPaid = async (rentRecordId: string) => {
    try {
      const response = await fetch(`/api/manager/rent-records/${rentRecordId}/mark-paid`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage("ভাড়া পরিশোধিত হিসাবে চিহ্নিত করা হয়েছে");
        loadRentRecords();
        if (selectedRecord?.id === rentRecordId) {
          loadPayments(rentRecordId);
        }
      } else {
        const error = await response.json();
        setMessage(error.error || "Error occurred");
      }
    } catch (error) {
      setMessage("Error occurred");
    }
  };

  const handleMarkAsUnpaid = async (rentRecordId: string) => {
    try {
      const response = await fetch(`/api/manager/rent-records/${rentRecordId}/mark-unpaid`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage("ভাড়া বাকি হিসাবে চিহ্নিত করা হয়েছে");
        loadRentRecords();
        if (selectedRecord?.id === rentRecordId) {
          loadPayments(rentRecordId);
        }
      } else {
        const error = await response.json();
        setMessage(error.error || "Error occurred");
      }
    } catch (error) {
      setMessage("Error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.payments.payments}
        </h1>
        <p className="text-gray-600 mt-1">
          ভাড়া পরিশোধ এবং পেমেন্ট রেকর্ড
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Rent Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ফ্ল্যাট
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বাড়ি
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ভাড়াটিয়া
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  মাস
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  মোট
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  অবস্থা
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কাজ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    কোন ভাড়া রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                rentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.flatNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.buildingName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.tenantName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ৳{record.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.paymentStatus === "PAID"
                          ? "bg-green-100 text-green-800"
                          : record.paymentStatus === "PARTIAL"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {record.paymentStatus === "PAID" ? "পরিশোধিত" :
                         record.paymentStatus === "PARTIAL" ? "আংশিক" : "বাকি"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPayments(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          দেখুন
                        </button>
                        {record.paymentStatus !== "PAID" && (
                          <button
                            onClick={() => handleMarkAsPaid(record.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            পরিশোধিত
                          </button>
                        )}
                        {record.paymentStatus === "PAID" && (
                          <button
                            onClick={() => handleMarkAsUnpaid(record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            বাকি
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                পেমেন্ট বিবরণ - {selectedRecord.flatNumber} ({selectedRecord.month})
              </h3>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setPayments([]);
                  setShowPaymentForm(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">নতুন পেমেন্ট যোগ করুন</h4>
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        পরিমাণ *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="পরিমাণ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        পদ্ধতি
                      </label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="cash">নগদ</option>
                        <option value="bank">ব্যাংক</option>
                        <option value="online">অনলাইন</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        রেফারেন্স
                      </label>
                      <input
                        type="text"
                        value={paymentForm.reference}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="রেফারেন্স নম্বর"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      যোগ করুন
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payments List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">পেমেন্ট ইতিহাস</h4>
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {showPaymentForm ? "বাতিল" : "পেমেন্ট যোগ করুন"}
                </button>
              </div>

              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">কোন পেমেন্ট পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">৳{payment.amount}</p>
                        <p className="text-sm text-gray-600">
                          {payment.method && `${payment.method} • `}
                          {new Date(payment.createdAt).toLocaleDateString('bn')}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-gray-500">রেফ: {payment.reference}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}