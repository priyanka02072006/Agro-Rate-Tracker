import {
  TrendingUp,
  Store,
  Wheat,
  IndianRupee
} from "lucide-react";

const cards = [

{
title:"Markets",
value:"24",
icon:Store,
color:"bg-green-100"
},

{
title:"Products",
value:"250+",
icon:Wheat,
color:"bg-yellow-100"
},

{
title:"Average Price",
value:"₹58",
icon:IndianRupee,
color:"bg-blue-100"
},

{
title:"Growth",
value:"+12%",
icon:TrendingUp,
color:"bg-purple-100"
}

];

export default function SummaryCards(){

return(

<div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

{

cards.map(card=>{

const Icon=card.icon;

return(

<div
key={card.title}
className="rounded-3xl bg-white shadow-lg p-6">

<div className="flex justify-between">

<div>

<p className="text-gray-500">

{card.title}

</p>

<h2 className="text-4xl font-bold mt-3">

{card.value}

</h2>

</div>

<div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center`}>

<Icon/>

</div>

</div>

</div>

)

})

}

</div>

)

}
