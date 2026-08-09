import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { utilsService } from "../config";
import { useAppData } from "../context/AppContext";
import { BiCheckCircle, BiErrorCircle, BiLoader } from "react-icons/bi";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCart } = useAppData();
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const sessionId = params.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) { setState("error"); return; }
      try {
        await axios.post(`${utilsService}/api/payment/stripe/verify`, { sessionId });
        // The restaurant service clears only the paid restaurant's cart asynchronously.
        // Refresh a few times so the UI catches up without deleting a newer cart client-side.
        await fetchCart();
        window.setTimeout(() => fetchCart(), 600);
        window.setTimeout(() => fetchCart(), 1600);
        setState("success");
      } catch (error) {
        console.error(error);
        setState("error");
      }
    };
    verifyPayment();
  }, [sessionId]);

  return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12 sm:px-6">
    <div className="cm-card w-full p-7 text-center sm:p-9">
      {state === "verifying" && <><BiLoader className="mx-auto h-16 w-16 animate-spin text-orange-500"/><h1 className="mt-5 text-2xl font-black text-slate-950">Confirming your payment</h1><p className="mt-2 text-sm text-slate-500">CraveMate is verifying the Stripe transaction before confirming the order.</p></>}
      {state === "success" && <><BiCheckCircle className="mx-auto h-16 w-16 text-emerald-500"/><h1 className="mt-5 text-2xl font-black text-slate-950">Order confirmed!</h1><p className="mt-2 text-sm text-slate-500">Payment is verified and your restaurant has received the order.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="cm-secondary" onClick={() => navigate("/")}>Order more</button><button className="cm-primary" onClick={() => navigate("/orders")}>Track my order</button></div></>}
      {state === "error" && <><BiErrorCircle className="mx-auto h-16 w-16 text-rose-500"/><h1 className="mt-5 text-2xl font-black text-slate-950">Payment could not be verified</h1><p className="mt-2 text-sm text-slate-500">Your cart has been kept intact. If money was debited, keep the transaction details and check your orders before retrying.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="cm-secondary" onClick={() => navigate("/orders")}>Check orders</button><button className="cm-primary" onClick={() => navigate("/checkout")}>Back to checkout</button></div></>}
    </div>
  </main>;
};

export default OrderSuccess;
