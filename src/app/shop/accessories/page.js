import Sidebar from "../../components/Sidebar";

import Accessoriesproduct from "@/app/components/Accessoriesproduct";

export default function MenPage() {
  return (
    <div className="w-full flex">

      {/* SIDEBAR */}
      <aside className="w-1/4">
        <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r">
          <Sidebar />
        </div>
      </aside>

      {/* PRODUCTS */}
      <main className="w-3/4 p-6">
        <Accessoriesproduct/>
      </main>

    </div>
  );
}