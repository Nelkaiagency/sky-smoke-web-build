"use client";

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

export default function ContactForm() {
  const [state, handleSubmit] = useForm("mkoldpve");

  if (state.succeeded) {
    return <p className="text-green-600 font-medium text-center">Thanks for joining!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-medium text-sm">
          Email Address
        </label>
        <input
          id="email"
          type="email" 
          name="email"
          required
          className="border p-2 rounded-md"
        />
        <ValidationError 
          prefix="Email" 
          field="email"
          errors={state.errors}
          className="text-red-500 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="font-medium text-sm">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          className="border p-2 rounded-md min-h-[100px]"
        />
        <ValidationError 
          prefix="Message" 
          field="message"
          errors={state.errors}
          className="text-red-500 text-xs"
        />
      </div>

      <button 
        type="submit" 
        disabled={state.submitting}
        className="bg-black text-white p-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
      >
        {state.submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}