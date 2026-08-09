import { Request, Response } from "express";
import axios from "axios";
import Stripe from "stripe";
import { razorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order id is required" });
    }

    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: data.amount * 100,
      currency: "INR",
      receipt: orderId,
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    res.status(500).json({ message: "Could not start Razorpay checkout" });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({ message: "Incomplete payment details" });
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const [gatewayOrder, gatewayPayment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    if (String(gatewayOrder.receipt) !== String(orderId)) {
      return res.status(400).json({ message: "Payment does not match this order" });
    }
    if (String(gatewayPayment.order_id) !== String(razorpay_order_id)) {
      return res.status(400).json({ message: "Payment does not match the Razorpay order" });
    }
    if (gatewayPayment.status !== "captured") {
      return res.status(400).json({ message: "Razorpay payment is not captured" });
    }

    await publishPaymentSuccess({
      orderId,
      paymentId: razorpay_payment_id,
      provider: "razorpay",
    });

    res.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Razorpay verification failed", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

export const payWithStripe = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order id is required" });
    }

    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "CraveMate food order",
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: { orderId },
      success_url: `${process.env.FRONTEND_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout creation failed", error);
    res.status(500).json({ message: "Stripe checkout could not be created" });
  }
};

export const verifyStripe = async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "Stripe session id is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Stripe payment is not completed" });
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "Order id is missing from Stripe session" });
    }

    await publishPaymentSuccess({
      orderId,
      paymentId: session.payment_intent?.toString() || sessionId,
      provider: "stripe",
    });

    res.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Stripe verification failed", error);
    res.status(500).json({ message: "Stripe payment verification failed" });
  }
};
