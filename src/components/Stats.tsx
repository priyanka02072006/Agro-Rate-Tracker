import { TrendingUp, Users, Leaf, MapPinned } from "lucide-react";

const stats = [
  {
    title: "Markets",
    value: "150+",
    icon: MapPinned,
  },
  {
    title: "Products",
    value: "250+",
    icon: Leaf,
  },
  {
    title: "Daily Updates",
    value: "24/7",
    icon: TrendingUp,
  },
  {
    title: "Users",
    value: "12K+",
    icon: Users,
  },
];

export default function Stats() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map((item) => {

            const Icon = item.icon;

            return (

              <div
                key={item.title}
                className="rounded-2xl bg-green-50 p-8 shadow hover:shadow-xl transition"
              >

                <Icon className="text-green-600 w-10 h-10 mb-5" />

                <h2 className="text-4xl font-bold">
                  {item.value}
                </h2>

                <p className="text-gray-500 mt-2">
                  {item.title}
                </p>

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}
