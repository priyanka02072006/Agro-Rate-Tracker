"use client";

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";
import { products } from "@/lib/products";

export default function Dashboard(){

const[search,setSearch]=useState("");

const[category,setCategory]=useState("All");

const filtered=useMemo(()=>{

return products.filter((item)=>{

const matchesCategory=

category==="All" ||

item.category===category;

const matchesSearch=

item.name.toLowerCase().includes(search.toLowerCase());

return matchesCategory && matchesSearch;

});

},[search,category]);

return(

<section className="bg-gray-50 py-24">

<div className="max-w-7xl mx-auto px-6">

<h2 className="text-5xl font-bold">

Market Dashboard

</h2>

<p className="text-gray-500 mt-4">

Track agricultural prices across multiple markets.

</p>

<div className="mt-10">

<SearchBar

value={search}

onChange={setSearch}

/>

</div>

<div className="mt-8">

<FilterBar

category={category}

setCategory={setCategory}

/>

</div>

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">

{

filtered.map(product=>(

<ProductCard

key={product.id}

product={product}

/>

))

}

</div>

</div>

</section>

);

}
