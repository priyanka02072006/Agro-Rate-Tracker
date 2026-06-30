const stats = [

{
title:"Highest Price",
value:"₹72",
color:"bg-yellow-100"
},

{
title:"Lowest Price",
value:"₹36",
color:"bg-blue-100"
},

{
title:"Markets Active",
value:"24",
color:"bg-green-100"
},

{
title:"Products",
value:"250+",
color:"bg-purple-100"
}

];

export default function MiniStats(){

return(

<div className="grid grid-cols-2 gap-6">

{

stats.map((item)=>(

<div
key={item.title}
className="rounded-2xl bg-white shadow-lg p-6">

<div className={`w-12 h-12 rounded-xl ${item.color} mb-5`} />

<p className="text-gray-500">

{item.title}

</p>

<h2 className="text-3xl font-bold mt-2">

{item.value}

</h2>

</div>

))

}

</div>

)

}
