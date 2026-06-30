import {
  Bell,
  TrendingUp,
  Store,
  Clock,
} from "lucide-react";

const activities = [

{
icon:TrendingUp,
text:"Tomato price increased by 5.2%",
time:"5 mins ago"
},

{
icon:Store,
text:"Chennai market updated prices",
time:"15 mins ago"
},

{
icon:Bell,
text:"New price alert available",
time:"30 mins ago"
},

{
icon:Clock,
text:"Daily market report published",
time:"1 hour ago"
}

];

export default function ActivityFeed(){

return(

<div className="bg-white rounded-3xl shadow-lg p-8">

<h2 className="text-2xl font-bold mb-8">

Recent Activity

</h2>

<div className="space-y-6">

{

activities.map((item,index)=>{

const Icon=item.icon;

return(

<div
key={index}
className="flex gap-4 items-start">

<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">

<Icon className="text-green-700"/>

</div>

<div>

<p className="font-medium">

{item.text}

</p>

<p className="text-gray-500 text-sm mt-1">

{item.time}

</p>

</div>

</div>

)

})

}

</div>

</div>

)

}
