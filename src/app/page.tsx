// Home page - Landing
import Link from "next/link";
import translations from "@/lib/i18n/bn";

export default function Home() {
  const t = translations;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-600">
              {t.common.appName}
            </div>
            <div className="space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                {t.auth.login}
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                {t.auth.signup}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            স্মার্ট সম্পত্তি ব্যবস্থাপনা সমাধান
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            আপনার বাড়ি, ফ্ল্যাট এবং ভাড়াটিয়াদের সহজে পরিচালনা করুন। সম্পূর্ণ অনলাইন প্ল্যাটফর্মে।
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 text-lg"
            >
              এখনই শুরু করুন
            </Link>
            <Link
              href="/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 text-lg"
            >
              লগইন
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            আমাদের বৈশিষ্ট্য
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                বাড়ি ব্যবস্থাপনা
              </h3>
              <p className="text-gray-600">
                একাধিক বাড়ি এবং ফ্ল্যাট পরিচালনা করুন সহজে। প্রতিটি সম্পত্তির বিস্তারিত তথ্য সংরক্ষণ করুন।
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ভাড়াটিয়া ব্যবস্থাপনা
              </h3>
              <p className="text-gray-600">
                ভাড়াটিয়াদের তথ্য এবং ইতিহাস সংরক্ষণ করুন। কোন ডেটা হারিয়ে যাবে না।
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ভাড়া ও পেমেন্ট ট্র্যাকিং
              </h3>
              <p className="text-gray-600">
                মাসিক ভাড়া, পেমেন্ট এবং বকেয়া সহজেই ট্র্যাক করুন। রিপোর্ট তৈরি করুন।
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                রিপোর্ট এবং বিশ্লেষণ
              </h3>
              <p className="text-gray-600">
                মাসিক রিপোর্ট এবং ভাড়াটিয়া ইতিহাস রিপোর্ট তৈরি করুন। PDF ডাউনলোড করুন।
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                নিরাপত্তা এবং গোপনীয়তা
              </h3>
              <p className="text-gray-600">
                আপনার ডেটা সম্পূর্ণ সুরক্ষিত। এন্ড-টু-এন্ড এনক্রিপশন সহ।
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                সব ডিভাইসে কাজ করে
              </h3>
              <p className="text-gray-600">
                ডেস্কটপ, ট্যাবলেট বা মোবাইল - যেকোনো জায়গা থেকে অ্যাক্সেস করুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          আজই শুরু করুন - সম্পূর্ণ বিনামূল্যে!
        </h2>
        <Link
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 text-lg"
        >
          আপনার অ্যাকাউন্ট তৈরি করুন
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 {t.common.appName}. সকল অধিকার সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
}
