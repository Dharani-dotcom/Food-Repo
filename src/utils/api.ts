import { supabase, mapFoodFromDb, mapOrderFromDb, isSupabaseConfigured } from "./supabaseClient";

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
    
    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.toLowerCase().includes("text/html");

    // If backend returns a failure, route not found (404), or returned HTML for an API route (SPA redirect)
    if ((!response.ok || response.status === 404 || isHtml) && isApiCall && supabase) {
      const fallback = await trySupabaseFallback(urlStr, requestInit);
      if (fallback) {
        console.log(`✨ Self-healed API call [${urlStr}] using client-side Supabase client.`);
        return fallback;
      }
    }

    // Try a test parse if it's an API call to make sure we don't return HTML to a JSON parser
    if (isApiCall && supabase) {
      try {
        const cloned = response.clone();
        const text = await cloned.text();
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
          const fallback = await trySupabaseFallback(urlStr, requestInit);
          if (fallback) {
            console.log(`✨ Self-healed HTML redirect for [${urlStr}] using client-side Supabase.`);
            return fallback;
          }
        }
      } catch (e) {
        // Ignore and let default flow happen
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
 * Intercepts /api/ calls and runs them directly against Supabase.
 */
async function trySupabaseFallback(urlStr: string, init?: RequestInit): Promise<Response | null> {
  try {
    // 1. GET /api/supabase-status
    if (urlStr.endsWith("/api/supabase-status") || urlStr.endsWith("api/supabase-status")) {
      return new Response(JSON.stringify({
        configured: isSupabaseConfigured,
        connected: isSupabaseConfigured,
        error: isSupabaseConfigured ? "" : "Supabase keys not configured in environment.",
        tables: ["users", "passwords", "foods", "orders"],
        sql: `-- COPY & PASTE THIS SQL IN YOUR SUPABASE SQL EDITOR TO CREATE TABLES\n\n` + 
             `-- 1. Create Users Table\n` +
             `CREATE TABLE IF NOT EXISTS public.users (\n` +
             `  id TEXT PRIMARY KEY,\n` +
             `  name TEXT NOT NULL,\n` +
             `  email TEXT UNIQUE NOT NULL,\n` +
             `  phone TEXT,\n` +
             `  address TEXT,\n` +
             `  role TEXT DEFAULT 'User',\n` +
             `  created_at TIMESTAMPTZ DEFAULT NOW()\n` +
             `);\n\n` +
             `-- 2. Create Passwords Table\n` +
             `CREATE TABLE IF NOT EXISTS public.passwords (\n` +
             `  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,\n` +
             `  password_hash TEXT NOT NULL\n` +
             `);\n\n` +
             `-- 3. Create Foods Table\n` +
             `CREATE TABLE IF NOT EXISTS public.foods (\n` +
             `  id TEXT PRIMARY KEY,\n` +
             `  name TEXT NOT NULL,\n` +
             `  description TEXT,\n` +
             `  price NUMERIC NOT NULL,\n` +
             `  category TEXT NOT NULL,\n` +
             `  image TEXT,\n` +
             `  available BOOLEAN DEFAULT TRUE,\n` +
             `  rating NUMERIC DEFAULT 4.5,\n` +
             `  created_at TIMESTAMPTZ DEFAULT NOW()\n` +
             `);\n\n` +
             `-- 4. Create Orders Table\n` +
             `CREATE TABLE IF NOT EXISTS public.orders (\n` +
             `  id TEXT PRIMARY KEY,\n` +
             `  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,\n` +
             `  user_name TEXT,\n` +
             `  user_email TEXT,\n` +
             `  food_items JSONB NOT NULL,\n` +
             `  total_quantity INTEGER NOT NULL,\n` +
             `  total_price NUMERIC NOT NULL,\n` +
             `  delivery_address TEXT,\n` +
             `  phone TEXT,\n` +
             `  payment_status TEXT DEFAULT 'Pending',\n` +
             `  order_status TEXT DEFAULT 'Pending',\n` +
             `  created_at TIMESTAMPTZ DEFAULT NOW()\n` +
             `);\n\n` +
             `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;\n` +
             `ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;\n` +
             `ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;\n` +
             `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;\n\n` +
             `CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true);\n` +
             `CREATE POLICY "Allow public access to passwords" ON public.passwords FOR ALL USING (true);\n` +
             `CREATE POLICY "Allow public access to foods" ON public.foods FOR ALL USING (true);\n` +
             `CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);\n`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. GET /api/foods
    if ((urlStr.endsWith("/api/foods") || urlStr.endsWith("api/foods")) && (!init?.method || init.method === "GET")) {
      let { data, error } = await supabase!.from("foods").select("*");
      if (error) throw error;
      
      // If table is empty, auto-seed it on the client-side
      if (!data || data.length === 0) {
        console.log("✨ Supabase food table is empty. Auto-seeding default delicious foodstuffs directly on client-side...");
        const dbItems = defaultFoods.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          available: item.available,
          rating: item.rating
        }));
        
        const { error: insertError } = await supabase!.from("foods").insert(dbItems);
        if (!insertError) {
          const { data: refreshedData } = await supabase!.from("foods").select("*");
          if (refreshedData && refreshedData.length > 0) {
            data = refreshedData;
          } else {
            data = dbItems;
          }
        } else {
          console.warn("Could not insert seed foods, returning default items statically:", insertError);
          data = dbItems;
        }
      }

      const mappedFoods = (data || []).map(mapFoodFromDb);
      return new Response(JSON.stringify(mappedFoods), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. POST /api/foods
    if ((urlStr.endsWith("/api/foods") || urlStr.endsWith("api/foods")) && init?.method === "POST" && init.body) {
      const body = JSON.parse(init.body as string);
      const foodId = "food_" + Math.random().toString(36).substring(2, 11);
      const newFood = {
        id: foodId,
        name: body.name,
        description: body.description || "",
        price: Number(body.price),
        category: body.category,
        image: body.image || "",
        available: body.available !== false,
        rating: Number(body.rating || 5.0),
        created_at: new Date().toISOString()
      };
      const { error } = await supabase!.from("foods").insert(newFood);
      if (error) throw error;
      return new Response(JSON.stringify(mapFoodFromDb(newFood)), {
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
      const { error } = await supabase!.from("foods").update(updatedFields).eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, ...updatedFields, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. DELETE /api/foods/:id
    const delFoodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (delFoodIdMatch && init?.method === "DELETE") {
      const id = delFoodIdMatch[1];
      const { error } = await supabase!.from("foods").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 6. GET /api/foods/:id
    const foodIdMatch = urlStr.match(/\/api\/foods\/([^/]+)$/);
    if (foodIdMatch && (!init?.method || init.method === "GET")) {
      const id = foodIdMatch[1];
      const { data, error } = await supabase!.from("foods").select("*").eq("id", id).single();
      if (error) throw error;
      return new Response(JSON.stringify(mapFoodFromDb(data)), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 7. GET /api/orders
    if ((urlStr.endsWith("/api/orders") || urlStr.endsWith("api/orders")) && (!init?.method || init.method === "GET")) {
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

    // 8. PUT /api/orders/:id/status
    const orderStatusMatch = urlStr.match(/\/api\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && init?.method === "PUT" && init.body) {
      const id = orderStatusMatch[1];
      const body = JSON.parse(init.body as string);
      const { error } = await supabase!.from("orders").update({ order_status: body.status }).eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, orderStatus: body.status }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 9. GET /api/orders/:id
    const orderIdMatch = urlStr.match(/\/api\/orders\/([^/]+)$/);
    if (orderIdMatch && (!init?.method || init.method === "GET")) {
      const id = orderIdMatch[1];
      const { data, error } = await supabase!.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return new Response(JSON.stringify(mapOrderFromDb(data)), {
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

    // 11. GET /api/users
    if ((urlStr.endsWith("/api/users") || urlStr.endsWith("api/users")) && (!init?.method || init.method === "GET")) {
      const { data, error } = await supabase!.from("users").select("*");
      if (error) throw error;
      const mappedUsers = (data || []).map((dbUser: any) => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone || "",
        address: dbUser.address || "",
        role: dbUser.role || "User",
        createdAt: dbUser.created_at || new Date().toISOString()
      }));
      return new Response(JSON.stringify(mappedUsers), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 12. DELETE /api/users/:id
    const delUserMatch = urlStr.match(/\/api\/users\/([^/]+)$/);
    if (delUserMatch && init?.method === "DELETE") {
      const id = delUserMatch[1];
      const { error } = await supabase!.from("users").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return null;
  } catch (fallbackError) {
    console.error("Client fallback to Supabase failed:", fallbackError);
    return null;
  }
}
