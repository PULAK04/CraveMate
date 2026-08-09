import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useCallback, useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../config";
import UserOrderMap from "../components/UserOrderMap";
import { BiArrowBack, BiMapPin, BiPhone } from "react-icons/bi";
import { MdOutlineDeliveryDining } from "react-icons/md";

const ORDER_STEPS = ["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up", "delivered"];

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrder(data);
    } catch (error) {
      console.error(error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchOrder();
    socket.on("order:update", refresh);
    socket.on("order:rider_assigned", refresh);
    return () => {
      socket.off("order:update", refresh);
      socket.off("order:rider_assigned", refresh);
    };
  }, [socket, fetchOrder]);

  useEffect(() => {
    if (!socket || !id) return;
    const onRiderLocation = (payload: { orderId?: string; latitude: number; longitude: number }) => {
      if (payload.orderId && payload.orderId !== id) return;
      setRiderLocation([payload.latitude, payload.longitude]);
    };
    socket.on("rider:location", onRiderLocation);
    return () => { socket.off("rider:location", onRiderLocation); };
  }, [socket, id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="h-72 animate-pulse rounded-3xl bg-slate-100" /></div>;
  }

  if (!order) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center"><div className="cm-card p-8"><span className="text-4xl">📦</span><h1 className="mt-4 text-xl font-black text-slate-900">Order not found</h1><button className="cm-secondary mt-5" onClick={() => navigate("/orders")}><BiArrowBack /> Back to orders</button></div></div>;
  }

  const currentStep = Math.max(0, ORDER_STEPS.indexOf(order.status));
  const activeTracking = order.status === "rider_assigned" || order.status === "picked_up";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <button onClick={() => navigate("/orders")} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600"><BiArrowBack /> Back to orders</button>

      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Order #{order._id.slice(-6)}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{order.restaurantName}</h1>
              <p className="mt-2 text-sm text-slate-300">Placed {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold capitalize text-orange-100">{order.status.replaceAll("_", " ")}</span>
          </div>

          {order.status !== "cancelled" && (
            <div className="mt-8 grid grid-cols-7 gap-1">
              {ORDER_STEPS.map((step, index) => (
                <div key={step} className="min-w-0 text-center">
                  <div className={`mx-auto h-2 rounded-full ${index <= currentStep ? "bg-gradient-to-r from-orange-400 to-rose-400" : "bg-white/15"}`} />
                  <p className={`mt-2 hidden truncate text-[9px] font-semibold capitalize sm:block ${index <= currentStep ? "text-orange-100" : "text-slate-500"}`}>{step.replaceAll("_", " ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <section className="space-y-5">
          {activeTracking && (
            <div className="cm-card overflow-hidden p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><MdOutlineDeliveryDining /></span><div><h2 className="font-extrabold text-slate-900">Live delivery</h2><p className="text-xs text-slate-500">Rider location updates automatically while the order is active.</p></div></div>
              {riderLocation ? <UserOrderMap riderLocation={riderLocation} deliveryLocation={[order.deliveryAddress.latitude, order.deliveryAddress.longitude]} /> : <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Waiting for the rider’s first location update...</div>}
            </div>
          )}

          <div className="cm-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Items</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {order.items.map((item, i) => <div className="flex justify-between gap-3 py-3 text-sm" key={`${item.itemId}-${i}`}><span className="text-slate-600"><span className="font-bold text-slate-800">{item.name}</span> × {item.quauntity}</span><span className="font-extrabold text-slate-900">₹{item.price * item.quauntity}</span></div>)}
            </div>
          </div>

          <div className="cm-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Delivery details</h2>
            <div className="mt-4 flex items-start gap-3 text-sm text-slate-600"><BiMapPin className="mt-0.5 shrink-0 text-orange-500" /><span>{order.deliveryAddress.fromattedAddress}</span></div>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-600"><BiPhone className="shrink-0 text-orange-500" /><span>{order.deliveryAddress.mobile}</span></div>
            {order.riderName && <div className="mt-5 rounded-2xl bg-orange-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">Delivery partner</p><p className="mt-1 font-extrabold text-slate-900">{order.riderName}</p>{order.riderPhone && <a href={`tel:${order.riderPhone}`} className="mt-2 inline-flex text-sm font-bold text-orange-700">Call {order.riderPhone}</a>}</div>}
          </div>
        </section>

        <aside className="cm-card p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-extrabold text-slate-900">Payment summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600"><div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-800">₹{order.subtotal}</span></div><div className="flex justify-between"><span>Delivery fee</span><span className="font-semibold text-slate-800">₹{order.deliveryFee}</span></div><div className="flex justify-between"><span>Platform fee</span><span className="font-semibold text-slate-800">₹{order.platfromFee}</span></div></div>
          <div className="mt-5 flex justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-950"><span>Total</span><span>₹{order.totalAmount}</span></div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"><p>Payment method: <span className="font-bold uppercase text-slate-700">{order.paymentMethod}</span></p><p className="mt-1">Payment status: <span className="font-bold capitalize text-emerald-600">{order.paymentStatus}</span></p></div>
        </aside>
      </div>
    </main>
  );
};

export default OrderPage;
