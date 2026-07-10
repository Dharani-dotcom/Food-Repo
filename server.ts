import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { dbService } from "./server/db";
import { getFirebaseStatus } from "./server/firebase";
import { User, Food, Order, OrderStatus } from "./src/types";

// Extend Express Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "Admin" | "User";
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "gourmet-secret-key-12345!";
const PORT = 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Socket.IO Setup
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Simple connection log
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Allow users to join a specific order room or admin room
    socket.on("joinOrder", (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room order_${orderId}`);
    });

    socket.on("joinAdmins", () => {
      socket.join("admins");
      console.log(`Socket ${socket.id} joined admins room`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Base middleware
  app.use(express.json());
  app.use(cookieParser());

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Helper auth middleware
  const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role: "Admin" | "User";
      };
      req.user = decoded;
    } catch (err) {
      console.error("JWT verification failed:", err);
    }
    next();
  };

  const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized access. Please login first." });
      return;
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== "Admin") {
      res.status(403).json({ error: "Access denied. Admin privileges required." });
      return;
    }
    next();
  };

  app.use(authenticateToken);

  // ==================== AUTHENTICATION ENDPOINTS ====================

  // POST /api/auth/register
  app.post("/api/auth/register", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, phone, address, role } = req.body;

      if (!name || !email || !password || !phone || !address) {
        res.status(400).json({ error: "All registration fields are required." });
        return;
      }

      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters long." });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Setup default role
      // Note: First user can register as admin if needed, or we allow specific selection for testing purposes
      const userRole: "Admin" | "User" = (role === "Admin" || email.includes("admin")) ? "Admin" : "User";

      const newUser: User = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone,
        address,
        role: userRole,
        createdAt: new Date().toISOString()
      };

      await dbService.createUser(newUser, hashedPassword);

      // Create JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({ user: newUser, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const passwordHash = await dbService.getUserPassword(user.id);
      if (!passwordHash) {
        res.status(401).json({ error: "Invalid credentials." });
        return;
      }

      const isMatch = await bcrypt.compare(password, passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      // Create JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ user, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in." });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("token", {
      secure: true,
      sameSite: "none"
    });
    res.json({ message: "Successfully logged out." });
  });

  // GET /api/auth/profile
  app.get("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
    const user = await dbService.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json(user);
  });


  // ==================== FOODS ENDPOINTS ====================

  // GET /api/foods
  app.get("/api/foods", async (req: Request, res: Response) => {
    const foods = await dbService.getFoods();
    res.json(foods);
  });

  // GET /api/foods/:id
  app.get("/api/foods/:id", async (req: Request, res: Response) => {
    const food = await dbService.getFoodById(req.params.id);
    if (!food) {
      res.status(404).json({ error: "Food item not found." });
      return;
    }
    res.json(food);
  });

  // POST /api/foods (Admin only)
  app.post("/api/foods", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, price, category, image, available, rating } = req.body;

      if (!name || !description || isNaN(Number(price)) || !category) {
        res.status(400).json({ error: "Name, description, valid price, and category are required." });
        return;
      }

      // High quality stock photo fallback if no image provided
      let finalImage = image;
      if (!finalImage || finalImage.trim() === "") {
        const query = encodeURIComponent(category || "gourmet food");
        finalImage = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800`;
      }

      const newFood = await dbService.createFood({
        name,
        description,
        price: Number(price),
        category,
        image: finalImage,
        available: available !== undefined ? Boolean(available) : true,
        rating: rating !== undefined ? Number(rating) : 5.0
      });

      res.status(201).json(newFood);
    } catch (err) {
      console.error("Create food error:", err);
      res.status(500).json({ error: "Failed to create food item." });
    }
  });

  // PUT /api/foods/:id (Admin only)
  app.put("/api/foods/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, price, category, image, available, rating } = req.body;
      const updates: Partial<Omit<Food, "id" | "createdAt">> = {};

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = Number(price);
      if (category !== undefined) updates.category = category;
      if (image !== undefined) updates.image = image;
      if (available !== undefined) updates.available = Boolean(available);
      if (rating !== undefined) updates.rating = Number(rating);

      const updatedFood = await dbService.updateFood(req.params.id, updates);
      if (!updatedFood) {
        res.status(404).json({ error: "Food item not found." });
        return;
      }

      res.json(updatedFood);
    } catch (err) {
      console.error("Update food error:", err);
      res.status(500).json({ error: "Failed to update food item." });
    }
  });

  // DELETE /api/foods/:id (Admin only)
  app.delete("/api/foods/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const success = await dbService.deleteFood(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Food item not found." });
      return;
    }
    res.json({ message: "Food item successfully deleted." });
  });


  // ==================== ORDERS ENDPOINTS ====================

  // POST /api/orders (Client places order - supports logged in users & guests)
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { foodItems, deliveryAddress, phone, name, email } = req.body;

      if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
        res.status(400).json({ error: "Order must contain at least one food item." });
        return;
      }

      if (!deliveryAddress || !phone) {
        res.status(400).json({ error: "Delivery address and contact phone number are required." });
        return;
      }

      let user;
      let tokenToSet: string | null = null;

      if (req.user) {
        user = await dbService.getUserById(req.user.id);
      } else {
        // Guest checkout - requires name and email
        if (!name || !email) {
          res.status(400).json({ error: "Your Name and Email Address are required to complete guest checkout." });
          return;
        }

        // Check if user already exists with this email
        let existingUser = await dbService.getUserByEmail(email);
        if (!existingUser) {
          // Auto-generate a guest user
          const guestId = `user_${Math.random().toString(36).substring(2, 11)}`;
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash("guest_password_123", salt);

          existingUser = await dbService.createUser({
            id: guestId,
            name,
            email,
            phone,
            address: deliveryAddress,
            role: "User",
            createdAt: new Date().toISOString()
          }, hashedPassword);
        } else {
          // Update address/phone
          await dbService.updateUser(existingUser.id, {
            phone,
            address: deliveryAddress
          });
          existingUser = await dbService.getUserById(existingUser.id) || existingUser;
        }

        user = existingUser;

        // Generate JWT token for auto-login
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        tokenToSet = token;
      }

      if (!user) {
        res.status(404).json({ error: "User profile could not be loaded or created." });
        return;
      }

      let totalQuantity = 0;
      let totalPrice = 0;
      const verifiedItems = [];

      for (const item of foodItems) {
        const food = await dbService.getFoodById(item.foodId);
        if (!food) {
          res.status(400).json({ error: `Food item with ID ${item.foodId} not found.` });
          return;
        }
        if (!food.available) {
          res.status(400).json({ error: `Food item '${food.name}' is currently unavailable.` });
          return;
        }

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          res.status(400).json({ error: "Quantity must be a positive integer." });
          return;
        }

        totalQuantity += qty;
        totalPrice += food.price * qty;

        verifiedItems.push({
          foodId: food.id,
          name: food.name,
          price: food.price,
          image: food.image,
          quantity: qty
        });
      }

      const newOrder = await dbService.createOrder({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        foodItems: verifiedItems,
        totalQuantity,
        totalPrice: Number(totalPrice.toFixed(2)),
        deliveryAddress,
        phone,
        paymentStatus: req.body.paymentStatus || "Pending",
        orderStatus: "Pending"
      });

      // Emits instant event to all connected admin clients that a new order was placed
      io.to("admins").emit("newOrder", newOrder);

      // Set cookie if token generated
      if (tokenToSet) {
        res.cookie("token", tokenToSet, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
      }

      res.status(201).json({
        ...newOrder,
        ...(tokenToSet ? { token: tokenToSet, user } : {})
      });
    } catch (err) {
      console.error("Create order error:", err);
      res.status(500).json({ error: "Failed to place order." });
    }
  });

  // GET /api/orders (Returns list of orders)
  // Admin gets ALL orders; standard users get ONLY their own orders
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    if (req.user!.role === "Admin") {
      const allOrders = await dbService.getOrders();
      // Sort newest first
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(allOrders);
    } else {
      const userOrders = await dbService.getOrdersByUser(req.user!.id);
      userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(userOrders);
    }
  });

  // GET /api/orders/:id
  app.get("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    const order = await dbService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    // Verify ownership
    if (req.user!.role !== "Admin" && order.userId !== req.user!.id) {
      res.status(403).json({ error: "Access denied. This order does not belong to you." });
      return;
    }

    res.json(order);
  });

  // PUT /api/orders/:id/status (Admin only - status updater with real-time Socket.IO emission)
  app.put("/api/orders/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const validStatuses: OrderStatus[] = [
        "Pending",
        "Accepted",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
      ];

      if (!status || !validStatuses.includes(status as OrderStatus)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        return;
      }

      const updatedOrder = await dbService.updateOrderStatus(req.params.id, status as OrderStatus);
      if (!updatedOrder) {
        res.status(404).json({ error: "Order not found." });
        return;
      }

      // Real-time instant status update event
      // Broadcast specifically to the order room (so customer gets it immediately without refresh)
      io.to(`order_${updatedOrder.id}`).emit("orderStatusUpdate", {
        orderId: updatedOrder.id,
        status: updatedOrder.orderStatus
      });

      // Also notify admins of general updates if needed
      io.to("admins").emit("orderUpdated", updatedOrder);

      res.json(updatedOrder);
    } catch (err) {
      console.error("Update status error:", err);
      res.status(500).json({ error: "Failed to update order status." });
    }
  });


  // ==================== USERS ENDPOINTS (Admin only) ====================

  // GET /api/users
  app.get("/api/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const users = await dbService.getUsers();
    res.json(users);
  });

  // GET /api/supabase-status (Legacy name, now proxies Firebase status)
  app.get("/api/supabase-status", async (req: Request, res: Response) => {
    try {
      const { syncFromFirebase, getFirebaseStatus } = await import("./server/firebase");
      await syncFromFirebase();
      const status = getFirebaseStatus();
      res.json({
        configured: status.configured,
        connected: status.connected,
        error: status.error,
        tables: status.collectionsFound,
        sql: "" // No SQL setup is needed for Firebase Firestore!
      });
    } catch (err: any) {
      console.error("Error in /api/supabase-status:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/users/:id
  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    if (req.params.id === req.user!.id) {
      res.status(400).json({ error: "You cannot delete your own admin account." });
      return;
    }
    
    const success = await dbService.deleteUser(req.params.id);
    if (!success) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ message: "User successfully deleted." });
  });

  // Setup static folder and Vite template
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting Express + Socket.IO server:", err);
});
