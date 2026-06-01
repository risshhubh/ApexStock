import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Customer(Base):
    __tablename__ = "Customer"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    __tablename__ = "Product"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    minStockLevel = Column(Integer, default=5, nullable=False)
    category = Column(String, nullable=False)

    orderItems = relationship("OrderItem", back_populates="product")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Order(Base):
    __tablename__ = "Order"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customerId = Column(String, ForeignKey("Customer.id"), nullable=False)
    status = Column(String, default="PENDING", nullable=False) # PENDING, SHIPPED, DELIVERED, CANCELLED
    totalAmount = Column(Float, nullable=False)
    
    customer = relationship("Customer", back_populates="orders")
    orderItems = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    orderId = Column(String, ForeignKey("Order.id", ondelete="CASCADE"), nullable=False)
    productId = Column(String, ForeignKey("Product.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=False)

    order = relationship("Order", back_populates="orderItems")
    product = relationship("Product", back_populates="orderItems")
