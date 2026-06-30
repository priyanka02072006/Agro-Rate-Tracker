"use client";

import { useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";
import { products } from "@/lib/products";
import SummaryCards from "./SummaryCards";
import MarketFilter from "./MarketFilter";
import PriceChart from "./PriceChart";
import TrendCard from "./TrendCard";
import TopMovers from "./TopMovers";
import ActivityFeed from "./ActivityFeed";
import MarketComparison from "./MarketComparison";
import PriceHistoryTable from "./PriceHistoryTable";
import FeaturedCrop from "./FeaturedCrop";
import MiniStats from "./MiniStats";

export default function Dashboard(){

const[search,setSearch]=useState("");

const[category,setCategory]=useState("All");
const [market,setMarket]=useState("All");

const filtered=useMemo(()=>{

return products.filter((item)=>{

const matchesCategory=

category==="All" ||

item.category===category;

const matchesSearch=

item.name.toLowerCase().includes(search.toLowerCase());

const matchesMarket =
market==="All" ||
item.market===market;

return matchesCategory &&
matchesSearch &&
matchesMarket;

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
  <SummaryCards />
</div>
<div className="mt-10">

<SearchBar

value={search}

onChange={setSearch}

/>

</div>

<div className="mt-8 flex flex-wrap items-center gap-4">

  <FilterBar
    category={category}
    setCategory={setCategory}
  />

  <MarketFilter
    market={market}
    setMarket={setMarket}
  />

</div>
<div className="grid lg:grid-cols-3 gap-8 mt-12">

  <div className="lg:col-span-2">

    <PriceChart />

  </div>

  <TrendCard />

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
<div className="grid lg:grid-cols-2 gap-8 mt-14">

  <TopMovers />

  <ActivityFeed />

</div>

</div>
<div className="grid lg:grid-cols-3 gap-8 mt-14">

  <div className="lg:col-span-2">
    <FeaturedCrop />
  </div>

  <MiniStats />

</div>

<div className="grid lg:grid-cols-2 gap-8 mt-14">

  <MarketComparison />

  <PriceHistoryTable />

</div>

</div>

</section>

);

}
