import { Star, TrendingUp } from "lucide-react";

export default function FeaturedCrop() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 p-8 text-white shadow-xl">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-green-100">
            Featured Crop
          </p>

          <h2 className="text-4xl font-bold mt-3">
            Tomato 🍅
          </h2>

        </div>

        <Star className="w-10 h-10 fill-yellow-300 text-yellow-300" />

      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">

        <div>

          <p className="text-green-200">
            Current Price
          </p>

          <h3 className="text-3xl font-bold mt-2">
            ₹42/kg
          </h3>

        </div>

        <div>

          <p className="text-green-200">
            Monthly Growth
          </p>

          <div className="flex items-center gap-2 mt-2">

            <TrendingUp />

            <span className="text-3xl font-bold">
              +5.2%
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
