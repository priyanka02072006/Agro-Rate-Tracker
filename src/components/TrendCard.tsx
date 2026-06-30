import { ArrowUpRight } from "lucide-react";

export default function TrendCard() {
  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 text-white shadow-xl">

      <p className="text-green-100">
        Market Growth
      </p>

      <h2 className="text-5xl font-bold mt-3">
        +12.8%
      </h2>

      <div className="flex items-center gap-2 mt-8">

        <ArrowUpRight />

        <span>
          Compared to last month
        </span>

      </div>

    </div>
  );
}
