const history = [

{
date:"01 Jul",
crop:"Tomato",
market:"Chennai",
price:"₹42"
},

{
date:"02 Jul",
crop:"Onion",
market:"Madurai",
price:"₹56"
},

{
date:"03 Jul",
crop:"Rice",
market:"Salem",
price:"₹72"
},

{
date:"04 Jul",
crop:"Carrot",
market:"Erode",
price:"₹49"
},

{
date:"05 Jul",
crop:"Potato",
market:"Coimbatore",
price:"₹36"
}

];

export default function PriceHistoryTable(){

return(

<div className="bg-white rounded-3xl shadow-lg p-8">

<h2 className="text-2xl font-bold mb-8">

Recent Price History

</h2>

<div className="overflow-auto">

<table className="w-full">

<thead>

<tr className="border-b">

<th className="text-left py-4">Date</th>

<th>Crop</th>

<th>Market</th>

<th>Price</th>

</tr>

</thead>

<tbody>

{

history.map((row,index)=>(

<tr
key={index}
className="border-b hover:bg-gray-50">

<td className="py-4">

{row.date}

</td>

<td className="text-center">

{row.crop}

</td>

<td className="text-center">

{row.market}

</td>

<td className="text-center font-bold text-green-600">

{row.price}

</td>

</tr>

))

}

</tbody>

</table>

</div>

</div>

)

}
