import { supabase, mapFoodFromDb, mapOrderFromDb } from "./supabaseClient";

/**
 * Custom fetch wrapper that automatically appends the JWT authorization token
 * from localStorage to the headers of any outgoing API request.
 * If the API request fails or returns a 404 (common on static platforms like Vercel
 * where the backend Express server doesn't run), it seamlessly falls back to querying
 * Supabase directly on the client side.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isApiCall = urlStr.startsWith("/api/") || urlStr.startsWith("api/") || urlStr.includes("/api/");
  
  const token = localStorage.getItem("token");
  let requestInit = init || {};

  if (token && isApiCall) {
    const headers = new Headers(requestInit.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    requestInit.headers = headers;
  }

  try {
    const response = await fetch(input, requestInit);
    
    // If backend returns a failure or route not found (404), try self-healing Supabase fallback
    if ((!response.ok || response.status === 404) && isApiCall && supabase) {
      const fallback = await trySupabaseFallback(urlStr, requestInit);
      if (fallback) {
        console.log(`✨ Self-healed API call [${urlStr}] using client-side Supabase client.`);
        return fallback;
      }
    }
    return response;
  } catch (err) {
    console.warn(`⚠️ API fetch failed for [${urlStr}]. Attempting client-side Supabase self-healing...`, err);
    if (isApiCall && supabase) {
      const fallback = await trySupabaseFallback(urlStr, requestInit);
      if (fallback) {
        console.log(`✨ Recovered failed API call [${urlStr}] using client-side Supabase client.`);
        return fallback;
      }
    }
    throw err;
  }
}

/**
 * Intercepts /api/ calls and runs them directly against Supabase.
 */
async function trySupabaseFallback(urlStr: string, init?: RequestInit): Promise<Response | null> {
  try {
    // 1. GET /api/foods
    if (urlStr.endsWith("/api/foods") || urlStr.endsWith("api/foods")) {
      const { data, error } = await supabase!.from("foods").select("*");
      if (error) throw error;
      const mappedFoods = (data || []).map(mapFoodFromDb);
      return new Response(JSON.stringify(mappedFoods), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. GET /api/foods/:id
    const foodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (foodIdMatch) {
      const id = foodIdMatch[1];
      const { data, error } = await supabase!.from("foods").select("*").eq("id", id).single();
      if (error) throw error;
      return new Response(JSON.stringify(mapFoodFromDb(data)), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. GET /api/orders
    if (urlStr.endsWith("/api/orders") || urlStr.endsWith("api/orders")) {
      const { data, error } = await supabase!.from("orders").select("*");
      if (error) throw error;
      const mappedOrders = (data || []).map(mapOrderFromDb);
      // Sort newest first
      mappedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return new Response(JSON.stringify(mappedOrders), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. GET /api/orders/:id
    const orderIdMatch = urlStr.match(/\/api\/orders\/([^/]+)$/);
    if (orderIdMatch) {
      const id = orderIdMatch[1];
      const { data, error } = await supabase!.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return new Response(JSON.stringify(mapOrderFromDb(data)), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. POST /api/orders
    if ((urlStr.endsWith("/api/orders") || urlStr.endsWith("api/orders")) && init?.method === "POST" && init.body) {
      const body = JSON.parse(init.body as string);
      const orderId = "order_" + Math.random().toString(36).substring(2, 11);
      
      let totalQuantity = 0;
      let totalPrice = 0;
      const mappedItems = body.foodItems.map((item: any) => {
        const qty = Number(item.quantity) || 1;
        totalQuantity += qty;
        totalPrice += (Number(item.price) || 0) * qty;
        return {
          foodId: item.foodId,
          name: item.name,
          price: Number(item.price),
          image: item.image || "",
          quantity: qty
        };
      });

      const newOrder = {
        id: orderId,
        user_id: "user_guest_" + Math.random().toString(36).substring(2, 11),
        user_name: body.name || "Guest Customer",
        user_email: body.email || "guest@masalakitchen.in",
        food_items: mappedItems,
        total_quantity: totalQuantity,
        total_price: Number(totalPrice.toFixed(2)),
        delivery_address: body.deliveryAddress || "",
        phone: body.phone || "",
        payment_status: "Pending",
        order_status: "Pending",
        created_at: new Date().toISOString()
      };

      const { error } = await supabase!.from("orders").insert(newOrder);
      if (error) throw error;

      return new Response(JSON.stringify(mapOrderFromDb(newOrder)), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    return null;
  } catch (fallbackError) {
    console.error("Client fallback to Supabase failed:", fallbackError);
    return null;
  }
}
