'use client';
import React, { useState } from "react";

function addBarangForm({ onClose }) {
    const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: handle form submission here
    onClose(); // close modal after submit
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full h-full sm:h-auto sm:w-1/2 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Tambah Barang</h2>

        <form onSubmit={handleSubmit} className="m-6 sm:max-w-4xl mx-auto">
      <div className="grid sm:grid-cols-2 gap-10">
        <div className="relative flex items-center">
          <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">Nama Barang</label>
          <input type="text" placeholder="Masukkan nama barang"
            className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none" />
        </div>

        <div className="relative flex items-center">
          <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">SKU</label>
          <input type="text" placeholder="Masukkan kode SKU"
            className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none" />
        </div>

        <div className="relative flex items-center">
          <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">Harga Pokok</label>
          <input type="number" placeholder="Masukkan harga pokok"
            className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none" />
        </div>

        <div className="relative flex items-center">
          <label className="text-[13px] bg-white text-slate-900 font-medium absolute px-2 top-[-10px] left-[18px]">Harga Jual</label>
          <input type="number" placeholder="Masukkan Harga Jual"
            className="px-4 py-3.5 pr-8 bg-white text-slate-900 font-medium w-full text-sm border-2 border-gray-100 focus:border-blue-500 rounded outline-none" />
        </div>
      </div>

      <button type="button"
        onClick={onClose} className="mt-10 px-6 py-2.5 w-full text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-all cursor-pointer">Cancel</button>
      <button type="button"
        className="mt-2 px-6 py-2.5 w-full text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-all cursor-pointer">Submit</button>
    </form>
      </div>
    </div>
  )
}

export default addBarangForm