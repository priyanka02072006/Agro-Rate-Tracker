"use client";

interface Props{

market:string;

setMarket:(value:string)=>void;

}

const markets=[

"All",

"Chennai",

"Madurai",

"Coimbatore",

"Salem",

"Trichy",

"Erode"

];

export default function MarketFilter({

market,

setMarket

}:Props){

return(

<select

value={market}

onChange={(e)=>setMarket(e.target.value)}

className="border rounded-xl p-3 shadow-sm bg-white"

>

{

markets.map(item=>(

<option key={item}>

{item}

</option>

))

}

</select>

)

}
