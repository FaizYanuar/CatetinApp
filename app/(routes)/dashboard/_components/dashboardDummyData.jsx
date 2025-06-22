// File: app/(routes)/dashboard/_components/DashboardDummyDataButton.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs'; // Diperlukan untuk mendapatkan userId
import { Bot, CheckCircle } from 'lucide-react';

export default function DashboardDummyDataButton() {
  const { user } = useUser(); // Dapatkan informasi pengguna
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isAlreadyGenerated, setIsAlreadyGenerated] = useState(false);

  // useEffect untuk memeriksa localStorage saat komponen dimuat
  useEffect(() => {
    if (user) {
      // Buat kunci yang unik untuk setiap pengguna
      const storageKey = `dummyDataGenerated_${user.id}`;
      const hasGenerated = localStorage.getItem(storageKey);
      if (hasGenerated === 'true') {
        setIsAlreadyGenerated(true);
        setFeedbackMessage('Anda sudah pernah membuat data demo untuk akun ini.');
      }
    }
  }, [user]); // Jalankan efek ini ketika informasi pengguna tersedia/berubah

  const handleGenerateData = async () => {
    if (!user) {
      setFeedbackMessage('Error: Anda harus login untuk membuat data demo.');
      return;
    }

    setIsGenerating(true);
    setFeedbackMessage('Membuat data transaksi demo, mohon tunggu...');
    try {
      const res = await fetch('/api/generate-dummy-data', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat membuat data dummy.');
      }
      
      setFeedbackMessage(data.message || 'Data dummy berhasil dibuat! Halaman akan dimuat ulang...');
      
      // Tandai bahwa pengguna ini telah membuat data
      const storageKey = `dummyDataGenerated_${user.id}`;
      localStorage.setItem(storageKey, 'true');
      setIsAlreadyGenerated(true); // Langsung perbarui state UI

      // Muat ulang halaman setelah 2 detik untuk menampilkan data baru.
      // Menggunakan window.location.reload() sebagai alternatif yang lebih sederhana dari router.refresh().
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setFeedbackMessage(`Error: ${error.message}`);
      // Hentikan loading dan biarkan pesan error ditampilkan
      setIsGenerating(false);
      setTimeout(() => setFeedbackMessage(''), 7000); // Hapus pesan error setelah 7 detik
    } 
  };

  return (
    <div className="px-5 mb-6 mt-10">
        <div className="p-4 bg-white rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h4 className="font-semibold text-gray-800">Butuh Data Contoh?</h4>
                <p className="text-sm text-gray-600 mt-1">Klik tombol ini untuk membuat 90 transaksi demo (penjualan & pembelian) secara otomatis selama 3 bulan untuk akun Anda.</p>
            </div>
            <button
                onClick={handleGenerateData}
                disabled={isGenerating || isAlreadyGenerated} // Tombol dinonaktifkan jika sedang proses atau sudah pernah dibuat
                className="w-full sm:w-auto flex-shrink-0 bg-purple-600 text-white px-5 py-2.5 rounded-md hover:bg-purple-700 transition-all duration-250 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
                {isAlreadyGenerated ? (
                    <>
                        <CheckCircle size={18} />
                        Data Demo Sudah Ada
                    </>
                ) : isGenerating ? (
                    'Sedang Memproses...'
                ) : (
                    <>
                        <Bot size={18} />
                        Buat Data Demo
                    </>
                )}
            </button>
        </div>
        {feedbackMessage && <p className={`text-sm mt-3 px-1 ${feedbackMessage.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>{feedbackMessage}</p>}
    </div>
  );
}
