'use client';
import React, { useState } from "react";
import { useUser, useAuth, getToken } from "@clerk/nextjs";

function AddBarangForm({ onClose }) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

async function handleSubmit(event) {
  event.preventDefault();

  const token = await getToken();
  if (!token) {
    console.error('No auth token');
    return;
  }

  const response = await fetch('/api/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      sku,
      cost_price: Number(costPrice),
      sale_price: Number(salePrice),
    }),
  });

  console.log('🔖 Response status:', response.status);

  const text = await response.text();
  console.log('🔖 Response raw text:', text);

  let data;
  try {
    data = text ? JSON.parse(text) : null;
    console.log('🔖 Parsed JSON:', data);
  } catch (e) {
    console.error('Failed to parse as JSON:', e);
  }

  if (!response.ok) {
    console.error('Server responded with error:', data);
    return;
  }

  console.log('Success:', data);
  onClose();
}







  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full h-full sm:h-auto sm:w-1/2 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Tambah Barang</h2>

        <form onSubmit={handleSubmit} className="m-6 sm:max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-10">
            <div className="relative flex items-center">
              <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">
                Nama Barang
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama barang"
                className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none"
              />
            </div>

            <div className="relative flex items-center">
              <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Masukkan kode SKU"
                className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none"
              />
            </div>

            <div className="relative flex items-center">
              <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">
                Harga Pokok
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Masukkan harga pokok"
                className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none"
              />
            </div>

            <div className="relative flex items-center">
              <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">
                Harga Jual
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Masukkan Harga Jual"
                className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-10 px-6 py-2.5 w-full text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mt-2 px-6 py-2.5 w-full text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-all cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBarangForm;
