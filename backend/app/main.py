from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime, timedelta
from typing import List, Optional

from .database import get_db, Base, engine
from .models import Customer, Product, Order, OrderItem
from . import schemas

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

# Modern lifespan handler (replaces deprecated @app.on_event)
@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ApexStock API",
    description="Python FastAPI backend for ApexStock Inventory & Order Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Stock status calculator
def calculate_stock_status(quantity: int, min_stock: int) -> str:
    if quantity == 0:
        return "OUT_OF_STOCK"
    elif quantity <= min_stock:
        return "LOW_STOCK"
    return "IN_STOCK"


# ==========================================
# ROOT / INFO
# ==========================================
@app.get("/")
def root():
    return {
        "name": "ApexStock API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


# ==========================================
# HEALTH CHECK
# ==========================================
@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}


# ==========================================
# 1. ANALYTICS ENDPOINT
# ==========================================
@app.get("/api/analytics", response_model=schemas.AnalyticsResponse)
@app.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    try:
        # A. Key Metrics
        products = db.query(Product).all()
        total_products = len(products)
        
        low_stock_count = sum(1 for p in products if p.quantity <= p.minStockLevel)
        
        orders = db.query(Order).all()
        total_orders = len(orders)
        pending_orders = sum(1 for o in orders if o.status == "PENDING")
        
        total_sales = sum(
            o.totalAmount for o in orders if o.status in ["SHIPPED", "DELIVERED"]
        )

        total_customers = db.query(Customer).count()

        # B. Low Stock Products list
        low_stock_products = []
        for p in products:
            if p.quantity <= p.minStockLevel:
                low_stock_products.append(
                    schemas.LowStockProductModel(
                        id=p.id,
                        sku=p.sku,
                        name=p.name,
                        quantity=p.quantity,
                        minStockLevel=p.minStockLevel,
                        status=calculate_stock_status(p.quantity, p.minStockLevel)
                    )
                )

        # C. Sales Trend (Past 7 days)
        sales_trend = []
        trend_dates = {}
        for i in range(6, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            date_key = date.strftime("%Y-%m-%d")
            display_date = date.strftime("%b %d")
            trend_dates[date_key] = {"date": display_date, "sales": 0.0, "count": 0}

        for o in orders:
            if o.status in ["SHIPPED", "DELIVERED"]:
                order_date = o.createdAt.strftime("%Y-%m-%d")
                if order_date in trend_dates:
                    trend_dates[order_date]["sales"] += o.totalAmount
                    trend_dates[order_date]["count"] += 1

        for key in sorted(trend_dates.keys()):
            sales_trend.append(
                schemas.SalesTrendModel(
                    date=trend_dates[key]["date"],
                    sales=trend_dates[key]["sales"],
                    count=trend_dates[key]["count"]
                )
            )

        # D. Top Selling Products
        top_products_query = db.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.quantity * OrderItem.unitPrice).label("revenue")
        ).join(OrderItem, Product.id == OrderItem.productId)\
         .join(Order, OrderItem.orderId == Order.id)\
         .filter(Order.status.in_(["SHIPPED", "DELIVERED"]))\
         .group_by(Product.id)\
         .order_by(func.sum(OrderItem.quantity).desc())\
         .limit(5).all()

        top_products = [
            schemas.TopProductModel(
                id=item[0],
                name=item[1],
                sku=item[2],
                unitsSold=int(item[3]),
                revenue=float(item[4])
            ) for item in top_products_query
        ]

        return schemas.AnalyticsResponse(
            metrics=schemas.MetricModel(
                totalSales=float(total_sales),
                pendingOrders=pending_orders,
                lowStockAlerts=low_stock_count,
                totalProducts=total_products,
                totalCustomers=total_customers,
                totalOrders=total_orders
            ),
            lowStockProducts=low_stock_products,
            salesTrend=sales_trend,
            topProducts=top_products
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile analytics: {str(e)}")


# ==========================================
# 2. PRODUCT ENDPOINTS
# ==========================================
@app.get("/api/products", response_model=List[schemas.ProductResponse])
@app.get("/products", response_model=List[schemas.ProductResponse])
def read_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.sku.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )

    products = query.order_by(Product.createdAt.desc()).all()
    results = []

    for p in products:
        prod_status = calculate_stock_status(p.quantity, p.minStockLevel)
        if status and prod_status != status:
            continue
            
        results.append(
            schemas.ProductResponse(
                id=p.id,
                sku=p.sku,
                name=p.name,
                description=p.description,
                price=p.price,
                quantity=p.quantity,
                minStockLevel=p.minStockLevel,
                category=p.category,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
                status=prod_status
            )
        )
    return results


@app.get("/api/products/{id}", response_model=schemas.ProductResponse)
@app.get("/products/{id}", response_model=schemas.ProductResponse)
def read_product(id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return schemas.ProductResponse(
        id=p.id,
        sku=p.sku,
        name=p.name,
        description=p.description,
        price=p.price,
        quantity=p.quantity,
        minStockLevel=p.minStockLevel,
        category=p.category,
        createdAt=p.createdAt,
        updatedAt=p.updatedAt,
        status=calculate_stock_status(p.quantity, p.minStockLevel)
    )


@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check SKU uniqueness
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU {product.sku} already exists"
        )
    
    # Validation: Product quantity cannot be negative
    if product.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product quantity cannot be negative"
        )

    new_prod = Product(
        sku=product.sku,
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        minStockLevel=product.minStockLevel,
        category=product.category
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    
    return schemas.ProductResponse(
        id=new_prod.id,
        sku=new_prod.sku,
        name=new_prod.name,
        description=new_prod.description,
        price=new_prod.price,
        quantity=new_prod.quantity,
        minStockLevel=new_prod.minStockLevel,
        category=new_prod.category,
        createdAt=new_prod.createdAt,
        updatedAt=new_prod.updatedAt,
        status=calculate_stock_status(new_prod.quantity, new_prod.minStockLevel)
    )


@app.put("/api/products/{id}", response_model=schemas.ProductResponse)
@app.put("/products/{id}", response_model=schemas.ProductResponse)
def update_product(id: str, prod_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_prod = db.query(Product).filter(Product.id == id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if prod_update.sku and prod_update.sku != db_prod.sku:
        existing = db.query(Product).filter(Product.sku == prod_update.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already in use")

    if prod_update.quantity is not None and prod_update.quantity < 0:
        raise HTTPException(status_code=400, detail="Product quantity cannot be negative")

    for key, value in prod_update.model_dump(exclude_unset=True).items():
        setattr(db_prod, key, value)

    db_prod.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_prod)

    return schemas.ProductResponse(
        id=db_prod.id,
        sku=db_prod.sku,
        name=db_prod.name,
        description=db_prod.description,
        price=db_prod.price,
        quantity=db_prod.quantity,
        minStockLevel=db_prod.minStockLevel,
        category=db_prod.category,
        createdAt=db_prod.createdAt,
        updatedAt=db_prod.updatedAt,
        status=calculate_stock_status(db_prod.quantity, db_prod.minStockLevel)
    )


@app.delete("/api/products/{id}")
@app.delete("/products/{id}")
def delete_product(id: str, db: Session = Depends(get_db)):
    db_prod = db.query(Product).filter(Product.id == id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check order items
    order_items_count = db.query(OrderItem).filter(OrderItem.productId == id).count()
    if order_items_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Product cannot be deleted because it is linked to orders. Try setting quantity to 0 instead."
        )

    db.delete(db_prod)
    db.commit()
    return {"message": "Product deleted successfully"}


# ==========================================
# 3. CUSTOMER ENDPOINTS
# ==========================================
@app.get("/api/customers", response_model=List[schemas.CustomerResponse])
@app.get("/customers", response_model=List[schemas.CustomerResponse])
def read_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(Customer.createdAt.desc()).all()
    results = []
    for c in customers:
        orders_count = db.query(Order).filter(Order.customerId == c.id).count()
        results.append(
            schemas.CustomerResponse(
                id=c.id,
                name=c.name,
                email=c.email,
                phone=c.phone,
                createdAt=c.createdAt,
                updatedAt=c.updatedAt,
                _count=schemas.CountModel(orders=orders_count)
            )
        )
    return results


@app.get("/api/customers/{id}", response_model=schemas.CustomerResponse)
@app.get("/customers/{id}", response_model=schemas.CustomerResponse)
def read_customer(id: str, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders_count = db.query(Order).filter(Order.customerId == c.id).count()
    return schemas.CustomerResponse(
        id=c.id,
        name=c.name,
        email=c.email,
        phone=c.phone,
        createdAt=c.createdAt,
        updatedAt=c.updatedAt,
        _count=schemas.CountModel(orders=orders_count)
    )


@app.post("/api/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Validation: Customer email must be unique
    existing = db.query(Customer).filter(Customer.email == customer.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email {customer.email} already exists"
        )
    
    new_cust = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    
    return schemas.CustomerResponse(
        id=new_cust.id,
        name=new_cust.name,
        email=new_cust.email,
        phone=new_cust.phone,
        createdAt=new_cust.createdAt,
        updatedAt=new_cust.updatedAt,
        _count=schemas.CountModel(orders=0)
    )


@app.put("/api/customers/{id}", response_model=schemas.CustomerResponse)
@app.put("/customers/{id}", response_model=schemas.CustomerResponse)
def update_customer(id: str, cust_update: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    if cust_update.email and cust_update.email != db_cust.email:
        existing = db.query(Customer).filter(Customer.email == cust_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email address already in use")

    for key, value in cust_update.model_dump(exclude_unset=True).items():
        setattr(db_cust, key, value)

    db_cust.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_cust)

    orders_count = db.query(Order).filter(Order.customerId == id).count()
    return schemas.CustomerResponse(
        id=db_cust.id,
        name=db_cust.name,
        email=db_cust.email,
        phone=db_cust.phone,
        createdAt=db_cust.createdAt,
        updatedAt=db_cust.updatedAt,
        _count=schemas.CountModel(orders=orders_count)
    )


@app.delete("/api/customers/{id}")
@app.delete("/customers/{id}")
def delete_customer(id: str, db: Session = Depends(get_db)):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders_count = db.query(Order).filter(Order.customerId == id).count()
    if orders_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Customer cannot be deleted because they have associated orders. Delete those orders first."
        )

    db.delete(db_cust)
    db.commit()
    return {"message": "Customer deleted successfully"}


# ==========================================
# 4. ORDER ENDPOINTS
# ==========================================
@app.get("/api/orders", response_model=List[schemas.OrderResponse])
@app.get("/orders", response_model=List[schemas.OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.createdAt.desc()).all()
    results = []
    
    for o in orders:
        items = []
        for item in o.orderItems:
            items.append(
                schemas.OrderItemResponse(
                    id=item.id,
                    productId=item.productId,
                    quantity=item.quantity,
                    unitPrice=item.unitPrice,
                    product=schemas.ProductBrief(
                        name=item.product.name,
                        sku=item.product.sku
                    )
                )
            )
        results.append(
            schemas.OrderResponse(
                id=o.id,
                customerId=o.customerId,
                status=o.status,
                totalAmount=o.totalAmount,
                createdAt=o.createdAt,
                updatedAt=o.updatedAt,
                orderItems=items,
                customer=schemas.CustomerBrief(
                    name=o.customer.name,
                    email=o.customer.email,
                    phone=o.customer.phone
                )
            )
        )
    return results


@app.get("/api/orders/{id}", response_model=schemas.OrderResponse)
@app.get("/orders/{id}", response_model=schemas.OrderResponse)
def read_order(id: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = []
    for item in o.orderItems:
        items.append(
            schemas.OrderItemResponse(
                id=item.id,
                productId=item.productId,
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                product=schemas.ProductBrief(
                    name=item.product.name,
                    sku=item.product.sku
                )
            )
        )
    return schemas.OrderResponse(
        id=o.id,
        customerId=o.customerId,
        status=o.status,
        totalAmount=o.totalAmount,
        createdAt=o.createdAt,
        updatedAt=o.updatedAt,
        orderItems=items,
        customer=schemas.CustomerBrief(
            name=o.customer.name,
            email=o.customer.email,
            phone=o.customer.phone
        )
    )


@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate Customer exists
    db_cust = db.query(Customer).filter(Customer.id == order.customerId).first()
    if not db_cust:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer not found (ID: {order.customerId})"
        )

    try:
        total_amount = 0.0
        order_items_to_create = []

        # Validate products and stock first (row locking transaction)
        for item in order.items:
            db_prod = db.query(Product).filter(Product.id == item.productId).with_for_update().first()
            if not db_prod:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product not found (ID: {item.productId})"
                )

            # Business Logic: Orders cannot be placed if inventory is insufficient
            if db_prod.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for \"{db_prod.name}\". Available: {db_prod.quantity}, Ordered: {item.quantity}"
                )

            # Deduct stock
            db_prod.quantity -= item.quantity
            item_total = db_prod.price * item.quantity
            total_amount += item_total

            order_items_to_create.append({
                "product_id": db_prod.id,
                "quantity": item.quantity,
                "unit_price": db_prod.price,
                "product_model": db_prod
            })

        # Create Order record (Total amount automatically calculated by backend)
        new_order = Order(
            customerId=order.customerId,
            status="PENDING",
            totalAmount=total_amount
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # Create OrderItem records
        created_items = []
        for i_data in order_items_to_create:
            oi = OrderItem(
                orderId=new_order.id,
                productId=i_data["product_id"],
                quantity=i_data["quantity"],
                unitPrice=i_data["unit_price"]
            )
            db.add(oi)
            db.commit()
            db.refresh(oi)
            
            created_items.append(
                schemas.OrderItemResponse(
                    id=oi.id,
                    productId=oi.productId,
                    quantity=oi.quantity,
                    unitPrice=oi.unitPrice,
                    product=schemas.ProductBrief(
                        name=i_data["product_model"].name,
                        sku=i_data["product_model"].sku
                    )
                )
            )

        db.commit()
        
        return schemas.OrderResponse(
            id=new_order.id,
            customerId=new_order.customerId,
            status=new_order.status,
            totalAmount=new_order.totalAmount,
            createdAt=new_order.createdAt,
            updatedAt=new_order.updatedAt,
            orderItems=created_items,
            customer=schemas.CustomerBrief(
                name=db_cust.name,
                email=db_cust.email,
                phone=db_cust.phone
            )
        )
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to place order: {str(e)}"
        )


@app.put("/api/orders/{id}/status", response_model=schemas.OrderResponse)
@app.put("/orders/{id}/status", response_model=schemas.OrderResponse)
def update_order_status(id: str, status_payload: schemas.OrderUpdateStatus, db: Session = Depends(get_db)):
    new_status = status_payload.status
    
    db_order = db.query(Order).filter(Order.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status == new_status:
        items = []
        for item in db_order.orderItems:
            items.append(
                schemas.OrderItemResponse(
                    id=item.id,
                    productId=item.productId,
                    quantity=item.quantity,
                    unitPrice=item.unitPrice,
                    product=schemas.ProductBrief(
                        name=item.product.name,
                        sku=item.product.sku
                    )
                )
            )
        return schemas.OrderResponse(
            id=db_order.id,
            customerId=db_order.customerId,
            status=db_order.status,
            totalAmount=db_order.totalAmount,
            createdAt=db_order.createdAt,
            updatedAt=db_order.updatedAt,
            orderItems=items,
            customer=schemas.CustomerBrief(
                name=db_order.customer.name,
                email=db_order.customer.email,
                phone=db_order.customer.phone
            )
        )

    try:
        # Stock corrections on transitions
        if new_status == "CANCELLED" and db_order.status != "CANCELLED":
            for item in db_order.orderItems:
                db_prod = db.query(Product).filter(Product.id == item.productId).with_for_update().first()
                if db_prod:
                    db_prod.quantity += item.quantity

        if db_order.status == "CANCELLED" and new_status != "CANCELLED":
            for item in db_order.orderItems:
                db_prod = db.query(Product).filter(Product.id == item.productId).with_for_update().first()
                if not db_prod:
                    raise Exception(f"Product not found (ID: {item.productId})")
                if db_prod.quantity < item.quantity:
                    raise Exception(
                        f"Cannot restore order. Insufficient stock for \"{db_prod.name}\". "
                        f"Available: {db_prod.quantity}, Needs: {item.quantity}"
                    )
                db_prod.quantity -= item.quantity

        db_order.status = new_status
        db_order.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(db_order)

        items = []
        for item in db_order.orderItems:
            items.append(
                schemas.OrderItemResponse(
                    id=item.id,
                    productId=item.productId,
                    quantity=item.quantity,
                    unitPrice=item.unitPrice,
                    product=schemas.ProductBrief(
                        name=item.product.name,
                        sku=item.product.sku
                    )
                )
            )
        return schemas.OrderResponse(
            id=db_order.id,
            customerId=db_order.customerId,
            status=db_order.status,
            totalAmount=db_order.totalAmount,
            createdAt=db_order.createdAt,
            updatedAt=db_order.updatedAt,
            orderItems=items,
            customer=schemas.CustomerBrief(
                name=db_order.customer.name,
                email=db_order.customer.email,
                phone=db_order.customer.phone
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update order status: {str(e)}"
        )


@app.delete("/api/orders/{id}")
@app.delete("/orders/{id}")
def delete_order(id: str, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        # Restore stock if the order is active (not already cancelled)
        if o.status != "CANCELLED":
            for item in o.orderItems:
                db_prod = db.query(Product).filter(Product.id == item.productId).with_for_update().first()
                if db_prod:
                    db_prod.quantity += item.quantity
        
        db.delete(o)
        db.commit()
        return {"message": "Order deleted and stock returned to inventory successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to delete/cancel order: {str(e)}"
        )
