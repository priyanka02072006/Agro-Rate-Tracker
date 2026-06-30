import { TrendingDown, TrendingUp } from "lucide-react";
import { Product } from "@/lib/products";

export default function ProductCard({

product,

}:{product:Product}){

const positive=product.change>=0;

return(

<div className="rounded-3xl bg-white shadow-lg p-6 hover:shadow-2xl transition">

<div className="flex justify-between items-center">

<div className="text-5xl">

{product.image}

</div>

<div>

{

positive

?

<TrendingUp className="text-green-600"/>

:

<TrendingDown className="text-red-500"/>

}

</div>

</div>

<h2 className="mt-5 text-2xl font-bold">

{product.name}

</h2>

<p className="text-gray-500">

{product.category}

</p>

<div className="mt-6 flex justify-between">

<div>

<p className="text-sm text-gray-500">

Market

</p>

<p className="font-semibold">

{product.market}

</p>

</div>

<div className="text-right">

<p className="text-sm text-gray-500">

Price

</p>

<p className="font-bold text-green-600">

₹{product.price}

</p>

</div>

</div>

<p className={`mt-6 font-semibold ${positive?"text-green-600":"text-red-500"}`}>

{positive?"+":""}

{product.change}%

</p>

</div>

);

}
