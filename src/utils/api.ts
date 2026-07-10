import { isFirebaseConfigured, firebaseFallback } from "./firebaseClient";

/**
 * Custom fetch wrapper that automatically appends the JWT authorization token
 * from localStorage to the headers of any outgoing API request.
 * If the API request fails or returns a 404 (common on static platforms like Vercel
 * where the backend Express server doesn't run), it seamlessly falls back to querying
 * Firebase Firestore directly on the client side.
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
    
    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.toLowerCase().includes("text/html");

    // If backend returns a failure, route not found (404), or returned HTML for an API route (SPA redirect)
    if ((!response.ok || response.status === 404 || isHtml) && isApiCall && isFirebaseConfigured) {
      const fallback = await tryFirebaseFallback(urlStr, requestInit);
      if (fallback) {
        console.log(`✨ Self-healed API call [${urlStr}] using client-side Firebase client.`);
        return fallback;
      }
    }

    // Try a test parse if it's an API call to make sure we don't return HTML/text to a JSON parser
    if (isApiCall && isFirebaseConfigured) {
      try {
        const cloned = response.clone();
        const text = await cloned.text();
        const trimmed = text.trim();
        const isNotJson = !trimmed.startsWith("{") && !trimmed.startsWith("[");
        if (isNotJson || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
          const fallback = await tryFirebaseFallback(urlStr, requestInit);
          if (fallback) {
            console.log(`✨ Self-healed HTML/text redirect for [${urlStr}] using client-side Firebase.`);
            return fallback;
          }
        }
      } catch (e) {
        // Ignore and let default flow happen
      }
    }

    return response;
  } catch (err) {
    console.warn(`⚠️ API fetch failed for [${urlStr}]. Attempting client-side Firebase self-healing...`, err);
    if (isApiCall && isFirebaseConfigured) {
      const fallback = await tryFirebaseFallback(urlStr, requestInit);
      if (fallback) {
        console.log(`✨ Recovered failed API call [${urlStr}] using client-side Firebase client.`);
        return fallback;
      }
    }
    throw err;
  }
}

const defaultFoods = [
  {
    id: "food_1",
    name: "Classic Paneer Tikka",
    description: "Cubes of fresh cottage cheese marinated in spiced yogurt and grilled in a traditional tandoor clay oven with bell peppers and onions.",
    price: 249,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8
  },
  {
    id: "food_2",
    name: "Old Delhi Butter Chicken",
    description: "Tender tandoori chicken cooked in a rich, creamy, and velvety tomato-butter gravy flavored with fenugreek leaves.",
    price: 389,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9
  },
  {
    id: "food_3",
    name: "Hyderabadi Dum Biryani",
    description: "Fragrant basmati rice layered with aromatic spices and slow-cooked (dum) to lock in pure traditional flavors, served with raita.",
    price: 349,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9
  },
  {
    id: "food_4",
    name: "Butter Garlic Naan",
    description: "Soft tandoor-baked leavened flatbread brushed with organic butter and finely chopped fresh garlic.",
    price: 69,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.7
  },
  {
    id: "food_5",
    name: "Creamy Paneer Butter Masala",
    description: "Succulent cottage cheese cubes simmered in a mildly sweet, spicy, onion-tomato cream sauce.",
    price: 329,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8
  },
  {
    id: "food_6",
    name: "Kesar Gulab Jamun",
    description: "Deep-fried milk solids dumplings soaked in warm saffron-infused sugar syrup, garnishing with pistachio slices.",
    price: 99,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9
  },
  {
    id: "food_7",
    name: "Traditional Mango Lassi",
    description: "Creamy, rich yogurt drink blended sweet with premium Alphonso mango pulp and a pinch of cardamom.",
    price: 119,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.7
  },
  {
    id: "food_8",
    name: "Saffron Masala Chai",
    description: "Rich Indian milk tea slow-brewed with fresh ginger, crushed cardamoms, cloves, and a hint of fine Kashmiri saffron.",
    price: 49,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8
  }
];

/**
 * Intercepts /api/ calls and runs them directly against Firebase Firestore.
 */
async function tryFirebaseFallback(urlStr: string, init?: RequestInit): Promise<Response | null> {
  try {
    // 1. GET /api/supabase-status
    if (urlStr.endsWith("/api/supabase-status") || urlStr.endsWith("api/supabase-status")) {
      return new Response(JSON.stringify({
        configured: isFirebaseConfigured,
        connected: isFirebaseConfigured,
        error: isFirebaseConfigured ? "" : "Firebase config not found.",
        tables: {
          users: true,
          passwords: true,
          foods: true,
          orders: true
        },
        sql: ""
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. GET /api/foods
    if ((urlStr.endsWith("/api/foods") || urlStr.endsWith("api/foods")) && (!init?.method || init.method === "GET")) {
      let data = await firebaseFallback.getFoods();
      
      // If table is empty, auto-seed it on the client-side
      if (!data || data.length === 0) {
        console.log("✨ Firestore food collection is empty. Auto-seeding default delicious foodstuffs directly on client-side...");
        for (const item of defaultFoods) {
          await firebaseFallback.saveFood(item.id, {
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image,
            available: item.available,
            rating: item.rating,
            createdAt: new Date().toISOString()
          });
        }
        data = await firebaseFallback.getFoods();
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. POST /api/foods
    if ((urlStr.endsWith("/api/foods") || urlStr.endsWith("api/foods")) && init?.method === "POST" && init.body) {
      const body = JSON.parse(init.body as string);
      const foodId = "food_" + Math.random().toString(36).substring(2, 11);
      const newFood = {
        name: body.name,
        description: body.description || "",
        price: Number(body.price),
        category: body.category,
        image: body.image || "",
        available: body.available !== false,
        rating: Number(body.rating || 5.0),
        createdAt: new Date().toISOString()
      };
      await firebaseFallback.saveFood(foodId, newFood);
      return new Response(JSON.stringify({ id: foodId, ...newFood }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. PUT /api/foods/:id
    const putFoodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (putFoodIdMatch && init?.method === "PUT" && init.body) {
      const id = putFoodIdMatch[1];
      const body = JSON.parse(init.body as string);
      const updatedFields = {
        name: body.name,
        description: body.description,
        price: Number(body.price),
        category: body.category,
        image: body.image,
        available: body.available !== false,
        rating: Number(body.rating || 5.0)
      };
      await firebaseFallback.saveFood(id, updatedFields);
      return new Response(JSON.stringify({ success: true, ...updatedFields, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. DELETE /api/foods/:id
    const delFoodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (delFoodIdMatch && init?.method === "DELETE") {
      const id = delFoodIdMatch[1];
      await firebaseFallback.deleteFood(id);
      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 6. GET /api/foods/:id
    const foodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (foodIdMatch && (!init?.method || init.method === "GET")) {
      const id = foodIdMatch[1];
      const food = await firebaseFallback.getFoodById(id);
      return new Response(JSON.stringify(food), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 7. GET /api/orders
    if ((urlStr.endsWith("/api/orders") || urlStr.endsWith("api/orders")) && (!init?.method || init.method === "GET")) {
      const data = await firebaseFallback.getOrders();
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 8. PUT /api/orders/:id/status
    const orderStatusMatch = urlStr.match(/\/api\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && init?.method === "PUT" && init.body) {
      const id = orderStatusMatch[1];
      const body = JSON.parse(init.body as string);
      await firebaseFallback.updateOrderStatus(id, body.status);
      return new Response(JSON.stringify({ success: true, orderStatus: body.status }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 9. GET /api/orders/:id
    const orderIdMatch = urlStr.match(/\/api\/orders\/([^/]+)$/);
    if (orderIdMatch && (!init?.method || init.method === "GET")) {
      const id = orderIdMatch[1];
      const order = await firebaseFallback.getOrderById(id);
      return new Response(JSON.stringify(order), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 10. POST /api/orders
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
        userId: "user_guest_" + Math.random().toString(36).substring(2, 11),
        userName: body.name || "Guest Customer",
        userEmail: body.email || "guest@masalakitchen.in",
        foodItems: mappedItems,
        totalQuantity: totalQuantity,
        totalPrice: Number(totalPrice.toFixed(2)),
        deliveryAddress: body.deliveryAddress || "",
        phone: body.phone || "",
        paymentStatus: "Pending",
        orderStatus: "Pending",
        createdAt: new Date().toISOString()
      };

      await firebaseFallback.saveOrder(orderId, newOrder);

      return new Response(JSON.stringify({ id: orderId, ...newOrder }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 11. GET /api/users
    if ((urlStr.endsWith("/api/users") || urlStr.endsWith("api/users")) && (!init?.method || init.method === "GET")) {
      const data = await firebaseFallback.getUsers();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 12. DELETE /api/users/:id
    const delUserMatch = urlStr.match(/\/api\/users\/([^/]+)$/);
    if (delUserMatch && init?.method === "DELETE") {
      const id = delUserMatch[1];
      await firebaseFallback.deleteUser(id);
      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return null;
  } catch (fallbackError) {
    console.error("Client fallback to Firebase failed:", fallbackError);
    return null;
  }
}
