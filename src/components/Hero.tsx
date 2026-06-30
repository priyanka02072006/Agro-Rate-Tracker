"use client";

import { ArrowRight, TrendingUp, Leaf } from "lucide-react";

export default function Hero() {
  return (

<section className="relative overflow-hidden">

<div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-yellow-50"/>

<div className="relative max-w-7xl mx-auto px-6 py-32">

<div className="grid lg:grid-cols-2 gap-14 items-center">

<div>

<div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-100 text-green-700 mb-8">

<Leaf size={18}/>

Smart Agricultural Intelligence

</div>

<h1 className="text-6xl font-extrabold leading-tight text-gray-900">

Track

<span className="text-green-600">

 Agricultural Prices

</span>

<br/>

Across India

</h1>

<p className="mt-8 text-xl text-gray-600 leading-9">

Real-time agricultural market prices,

AI insights,

historical trends,

and smart analytics

for farmers,

traders,

and researchers.

</p>

<div className="mt-10 flex gap-5">

<button className="px-8 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-lg font-semibold flex items-center gap-3">

Explore Dashboard

<ArrowRight size={20}/>

</button>

<button className="px-8 py-4 rounded-xl border border-gray-300 hover:bg-gray-100 text-lg">

Learn More

</button>

</div>

</div>

<div>

<div className="rounded-3xl bg-white shadow-2xl p-10 border">

<div className="flex justify-between">

<div>

<p className="text-gray-500">

Today's Market

</p>

<h2 className="text-4xl font-bold mt-2">

₹248.50

</h2>

</div>

<div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">

<TrendingUp className="text-green-700"/>

</div>

</div>

<div className="mt-10 space-y-5">

<div className="flex justify-between">

<span>Rice</span>

<span className="font-bold text-green-600">

+4.8%

</span>

</div>

<div className="flex justify-between">

<span>Tomato</span>

<span className="font-bold text-red-500">

-2.1%

</span>

</div>

<div className="flex justify-between">

<span>Onion</span>

<span className="font-bold text-green-600">

+7.2%

</span>

</div>

<div className="flex justify-between">

<span>Potato</span>

<span className="font-bold text-green-600">

+3.4%

</span>

</div>

</div>

</div>

</div>

</div>

</div>

</section>

  );
}
