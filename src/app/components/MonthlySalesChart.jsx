"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// helper: group orders by month
function getMonthlySales(orders) {
  const months = Array(12).fill(0);

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    const price = Number(order.total_price || 0);

    months[month] += price;
  });

  return months;
}

export default function MonthlySalesChart({ orders = [] }) {
  const formatNaira = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const monthlySales = getMonthlySales(orders);

  const data = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    datasets: [
      {
        label: "Monthly Sales",
        data: monthlySales,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatNaira(context.raw),
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatNaira(value),
        },
      },
    },
  };

  if (!orders.length) {
    return (
      <div className="h-[280px] flex items-center justify-center text-gray-400 border border-dashed rounded-xl">
        No sales data yet
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <Line data={data} options={options} />
    </div>
  );
}