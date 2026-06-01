import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import Customer, Product, Order, OrderItem

def seed_db():
    print("Seeding database...")
    db = SessionLocal()
    try:
        # Drop and recreate tables to apply schema migrations/changes cleanly
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        # 1. Create Customers
        c1 = Customer(
            name="Acme Corp",
            email="purchasing@acme.com",
            phone="+1-555-0199"
        )
        c2 = Customer(
            name="Jane Doe",
            email="jane.doe@gmail.com",
            phone="+1-555-0142"
        )
        c3 = Customer(
            name="Wayne Enterprises",
            email="bwayne@wayne.corp",
            phone="+1-555-0188"
        )
        db.add_all([c1, c2, c3])
        db.commit()
        print("Created customers")

        # 2. Create Products
        p1 = Product(
            sku="EL-001",
            name="ThinkPad X1 Carbon",
            description="High-end ultrabook with Intel i7, 16GB RAM, 512GB SSD",
            price=1499.99,
            quantity=15,
            minStockLevel=5,
            category="Electronics"
        )
        p2 = Product(
            sku="EL-002",
            name="UltraWide Monitor 34\"",
            description="34-inch curved IPS monitor with 144Hz refresh rate",
            price=499.99,
            quantity=8,
            minStockLevel=3,
            category="Electronics"
        )
        p3 = Product(
            sku="EL-003",
            name="Wireless Ergonomic Mouse",
            description="Ergonomic mouse with dual-mode connectivity and rechargeable battery",
            price=79.99,
            quantity=45,
            minStockLevel=10,
            category="Electronics"
        )
        p4 = Product(
            sku="OF-101",
            name="Steelcase Gesture Chair",
            description="Premium ergonomic office chair with adjustable armrests and lumbar support",
            price=999.99,
            quantity=4,
            minStockLevel=5,
            category="Office Furniture"
        )
        db.add_all([p1, p2, p3, p4])
        db.commit()
        print("Created products")

        # 3. Create Orders
        order1 = Order(
            customerId=c1.id,
            status="DELIVERED",
            totalAmount=3999.96,
            createdAt=datetime.utcnow() - timedelta(days=15)
        )
        db.add(order1)
        db.commit() # commit to get order1.id
        
        oi1_1 = OrderItem(orderId=order1.id, productId=p1.id, quantity=2, unitPrice=1499.99)
        oi1_2 = OrderItem(orderId=order1.id, productId=p2.id, quantity=2, unitPrice=499.99)
        db.add_all([oi1_1, oi1_2])

        order2 = Order(
            customerId=c2.id,
            status="SHIPPED",
            totalAmount=1159.97,
            createdAt=datetime.utcnow() - timedelta(days=5)
        )
        db.add(order2)
        db.commit()
        
        oi2_1 = OrderItem(orderId=order2.id, productId=p4.id, quantity=1, unitPrice=999.99)
        oi2_2 = OrderItem(orderId=order2.id, productId=p3.id, quantity=2, unitPrice=79.99)
        db.add_all([oi2_1, oi2_2])

        order3 = Order(
            customerId=c3.id,
            status="PENDING",
            totalAmount=579.98,
            createdAt=datetime.utcnow() - timedelta(days=1)
        )
        db.add(order3)
        db.commit()
        
        oi3_1 = OrderItem(orderId=order3.id, productId=p2.id, quantity=1, unitPrice=499.99)
        oi3_2 = OrderItem(orderId=order3.id, productId=p3.id, quantity=1, unitPrice=79.99)
        db.add_all([oi3_1, oi3_2])

        order4 = Order(
            customerId=c2.id,
            status="CANCELLED",
            totalAmount=1579.98,
            createdAt=datetime.utcnow() - timedelta(days=12)
        )
        db.add(order4)
        db.commit()
        
        oi4_1 = OrderItem(orderId=order4.id, productId=p1.id, quantity=1, unitPrice=1499.99)
        oi4_2 = OrderItem(orderId=order4.id, productId=p3.id, quantity=1, unitPrice=79.99)
        db.add_all([oi4_1, oi4_2])

        db.commit()
        print("Created orders")
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
