import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../config";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";
import BrandLogo from "../components/BrandLogo";
import { BiDish, BiPlusCircle, BiReceipt } from "react-icons/bi";

type SellerTab = "menu" | "add-item" | "orders";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("orders");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/restaurant/my`, { headers: authHeaders() });
      setRestaurant(data.restaurant || null);
      if (data.token) localStorage.setItem("token", data.token);
    } catch (error) {
      console.error(error);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/item/all/${restaurantId}`, { headers: authHeaders() });
      setMenuItems(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchMyRestaurant(); }, []);
  useEffect(() => { if (restaurant?._id) fetchMenuItems(restaurant._id); }, [restaurant?._id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Loading your CraveMate restaurant...</div>;
  if (!restaurant) return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;

  const tabs = [
    { key: "orders", label: "Orders", icon: <BiReceipt /> },
    { key: "menu", label: "Menu", icon: <BiDish /> },
    { key: "add-item", label: "Add item", icon: <BiPlusCircle /> },
  ] as const;

  return (
    <main className="min-h-screen pb-12">
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo />
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">Seller Studio</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6">
        <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller />

        <section className="cm-card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100 p-2">
            {tabs.map((item) => (
              <button key={item.key} onClick={() => setTab(item.key)} className={`flex min-w-32 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === item.key ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>
          <div className="p-5 sm:p-6">
            {tab === "orders" && <RestaurantOrders restaurantId={restaurant._id} />}
            {tab === "menu" && <MenuItems items={menuItems} onItemDeleted={() => fetchMenuItems(restaurant._id)} isSeller />}
            {tab === "add-item" && <AddMenuItem onItemAdded={() => { fetchMenuItems(restaurant._id); setTab("menu"); }} />}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Restaurant;
