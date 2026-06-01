from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

# ==========================================
# 1. CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class CountModel(BaseModel):
    orders: int

class CustomerResponse(CustomerBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    count: Optional[CountModel] = Field(None, alias="_count")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ==========================================
# 2. PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float
    quantity: int
    minStockLevel: int
    category: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    minStockLevel: Optional[int] = None
    category: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. ORDER SCHEMAS
# ==========================================
class ProductBrief(BaseModel):
    name: str
    sku: str

    model_config = ConfigDict(from_attributes=True)

class CustomerBrief(BaseModel):
    name: str
    email: str
    phone: str

    model_config = ConfigDict(from_attributes=True)

class OrderItemResponse(BaseModel):
    id: str
    productId: str
    quantity: int
    unitPrice: float
    product: Optional[ProductBrief] = None

    model_config = ConfigDict(from_attributes=True)

class OrderItemCreate(BaseModel):
    productId: str
    quantity: int

class OrderCreate(BaseModel):
    customerId: str
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: str
    customerId: str
    status: str
    totalAmount: float
    createdAt: datetime
    updatedAt: datetime
    orderItems: List[OrderItemResponse]
    customer: Optional[CustomerBrief] = None

    model_config = ConfigDict(from_attributes=True)

class OrderUpdateStatus(BaseModel):
    status: str


# ==========================================
# 4. ANALYTICS SCHEMA
# ==========================================
class MetricModel(BaseModel):
    totalSales: float
    pendingOrders: int
    lowStockAlerts: int
    totalProducts: int
    totalCustomers: int
    totalOrders: int

class LowStockProductModel(BaseModel):
    id: str
    sku: str
    name: str
    quantity: int
    minStockLevel: int
    status: str

class SalesTrendModel(BaseModel):
    date: str
    sales: float
    count: int

class TopProductModel(BaseModel):
    id: str
    name: str
    sku: str
    unitsSold: int
    revenue: float

class AnalyticsResponse(BaseModel):
    metrics: MetricModel
    lowStockProducts: List[LowStockProductModel]
    salesTrend: List[SalesTrendModel]
    topProducts: List[TopProductModel]
